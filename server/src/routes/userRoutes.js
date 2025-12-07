const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const router = express.Router();
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
const avatarDir = path.join(uploadsRoot, 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (_, __, cb) => cb(null, avatarDir),
	filename: (_, file, cb) => {
		const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `${unique}${ext}`);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 2 * 1024 * 1024 },
	fileFilter: (_, file, cb) => {
		if (!file.mimetype?.startsWith('image/')) {
			return cb(new Error('仅支持图片文件'));
		}
		cb(null, true);
	}
});

const sanitizeUser = (user) => {
	if (!user) return null;
	const obj = user.toObject({ versionKey: false });
	delete obj.password;
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
		const { page, limit, skip } = parsePagination(req.query);
		const [users, total] = await Promise.all([
			User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
			User.countDocuments()
		]);
		res.json({ data: users.map(sanitizeUser), total, page, limit });
	} catch (err) {
		console.error('Failed to fetch users:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/', async (req, res) => {
	try {
		const payload = req.body || {};
		if (!payload.email || !payload.password || !payload.name) {
			return res.status(400).json({ message: '缺少必填字段' });
		}
		const existing = await User.findOne({ email: payload.email.toLowerCase() });
		if (existing) {
			return res.status(409).json({ message: '该邮箱已注册' });
		}
		const hashed = await bcrypt.hash(payload.password, 10);
		const user = await User.create({
			name: payload.name,
			email: payload.email,
			password: hashed,
			role: payload.role || 'user',
			avatar: payload.avatar || ''
		});
		res.status(201).json(sanitizeUser(user));
	} catch (err) {
		console.error('Failed to create user:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.put('/:id/avatar', async (req, res) => {
	try {
		const { avatar } = req.body || {};
		if (typeof avatar !== 'string') {
			return res.status(400).json({ message: 'avatar 字段必须是字符串' });
		}
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ avatar },
			{ new: true }
		);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json(sanitizeUser(user));
	} catch (err) {
		console.error('Failed to update avatar:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.put('/:id/profile', async (req, res) => {
	try {
		const name = req.body?.name?.trim();
		if (!name) {
			return res.status(400).json({ message: '姓名不能为空' });
		}
		if (name.length > 40) {
			return res.status(400).json({ message: '姓名长度不能超过 40 个字符' });
		}
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ name },
			{ new: true }
		);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json(sanitizeUser(user));
	} catch (err) {
		console.error('Failed to update profile:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/:id/avatar/upload', (req, res, next) => {
	upload.single('avatar')(req, res, (err) => {
		if (err) {
			const message = err.message === 'File too large'
				? '头像文件不能超过 2MB'
				: err.message || '上传失败';
			return res.status(400).json({ message });
		}
		next();
	});
}, async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: '请提供头像文件' });
		}
		const baseUrl = process.env.FILE_BASE_URL || `${req.protocol}://${req.get('host')}`;
		const relativePath = `/uploads/avatars/${req.file.filename}`;
		const avatar = `${baseUrl}${relativePath}`;
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ avatar },
			{ new: true }
		);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json(sanitizeUser(user));
	} catch (err) {
		console.error('Failed to upload avatar:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json({ message: 'User deleted' });
	} catch (err) {
		console.error('Failed to delete user:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/bulk-delete', async (req, res) => {
	try {
		const ids = req.body?.ids || [];
		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({ message: '请选择要删除的用户' });
		}
		await User.deleteMany({ _id: { $in: ids } });
		res.json({ message: '用户已删除' });
	} catch (err) {
		console.error('Failed to bulk delete users:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
