import axios from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
	baseURL: 'http://localhost:3001',
	headers: {
		'Content-Type': 'application/json',
	},
});

// 请求拦截器：添加认证 token
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// 响应拦截器：统一处理错误
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

// 相关度计算函数
function calculateRelevance(item, keyword) {
	const lowerKeyword = keyword.toLowerCase();
	let score = 0;

	// 标题匹配权重最高
	if (item.title && item.title.toLowerCase().includes(lowerKeyword)) {
		score += 10;
	}

	// 描述匹配权重中等
	if (item.description && item.description.toLowerCase().includes(lowerKeyword)) {
		score += 5;
	}

	// 标签匹配权重中等
	if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))) {
		score += 5;
	}

	// 内容匹配权重较低
	if (item.content && item.content.toLowerCase().includes(lowerKeyword)) {
		score += 1;
	}

	// 考虑时间因素：越新的内容分数越高
	const daysOld = (new Date() - new Date(item.publishedAt)) / (1000 * 60 * 60 * 24);
	const timeBonus = Math.max(0, 30 - daysOld) / 3;
	score += timeBonus;

	return score;
}

export const api = {
	// ========== 基础内容 API ==========

	// 获取首页内容（文章和视频）
	async getHomeContent() {
		try {
			const [articlesRes, videosRes] = await Promise.all([
				apiClient.get('/articles'),
				apiClient.get('/videos')
			]);
			const articles = articlesRes.data.map(item => ({ ...item, contentType: 'article' }));
			const videos = videosRes.data.map(item => ({ ...item, contentType: 'video' }));
			return [...articles, ...videos];
		} catch (error) {
			console.error('获取首页内容失败:', error);
			return [];
		}
	},

	// 获取单篇文章详情
	async getArticle(id) {
		const response = await apiClient.get(`/articles/${id}`);
		return response.data;
	},

	// 获取单个视频详情
	async getVideo(id) {
		const response = await apiClient.get(`/videos/${id}`);
		return response.data;
	},

	// 记录点击量
	async recordView(contentType, id) {
		try {
			const response = await apiClient.get(`/${contentType}s/${id}`);
			const currentItem = response.data;
			await apiClient.patch(`/${contentType}s/${id}`, {
				clickCount: (currentItem.clickCount || 0) + 1
			});
		} catch (error) {
			console.error('记录点击失败:', error);
		}
	},

	// ========== 搜索功能 API ==========

	// 搜索内容
	async searchContent(keyword) {
		if (!keyword || keyword.trim() === '') {
			return [];
		}

		try {
			const [articlesRes, videosRes] = await Promise.all([
				apiClient.get(`/articles?q=${encodeURIComponent(keyword)}`),
				apiClient.get(`/videos?q=${encodeURIComponent(keyword)}`)
			]);

			const processedArticles = articlesRes.data.map(item => ({
				...item,
				contentType: 'article',
				relevanceScore: calculateRelevance(item, keyword)
			}));

			const processedVideos = videosRes.data.map(item => ({
				...item,
				contentType: 'video',
				relevanceScore: calculateRelevance(item, keyword)
			}));

			const allResults = [...processedArticles, ...processedVideos];
			return allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
		} catch (error) {
			console.error('搜索失败:', error);
			throw new Error('搜索服务暂时不可用');
		}
	},

	// ========== 评论系统 API ==========

	// 获取评论列表
	async getComments(contentType, contentId) {
		const response = await apiClient.get(`/comments?contentType=${contentType}&contentId=${contentId}&_sort=createdAt&_order=desc`);
		return response.data;
	},

	// 提交新评论
	async postComment(commentData) {
		const newComment = {
			...commentData,
			createdAt: new Date().toISOString(),
			likes: 0
		};
		const response = await apiClient.post('/comments', newComment);
		return response.data;
	},

	// 删除评论
	async deleteComment(commentId) {
		const response = await apiClient.delete(`/comments/${commentId}`);
		return response.data;
	},

	// 检查用户点赞状态
	async checkUserLike(commentId, userId) {
		if (!userId) return false;
		const response = await apiClient.get(`/userLikes?commentId=${commentId}&userId=${userId}`);
		return response.data.length > 0;
	},

	// 切换点赞状态
	async toggleLike(commentId, userId) {
		if (!userId) throw new Error('请先登录');

		// 检查当前是否已点赞
		const checkResponse = await apiClient.get(`/userLikes?commentId=${commentId}&userId=${userId}`);
		const existingLike = checkResponse.data[0];

		if (existingLike) {
			// 取消点赞
			await apiClient.delete(`/userLikes/${existingLike.id}`);
			const commentRes = await apiClient.get(`/comments/${commentId}`);
			const currentLikes = commentRes.data.likes || 0;
			await apiClient.patch(`/comments/${commentId}`, {
				likes: Math.max(0, currentLikes - 1)
			});
			return { liked: false };
		} else {
			// 点赞
			const newLike = { userId, commentId };
			await apiClient.post('/userLikes', newLike);
			const commentRes = await apiClient.get(`/comments/${commentId}`);
			const currentLikes = commentRes.data.likes || 0;
			await apiClient.patch(`/comments/${commentId}`, {
				likes: currentLikes + 1
			});
			return { liked: true };
		}
	},

	// ========== 用户认证 API ==========

	// 用户登录
	async login(email, password) {
		try {
			// 从db.json的users数组中查找匹配的用户
			const response = await apiClient.get(`/users?email=${email}`);
			const users = response.data;

			// 检查用户是否存在
			if (users.length === 0) {
				throw new Error('用户不存在');
			}

			const user = users[0];

			// 验证密码
			if (user.password !== password) {
				throw new Error('密码错误');
			}

			// 登录成功，返回用户信息（移除密码等敏感信息）
			const { password: _, ...userWithoutPassword } = user;

			return {
				data: {
					user: userWithoutPassword,
					token: `fake-jwt-token-${user.id}`
				}
			};
		} catch (error) {
			if (error.message === '用户不存在' || error.message === '密码错误') {
				throw error;
			}
			console.error('登录请求失败:', error);
			throw new Error('登录服务异常，请稍后重试');
		}
	},

	// 用户注册
	async register(userData) {
		try {
			// 检查邮箱是否已存在
			const checkResponse = await apiClient.get(`/users?email=${userData.email}`);
			if (checkResponse.data.length > 0) {
				throw new Error('该邮箱已被注册');
			}

			// 创建新用户对象
			const newUser = {
				name: userData.name,
				email: userData.email,
				password: userData.password,
				role: 'user',
				createdAt: new Date().toISOString()
			};

			// 保存到 db.json
			const response = await apiClient.post('/users', newUser);

			// 返回创建的用户（移除密码）
			const { password: _, ...userWithoutPassword } = response.data;

			return {
				data: {
					user: userWithoutPassword,
					token: `fake-jwt-token-${response.data.id}`
				}
			};
		} catch (error) {
			if (error.message === '该邮箱已被注册') {
				throw error;
			}
			console.error('注册请求失败:', error);
			throw new Error('注册失败，请稍后重试');
		}
	},

	// ========== 管理后台 API ==========

	// 获取所有文章（带分页）
	async getAllArticles(page = 1, limit = 20) {
		const response = await apiClient.get(`/articles?_page=${page}&_limit=${limit}&_sort=publishedAt&_order=desc`);
		let total = parseInt(response.headers['x-total-count'] || '0');
		// 如果后端没有返回 X-Total-Count，退回到使用响应数据长度作为总数，或发起一次不分页的请求获取实际总数
		if (!total) {
			if (Array.isArray(response.data) && response.data.length > 0) {
				total = response.data.length;
			} else {
				try {
					const all = await apiClient.get('/articles');
					total = Array.isArray(all.data) ? all.data.length : 0;
				} catch (e) {
					// 忽略次请求错误，保持 total 为 0
				}
			}
		}
		return {
			data: response.data,
			total,
			page,
			limit
		};
	},

	async searchArticles(keyword, page = 1, limit = 20) {
		const trimmed = keyword?.trim();
		if (!trimmed) {
			return this.getAllArticles(page, limit);
		}
		const response = await apiClient.get(`/articles?q=${encodeURIComponent(trimmed)}&_page=${page}&_limit=${limit}&_sort=publishedAt&_order=desc`);
		let total = parseInt(response.headers['x-total-count'] || '0');
		if (!total) {
			total = Array.isArray(response.data) ? response.data.length : 0;
		}
		return {
			data: response.data,
			total,
			page,
			limit,
		};
	},

	// 获取所有视频（带分页）
	async getAllVideos(page = 1, limit = 20) {
		const response = await apiClient.get(`/videos?_page=${page}&_limit=${limit}&_sort=publishedAt&_order=desc`);
		let total = parseInt(response.headers['x-total-count'] || '0');
		if (!total) {
			if (Array.isArray(response.data) && response.data.length > 0) {
				total = response.data.length;
			} else {
				try {
					const all = await apiClient.get('/videos');
					total = Array.isArray(all.data) ? all.data.length : 0;
				} catch (e) { }
			}
		}
		return {
			data: response.data,
			total,
			page,
			limit
		};
	},

	async searchVideos(keyword, page = 1, limit = 20) {
		const trimmed = keyword?.trim();
		if (!trimmed) {
			return this.getAllVideos(page, limit);
		}
		const response = await apiClient.get(`/videos?q=${encodeURIComponent(trimmed)}&_page=${page}&_limit=${limit}&_sort=publishedAt&_order=desc`);
		let total = parseInt(response.headers['x-total-count'] || '0');
		if (!total) {
			total = Array.isArray(response.data) ? response.data.length : 0;
		}
		return {
			data: response.data,
			total,
			page,
			limit,
		};
	},

	// 获取所有评论（带分页）
	async getAllComments(page = 1, limit = 50) {
		const response = await apiClient.get(`/comments?_page=${page}&_limit=${limit}&_sort=createdAt&_order=desc`);
		let total = parseInt(response.headers['x-total-count'] || '0');
		if (!total) {
			if (Array.isArray(response.data) && response.data.length > 0) {
				total = response.data.length;
			} else {
				try {
					const all = await apiClient.get('/comments');
					total = Array.isArray(all.data) ? all.data.length : 0;
				} catch (e) { }
			}
		}
		return {
			data: response.data,
			total,
			page,
			limit
		};
	},

	// 根据评论内容进行模糊搜索（仅匹配 content 字段），若 keyword 为空则退回到 getAllComments
	async searchComments(keyword, page = 1, limit = 50) {
		if (!keyword || keyword.trim() === '') {
			return this.getAllComments(page, limit);
		}
		const q = encodeURIComponent(keyword);
		// 使用 content_like 仅在 content 字段上做模糊匹配
		const response = await apiClient.get(`/comments?content_like=${q}&_page=${page}&_limit=${limit}&_sort=createdAt&_order=desc`);
		return {
			data: response.data,
			total: parseInt(response.headers['x-total-count'] || '0'),
			page,
			limit
		};
	},

	// 获取所有用户（带分页）
	async getAllUsers(page = 1, limit = 50) {
		const response = await apiClient.get(`/users?_page=${page}&_limit=${limit}&_sort=createdAt&_order=desc`);
		// 移除敏感信息
		const safeUsers = response.data.map(user => {
			const { password, ...safeUser } = user;
			return safeUser;
		});
		let total = parseInt(response.headers['x-total-count'] || '0');
		if (!total) {
			if (Array.isArray(response.data) && response.data.length > 0) {
				total = response.data.length;
			} else {
				try {
					const all = await apiClient.get('/users');
					total = Array.isArray(all.data) ? all.data.length : 0;
				} catch (e) { }
			}
		}
		return {
			data: safeUsers,
			total,
			page,
			limit
		};
	},

	// 创建用户（管理员在后台创建）
	async createUser(userData) {
		const newUser = {
			...userData,
			createdAt: new Date().toISOString()
		};
		const response = await apiClient.post('/users', newUser);
		const { password, ...safeUser } = response.data;
		return { data: safeUser };
	},

	// 删除单个用户
	async deleteUser(id) {
		const response = await apiClient.delete(`/users/${id}`);
		return response.data;
	},

	// 批量删除用户（并发删除）
	async deleteUsers(userIds) {
		const results = await Promise.allSettled(
			userIds.map(id => apiClient.delete(`/users/${id}`))
		);
		const successful = results.filter(r => r.status === 'fulfilled').length;
		const failed = results.filter(r => r.status === 'rejected').length;
		return { successful, failed };
	},

	// 删除文章
	async deleteArticle(id) {
		try {
			// 先尝试删除相关评论（使用 try-catch 包裹，即使失败也继续）
			try {
				// json-server 删除所有匹配的评论
				await apiClient.delete(`/comments?contentId=${id}&contentType=article`);
				console.log(`已删除文章 ${id} 的相关评论`);
			} catch (commentError) {
				console.warn(`删除文章 ${id} 的评论时出错:`, commentError.message);
				// 评论删除失败不影响文章删除
			}

			// 删除文章本身
			const response = await apiClient.delete(`/articles/${id}`);
			console.log(`文章 ${id} 删除成功`);
			return response.data;
		} catch (error) {
			console.error(`删除文章 ${id} 失败:`, error);
			throw new Error(`删除文章失败: ${error.message}`);
		}
	},


	// 修改 deleteVideo 方法
	async deleteVideo(id) {
		try {
			// 先尝试删除相关评论
			try {
				await apiClient.delete(`/comments?contentId=${id}&contentType=video`);
				console.log(`已删除视频 ${id} 的相关评论`);
			} catch (commentError) {
				console.warn(`删除视频 ${id} 的评论时出错:`, commentError.message);
				// 评论删除失败不影响视频删除
			}

			// 删除视频本身
			const response = await apiClient.delete(`/videos/${id}`);
			console.log(`视频 ${id} 删除成功`);
			return response.data;
		} catch (error) {
			console.error(`删除视频 ${id} 失败:`, error);
			throw new Error(`删除视频失败: ${error.message}`);
		}
	},

	// 批量删除评论
	// 同时修改批量删除方法，增加错误处理
	async deleteComments(commentIds) {
		try {
			const results = await Promise.allSettled(
				commentIds.map(id => apiClient.delete(`/comments/${id}`))
			);

			// 统计成功和失败的数量
			const successful = results.filter(r => r.status === 'fulfilled').length;
			const failed = results.filter(r => r.status === 'rejected').length;

			if (failed > 0) {
				console.warn(`${successful} 条评论删除成功，${failed} 条删除失败`);
			}

			return { successful, failed };
		} catch (error) {
			console.error('批量删除评论失败:', error);
			throw new Error('批量删除评论失败');
		}
	},

	// 更新文章
	async updateArticle(id, articleData) {
		return apiClient.patch(`/articles/${id}`, articleData);
	},

	// 更新视频
	async updateVideo(id, videoData) {
		return apiClient.patch(`/videos/${id}`, videoData);
	},

	// 创建新文章
	async createArticle(articleData) {
		const newArticle = {
			...articleData,
			publishedAt: new Date().toISOString(),
			clickCount: 0,
			commentCount: 0
		};
		return apiClient.post('/articles', newArticle);
	},

	// 创建新视频
	async createVideo(videoData) {
		const newVideo = {
			...videoData,
			publishedAt: new Date().toISOString(),
			clickCount: 0,
			commentCount: 0
		};
		return apiClient.post('/videos', newVideo);
	}
};