const express = require('express');
const Article = require('../models/Article');
const Video = require('../models/Video');
const { getRandomWallpaper } = require('../utils/wallpaperService');

const router = express.Router();

const HOME_CACHE_TTL = 60 * 1000; // 60 seconds cache window
let homeCache = {
	data: null,
	expiresAt: 0,
};

const mapArticle = (doc) => {
	if (!doc) return null;
	const obj = doc.toObject({ versionKey: false });
	obj.id = obj._id.toString();
	obj.contentType = 'article';
	return obj;
};

const mapVideo = (doc) => {
	if (!doc) return null;
	const obj = doc.toObject({ versionKey: false });
	obj.id = obj._id.toString();
	obj.contentType = 'video';
	return obj;
};

const ensureThumbnail = async (item) => {
	if (!item) return item;
	const hasCustom = item.contentType === 'article'
		? Boolean(item.thumbnail)
		: Boolean(item.thumbnailUrl);
	if (hasCustom) return item;
	const wallpaper = await getRandomWallpaper();
	if (!wallpaper) return item;
	if (item.contentType === 'article') {
		return { ...item, thumbnail: wallpaper };
	}
	return { ...item, thumbnailUrl: wallpaper };
};

router.get('/home', async (req, res) => {
	try {
		if (homeCache.data && homeCache.expiresAt > Date.now()) {
			res.set('Cache-Control', 'public, max-age=30');
			return res.json(homeCache.data);
		}

		const [articles, videos] = await Promise.all([
			Article.find().sort({ clickCount: -1, createdAt: -1 }).limit(6),
			Video.find().sort({ clickCount: -1, createdAt: -1 }).limit(6)
		]);
		const merged = [...articles.map(mapArticle), ...videos.map(mapVideo)];
		const enhanced = await Promise.all(merged.map(ensureThumbnail));
		homeCache = {
			data: enhanced,
			expiresAt: Date.now() + HOME_CACHE_TTL,
		};
		res.set('Cache-Control', 'public, max-age=30');
		res.json(enhanced);
	} catch (err) {
		console.error('Failed to fetch home content:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.get('/search', async (req, res) => {
	try {
		const keyword = req.query.q;
		if (!keyword) {
			return res.status(400).json({ message: 'Missing search keyword' });
		}
		const regex = { $regex: keyword, $options: 'i' };
		const [articles, videos] = await Promise.all([
			Article.find({ $or: [{ title: regex }, { description: regex }, { content: regex }] })
				.sort({ createdAt: -1 })
				.limit(20),
			Video.find({ $or: [{ title: regex }, { description: regex }, { tags: regex }] })
				.sort({ createdAt: -1 })
				.limit(20)
		]);

		const scored = [
			...articles.map((item) => ({ ...mapArticle(item), relevanceScore: item.clickCount || 0 })),
			...videos.map((item) => ({ ...mapVideo(item), relevanceScore: item.clickCount || 0 }))
		];

		res.json(scored);
	} catch (err) {
		console.error('Search failed:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.get('/wallpaper/hero', async (req, res) => {
	try {
		const category = req.query.category;
		const url = await getRandomWallpaper(category || 'wallpaper');
		if (!url) {
			return res.status(503).json({ message: '暂时无法获取壁纸' });
		}
		res.json({ url });
	} catch (err) {
		console.error('Failed to fetch hero wallpaper:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
