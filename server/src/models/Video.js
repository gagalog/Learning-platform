const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		videoUrl: { type: String, required: true },
		duration: { type: Number, default: 0 },
		tags: { type: [String], default: [] },
		thumbnail: { type: String, default: '' },
		keywords: { type: [String], default: [] },
		category: { type: String, default: '' },
		clickCount: { type: Number, default: 0 },
		commentCount: { type: Number, default: 0 },
		author: { type: String, default: 'Admin' }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Video', videoSchema);
