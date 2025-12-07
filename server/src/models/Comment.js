const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
	{
		contentType: { type: String, enum: ['article', 'video'], required: true },
		contentId: { type: String, required: true },
		userId: { type: String, required: true },
		userName: { type: String, required: true },
		userAvatar: { type: String, default: '' },
		content: { type: String, required: true },
		likes: { type: Number, default: 0 },
		likedBy: { type: [String], default: [] }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
