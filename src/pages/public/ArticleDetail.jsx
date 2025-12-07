import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import CommentSection from '../../components/Content/CommentSection';
import './ArticleDetail.css';

const formatDate = (value) => {
	if (!value) return '';
	return new Date(value).toLocaleString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

const ArticleDetail = () => {
	const { id } = useParams();
	const [article, setArticle] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadArticle() {
			if (!id) return;
			setLoading(true);
			setError('');
			try {
				const data = await api.getArticle(id);
				setArticle(data);
			} catch (err) {
				console.error('Failed to load article:', err);
				setError('文章加载失败，请稍后再试');
			} finally {
				setLoading(false);
			}
		}
		loadArticle();
	}, [id]);

	if (loading) {
		return <div className="article-detail">加载中...</div>;
	}

	if (error) {
		return <div className="article-detail">{error}</div>;
	}

	if (!article) {
		return <div className="article-detail">未找到文章</div>;
	}

	return (
		<div className="article-detail">
			<h1>{article.title}</h1>
			<div className="meta">
				<span>作者：{article.author || '佚名'}</span>
				<span>发布时间：{formatDate(article.publishedAt)}</span>
				<span>阅读数：{article.clickCount || 0}</span>
				{article.tags?.length > 0 && <span>标签：{article.tags.join(' / ')}</span>}
			</div>
			<div className="content" dangerouslySetInnerHTML={{ __html: article.content || '暂无内容' }} />
			{article.keywords?.length > 0 && (
				<p>关键词：{article.keywords.join(' / ')}</p>
			)}
			<div id="comments-section">
				<CommentSection contentType="article" contentId={article.id || article._id} />
			</div>
		</div>
	);
};

export default ArticleDetail;