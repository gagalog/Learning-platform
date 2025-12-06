import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ArticleCard from '../components/Content/ArticleCard';
import VideoCard from '../components/Content/VideoCard';
import './Home.css';

const Home = ({ filter }) => {
	const [content, setContent] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		fetchContent();
	}, []);

	const fetchContent = async () => {
		setLoading(true);
		try {
			const allContent = await api.getHomeContent();

			// 排序：按点击数与发布时间
			const sortedContent = allContent.sort((a, b) => {
				const aClicks = a.clickCount || 0;
				const bClicks = b.clickCount || 0;

				if (bClicks !== aClicks) return bClicks - aClicks;
				return new Date(b.publishedAt) - new Date(a.publishedAt);
			});

			setContent(sortedContent);
		} catch (err) {
			console.error('获取内容失败:', err);
			setError('加载内容失败，请稍后重试');
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		const trimmedQuery = searchQuery.trim();

		if (trimmedQuery) {
			navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
		} else {
			alert('请输入搜索关键词');
		}
	};

	const handleContentClick = async (id, contentType) => {
		try {
			await api.recordView(contentType, id);
			navigate(`/${contentType}/${id}`);
		} catch (err) {
			console.error('记录点击失败:', err);
		}
	};

	const displayed = filter ? content.filter(c => c.contentType === filter) : content;

	return (
		<div className="home-container">
			<div className="hero-section">
				<h1>欢迎来到在线学习平台</h1>
				<p>学习前沿技术，提升自我能力</p>

				<form onSubmit={handleSearch} className="search-form">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="搜索文章或视频..."
						className="search-input"
					/>
					<button type="submit" className="search-button">搜索</button>
				</form>
			</div>

			<div className="content-section">
				<h2>{filter ? (filter === 'article' ? '文章' : '视频') : '热门内容'}</h2>

				{loading ? (
					<div className="loading">加载中...</div>
				) : error ? (
					<div className="error">{error}</div>
				) : displayed.length === 0 ? (
					<div className="no-content">暂无内容</div>
				) : (
					<div className="articles-grid">
						{displayed.map((item) => (
							item.contentType === 'article' ? (
								<ArticleCard
									key={item.id}
									article={item}
									onClick={() => handleContentClick(item.id, 'article')}
								/>
							) : (
								<VideoCard
									key={item.id}
									video={item}
									onClick={() => handleContentClick(item.id, 'video')}
								/>
							)
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Home;