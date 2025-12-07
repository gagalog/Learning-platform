const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const sanitizeUser = (user) => {
	if (!user) return null;
	const obj = user.toObject({ versionKey: false });
	delete obj.password;
	obj.id = obj._id.toString();
	return obj;
};

const signToken = (user) => {
	const secret = process.env.JWT_SECRET || 'dev-secret';
	return jwt.sign(
		{
			sub: user._id.toString(),
			role: user.role,
			email: user.email
		},
		secret,
		{ expiresIn: '7d' }
	);
};

router.post('/register', async (req, res) => {
	try {
		const { name, email, password } = req.body || {};
		if (!name || !email || !password) {
			return res.status(400).json({ message: '姓名、邮箱、密码均为必填' });
		}
		const existing = await User.findOne({ email: email.toLowerCase() });
		if (existing) {
			return res.status(409).json({ message: '该邮箱已注册' });
		}
		const hashed = await bcrypt.hash(password, 10);
		const user = await User.create({
			name,
			email,
			password: hashed,
			role: 'user'
		});
		const token = signToken(user);
		res.status(201).json({ user: sanitizeUser(user), token });
	} catch (err) {
		console.error('Register failed:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ message: '邮箱和密码为必填项' });
		}
		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ message: '邮箱或密码错误' });
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: '邮箱或密码错误' });
		}
		const token = signToken(user);
		res.json({ user: sanitizeUser(user), token });
	} catch (err) {
		console.error('Login failed:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
