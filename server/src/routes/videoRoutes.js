const express = require('express');
const Video = require('../models/Video');

const router = express.Router();

const mapVideo = (video) => {
	if (!video) return null;
	const obj = video.toObject({ versionKey: false });
	obj.id = obj._id.toString();
	obj.contentType = 'video';
	return obj;
};

const buildFilter = (query) => {
	const filter = {};
	if (query.q) {
		filter.$or = [
			{ title: { $regex: query.q, $options: 'i' } },
			{ description: { $regex: query.q, $options: 'i' } },
			{ tags: { $regex: query.q, $options: 'i' } }
		];
	}
	if (query.category) {
		filter.category = query.category;
	}
	return filter;
};

const parsePagination = (query) => {
	const page = Math.max(parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
	const skip = (page - 1) * limit;
	return { page, limit, skip };
};

router.get('/', async (req, res) => {
	try {
		const filter = buildFilter(req.query);
		const { page, limit, skip } = parsePagination(req.query);
		const [items, total] = await Promise.all([
			Video.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Video.countDocuments(filter)
		]);
		res.json({ data: items.map(mapVideo), total, page, limit });
	} catch (err) {
		console.error('Failed to fetch videos:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.get('/search', async (req, res) => {
	try {
		if (!req.query.q) {
			return res.status(400).json({ message: 'Missing search keyword' });
		}
		const filter = buildFilter(req.query);
		const { page, limit, skip } = parsePagination(req.query);
		const [items, total] = await Promise.all([
			Video.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Video.countDocuments(filter)
		]);
		res.json({ data: items.map(mapVideo), total, page, limit });
	} catch (err) {
		console.error('Video search failed:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/', async (req, res) => {
	try {
		const payload = req.body || {};
		const video = await Video.create({
			title: payload.title,
			description: payload.description || '',
			videoUrl: payload.videoUrl,
			duration: payload.duration || 0,
			tags: payload.tags || [],
			thumbnail: payload.thumbnail || '',
			keywords: payload.keywords || [],
			category: payload.category || '',
			author: payload.author || 'Admin'
		});
		res.status(201).json(mapVideo(video));
	} catch (err) {
		console.error('Failed to create video:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.put('/:id', async (req, res) => {
	try {
		const update = req.body || {};
		const video = await Video.findByIdAndUpdate(req.params.id, update, { new: true });
		if (!video) {
			return res.status(404).json({ message: 'Video not found' });
		}
		res.json(mapVideo(video));
	} catch (err) {
		console.error('Failed to update video:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const video = await Video.findByIdAndDelete(req.params.id);
		if (!video) {
			return res.status(404).json({ message: 'Video not found' });
		}
		res.json({ message: 'Video deleted' });
	} catch (err) {
		console.error('Failed to delete video:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const video = await Video.findById(req.params.id);
		if (!video) {
			return res.status(404).json({ message: 'Video not found' });
		}
		res.json(mapVideo(video));
	} catch (err) {
		console.error('Failed to fetch video:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
