const express = require('express');
const Article = require('../models/Article');
const Video = require('../models/Video');

const router = express.Router();

router.post('/views', async (req, res) => {
	try {
		const { contentType, contentId } = req.body || {};
		if (!contentType || !contentId) {
			return res.status(400).json({ message: 'contentType 和 contentId 必填' });
		}

		if (contentType === 'article') {
			const article = await Article.findByIdAndUpdate(
				contentId,
				{ $inc: { clickCount: 1 } },
				{ new: true }
			);
			if (!article) {
				return res.status(404).json({ message: 'Article not found' });
			}
			return res.json({ success: true, clickCount: article.clickCount });
		}

		if (contentType === 'video') {
			const video = await Video.findByIdAndUpdate(
				contentId,
				{ $inc: { clickCount: 1 } },
				{ new: true }
			);
			if (!video) {
				return res.status(404).json({ message: 'Video not found' });
			}
			return res.json({ success: true, clickCount: video.clickCount });
		}

		res.status(400).json({ message: 'Unsupported content type' });
	} catch (err) {
		console.error('Failed to record view:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
