require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('../models/Video');

async function main() {
	const uri = process.env.MONGO_URI;
	if (!uri) {
		console.error('MONGO_URI is not set in .env');
		process.exit(1);
	}

	try {
		await mongoose.connect(uri);
		console.log('MongoDB connected for video seeding');
		await Video.deleteMany({});
		console.log('Cleared existing videos');

		const videos = await Video.insertMany([
			{
				title: 'React Hooks 速成课',
				description: '掌握 useState、useEffect 等常用 Hooks，写出更简洁的组件。',
				videoUrl: 'https://www.bilibili.com/video/BV1VJ411r7sG',
				tags: ['React', 'Hooks'],
				keywords: ['react', 'hooks']
			},
			{
				title: 'Node.js API 实战',
				description: '带你从零搭建一个 Node.js + Express 的后端服务。',
				videoUrl: 'https://www.bilibili.com/video/BV1wV411e7gT',
				tags: ['Node', 'Express'],
				keywords: ['node', 'express']
			}
		]);

		console.log(`Inserted ${videos.length} videos`);
	} catch (err) {
		console.error('Video seeding failed:', err);
	} finally {
		await mongoose.disconnect();
		console.log('MongoDB disconnected');
		process.exit(0);
	}
}

main();
