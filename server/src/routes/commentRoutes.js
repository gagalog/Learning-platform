const express = require('express');
const Comment = require('../models/Comment');

const router = express.Router();

const mapComment = (comment) => {
	if (!comment) return null;
	const obj = comment.toObject({ versionKey: false });
	obj.id = obj._id.toString();
	return obj;
};

const parsePagination = (query) => {
	const page = Math.max(parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
	const skip = (page - 1) * limit;
	return { page, limit, skip };
};

router.get('/', async (req, res) => {
	try {
		const filter = {};
		if (req.query.contentType) {
			filter.contentType = req.query.contentType;
		}
		if (req.query.contentId) {
			filter.contentId = req.query.contentId;
		}

		const { page, limit, skip } = parsePagination(req.query);
		const [items, total] = await Promise.all([
			Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Comment.countDocuments(filter)
		]);

		res.json({ data: items.map(mapComment), total, page, limit });
	} catch (err) {
		console.error('Failed to fetch comments:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.get('/search', async (req, res) => {
	try {
		if (!req.query.q) {
			return res.status(400).json({ message: 'Missing search keyword' });
		}
		const filter = {
			content: { $regex: req.query.q, $options: 'i' }
		};
		const { page, limit, skip } = parsePagination(req.query);
		const [items, total] = await Promise.all([
			Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Comment.countDocuments(filter)
		]);
		res.json({ data: items.map(mapComment), total, page, limit });
	} catch (err) {
		console.error('Comment search failed:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/', async (req, res) => {
	try {
		const payload = req.body || {};
		if (!payload.userId || !payload.userName || !payload.content) {
			return res.status(400).json({ message: 'Missing required fields' });
		}
		const comment = await Comment.create({
			contentType: payload.contentType || 'article',
			contentId: payload.contentId,
			userId: payload.userId,
			userName: payload.userName,
			userAvatar: payload.userAvatar || '',
			content: payload.content
		});
		res.status(201).json(mapComment(comment));
	} catch (err) {
		console.error('Failed to create comment:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const comment = await Comment.findByIdAndDelete(req.params.id);
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' });
		}
		res.json({ message: 'Comment deleted' });
	} catch (err) {
		console.error('Failed to delete comment:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/:id/likes', async (req, res) => {
	try {
		const { userId } = req.body || {};
		if (!userId) {
			return res.status(400).json({ message: 'userId is required' });
		}
		const comment = await Comment.findById(req.params.id);
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' });
		}
		const hasLiked = comment.likedBy.includes(userId);
		if (hasLiked) {
			comment.likedBy = comment.likedBy.filter((id) => id !== userId);
			comment.likes = Math.max(0, comment.likes - 1);
		} else {
			comment.likedBy.push(userId);
			comment.likes += 1;
		}
		await comment.save();
		res.json({ liked: !hasLiked, likes: comment.likes });
	} catch (err) {
		console.error('Failed to toggle like:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.get('/:id/likes/:userId', async (req, res) => {
	try {
		const comment = await Comment.findById(req.params.id);
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' });
		}
		const liked = comment.likedBy.includes(req.params.userId);
		res.json({ liked });
	} catch (err) {
		console.error('Failed to check like:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
