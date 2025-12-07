const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    tags: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    thumbnail: { type: String, default: '' },
    author: { type: String, default: 'Admin' },
    category: { type: String, default: '' },
    publishedAt: { type: Date, default: Date.now },
    clickCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;