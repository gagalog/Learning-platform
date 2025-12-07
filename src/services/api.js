import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000
});

const unwrap = (promise) => promise.then((res) => res.data);

const base = {
	get: (url, config) => unwrap(apiClient.get(url, config)),
	post: (url, data, config) => unwrap(apiClient.post(url, data, config)),
	put: (url, data, config) => unwrap(apiClient.put(url, data, config)),
	delete: (url, config) => unwrap(apiClient.delete(url, config))
};

export const api = {
	client: apiClient,
	...base,
	// 首页及通用内容
	getHomeContent: () => base.get('/home'),
	getHeroWallpaper: (category) => base.get('/wallpaper/hero', { params: category ? { category } : undefined }),
	searchContent: (keyword) => base.get('/search', { params: { q: keyword } }),
	recordView: (contentType, contentId) => base.post('/analytics/views', { contentType, contentId }),
	// 文章
	getArticle: (id) => base.get(`/articles/${id}`),
	getAllArticles: (page = 1, limit = 10) => base.get('/articles', { params: { page, limit } }),
	searchArticles: (keyword, page = 1, limit = 10) => base.get('/articles/search', { params: { q: keyword, page, limit } }),
	createArticle: (data) => base.post('/articles', data),
	updateArticle: (id, data) => base.put(`/articles/${id}`, data),
	deleteArticle: (id) => base.delete(`/articles/${id}`),
	// 视频
	getVideo: (id) => base.get(`/videos/${id}`),
	getAllVideos: (page = 1, limit = 10) => base.get('/videos', { params: { page, limit } }),
	searchVideos: (keyword, page = 1, limit = 10) => base.get('/videos/search', { params: { q: keyword, page, limit } }),
	createVideo: (data) => base.post('/videos', data),
	updateVideo: (id, data) => base.put(`/videos/${id}`, data),
	deleteVideo: (id) => base.delete(`/videos/${id}`),
	// 评论
	getComments: async (contentType, contentId) => {
		const result = await base.get('/comments', { params: { contentType, contentId, limit: 100 } });
		return result?.data ?? result;
	},
	getAllComments: (pageOrParams = 1, limit = 10) => {
		const params = typeof pageOrParams === 'object'
			? pageOrParams
			: { page: pageOrParams, limit };
		return base.get('/comments', { params });
	},
	searchComments: (keyword, page = 1, limit = 10) => base.get('/comments/search', { params: { q: keyword, page, limit } }),
	postComment: (data) => base.post('/comments', data),
	deleteComment: (id) => base.delete(`/comments/${id}`),
	toggleLike: (commentId, userId) => base.post(`/comments/${commentId}/likes`, { userId }),
	checkUserLike: (commentId, userId) => base.get(`/comments/${commentId}/likes/${userId}`),
	// 用户
	getAllUsers: (page = 1, limit = 10) => base.get('/users', { params: { page, limit } }),
	createUser: (data) => base.post('/users', data),
	updateUserProfile: (id, payload) => base.put(`/users/${id}/profile`, payload),
	updateUserAvatar: (id, avatar) => base.put(`/users/${id}/avatar`, { avatar }),
	uploadUserAvatar: (id, file) => {
		const formData = new FormData();
		formData.append('avatar', file);
		return unwrap(
			apiClient.post(`/users/${id}/avatar/upload`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			})
		);
	},
	deleteUser: (id) => base.delete(`/users/${id}`),
	deleteUsers: (ids) => base.post('/users/bulk-delete', { ids }),
	// 认证
	register: async (data) => {
		const result = await base.post('/auth/register', data);
		return { data: result };
	},
	login: async (email, password) => {
		const result = await base.post('/auth/login', { email, password });
		return { data: result };
	}
};

// 供新的调用方式渐进迁移使用
export const fetchArticles = async () => {
	const result = await api.get('/articles');
	return result?.data ?? result;
};

export const fetchArticleById = (id) => api.get(`/articles/${id}`);

export default api;