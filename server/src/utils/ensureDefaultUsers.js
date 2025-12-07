const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function ensureDefaultUsers() {
	const users = [
		{ name: '管理员', email: 'admin@test.com', password: 'admin123', role: 'admin' },
		{ name: '普通用户', email: 'user@test.com', password: 'user123', role: 'user' }
	];

	for (const user of users) {
		const existing = await User.findOne({ email: user.email });
		if (!existing) {
			const hashed = await bcrypt.hash(user.password, 10);
			await User.create({ ...user, password: hashed });
			console.log(`Seeded default user: ${user.email}`);
		}
	}
}

module.exports = ensureDefaultUsers;
