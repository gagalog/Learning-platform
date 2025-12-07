require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');

async function main() {
	const uri = process.env.MONGO_URI;

	if (!uri) {
		console.error('MONGO_URI is not set in .env');
		process.exit(1);
	}

	try {
		await mongoose.connect(uri);
		console.log('MongoDB connected for seeding');

		// 清空原有文章（可选）
		await Article.deleteMany({});
		console.log('Cleared existing articles');

		// 插入几条测试数据
		const articles = await Article.insertMany([
			{
				title: 'React 入门指南',
				description: '从零开始了解 React 的核心概念。',
				content: '这里是文章的详细内容，可以写得很长很长……',
				thumbnail: '',
				author: 'Admin',
				tags: ['React', '前端'],
				keywords: ['react', 'frontend'],
				category: 'frontend',
				isPublished: true
			},
			{
				title: 'Node.js 与 Express 快速上手',
				description: '教你用 Express 搭建一个简单的 REST API。',
				content: 'Node.js 与 Express 的基础用法介绍……',
				thumbnail: '',
				author: 'Admin',
				tags: ['Node.js', '后端'],
				keywords: ['node', 'express'],
				category: 'backend',
				isPublished: true
			},
			{
				title: 'MongoDB 数据建模实践',
				description: '如何为在线学习平台设计合适的 MongoDB 模型。',
				content: '设计课程、章节、用户的文档结构……',
				thumbnail: '',
				author: 'Admin',
				tags: ['MongoDB', '数据库'],
				keywords: ['mongodb', 'database'],
				category: 'database',
				isPublished: true
			}
		]);

		console.log(`Inserted ${articles.length} articles`);
	} catch (err) {
		console.error('Seeding failed:', err);
	} finally {
		await mongoose.disconnect();
		console.log('MongoDB disconnected');
		process.exit(0);
	}
}

main();