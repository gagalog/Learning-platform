require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const articleRoutes = require('./routes/articleRoutes');
const videoRoutes = require('./routes/videoRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const contentRoutes = require('./routes/contentRoutes');
const ensureDefaultUsers = require('./utils/ensureDefaultUsers');

const app = express();
const PORT = process.env.PORT || 5001;
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// 连接数据库
connectDB().then(() => ensureDefaultUsers()).catch((err) => {
	console.error('Failed to ensure default users:', err);
});

// 中间件
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

// 路由
app.use('/api/articles', articleRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', contentRoutes); // /home, /search 等

// 简单健康检查
app.get('/', (req, res) => {
	res.send('API is running');
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});