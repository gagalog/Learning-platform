const express = require('express');
const Article = require('../models/Article');

const router = express.Router();

const mapArticle = (article) => {
	if (!article) return null;
	const obj = article.toObject({ versionKey: false });
	obj.id = obj._id.toString();
	obj.contentType = 'article';
	return obj;
};

const buildFilter = (query) => {
	const filter = {};
	if (query.q) {
		filter.$or = [
			{ title: { $regex: query.q, $options: 'i' } },
			{ description: { $regex: query.q, $options: 'i' } },
			{ content: { $regex: query.q, $options: 'i' } }
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

// GET /api/articles  - 列表 with pagination
router.get('/', async (req, res) => {
	try {
		const filter = buildFilter(req.query);
		const { page, limit, skip } = parsePagination(req.query);

		const [items, total] = await Promise.all([
			Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Article.countDocuments(filter)
		]);

		res.json({
			data: items.map(mapArticle),
			total,
			page,
			limit
		});
	} catch (err) {
		console.error('Failed to fetch articles:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// GET /api/articles/search
router.get('/search', async (req, res) => {
	try {
		if (!req.query.q) {
			return res.status(400).json({ message: 'Missing search keyword' });
		}
		const filter = buildFilter(req.query);
		const { page, limit, skip } = parsePagination(req.query);
		const [items, total] = await Promise.all([
			Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Article.countDocuments(filter)
		]);
		res.json({
			data: items.map(mapArticle),
			total,
			page,
			limit
		});
	} catch (err) {
		console.error('Article search failed:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// POST /api/articles
router.post('/', async (req, res) => {
	try {
		const payload = req.body || {};
		const article = await Article.create({
			title: payload.title,
			description: payload.description || payload.summary || '',
			content: payload.content || '',
			tags: payload.tags || [],
			keywords: payload.keywords || [],
			thumbnail: payload.thumbnail || payload.coverImage || '',
			author: payload.author || 'Admin',
			category: payload.category || '',
			publishedAt: payload.publishedAt || Date.now(),
			isPublished: payload.isPublished ?? true
		});
		res.status(201).json(mapArticle(article));
	} catch (err) {
		console.error('Failed to create article:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// PUT /api/articles/:id
router.put('/:id', async (req, res) => {
	try {
		const update = req.body || {};
		const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
		if (!article) {
			return res.status(404).json({ message: 'Article not found' });
		}
		res.json(mapArticle(article));
	} catch (err) {
		console.error('Failed to update article:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// DELETE /api/articles/:id
router.delete('/:id', async (req, res) => {
	try {
		const article = await Article.findByIdAndDelete(req.params.id);
		if (!article) {
			return res.status(404).json({ message: 'Article not found' });
		}
		res.json({ message: 'Article deleted' });
	} catch (err) {
		console.error('Failed to delete article:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// GET /api/articles/:id  - 详情
router.get('/:id', async (req, res) => {
	try {
		const article = await Article.findById(req.params.id);
		if (!article) {
			return res.status(404).json({ message: 'Article not found' });
		}
		res.json(mapArticle(article));
	} catch (err) {
		console.error('Failed to fetch article:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;