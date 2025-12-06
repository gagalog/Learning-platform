import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import './ArticleDetail.css';
import CommentSection from '../components/Content/CommentSection';

const ArticleDetail = () => {
	const { id } = useParams();
	const [article, setArticle] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchArticle = async () => {
			try {
				const data = await api.getArticle(id);
				setArticle(data);
				await api.recordView('article', id);
			} catch (error) {
				console.error('获取文章详情失败:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchArticle();
	}, [id]);

	if (loading) return <div className="loading">加载中...</div>;
	if (!article) return <div className="error">文章不存在</div>;

	return (
		<div className="article-detail">
			<h1>{article.title}</h1>
			<div className="meta">
				<span>📅 发布时间: {new Date(article.publishedAt).toLocaleDateString()}</span>
				<span>👁️ 浏览: {article.clickCount || 0}次</span>
				<span>🏷️ 标签: {article.tags?.join(', ') || '无'}</span>
			</div>
			<div className="content" dangerouslySetInnerHTML={{ __html: article.content }}>
			</div>
			<CommentSection contentType="article" contentId={id} />
		</div>
	);
};

export default ArticleDetail;