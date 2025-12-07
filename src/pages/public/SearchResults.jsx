import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import ArticleCard from '../../components/Content/ArticleCard';
import VideoCard from '../../components/Content/VideoCard';
import './SearchResults.css';

const SearchResults = () => {
	// 获取URL中的查询参数
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	// 从URL参数中获取搜索关键词
	const keyword = searchParams.get('q') || '';

	// 组件状态
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [sortBy, setSortBy] = useState('relevance'); // 'relevance' 或 'date'

	// 当关键词变化时执行搜索
	useEffect(() => {
		if (keyword) {
			performSearch(keyword);
		} else {
			setResults([]); // 没有关键词时清空结果
		}
	}, [keyword]);

	// 执行搜索的函数
	const performSearch = async (searchKeyword) => {
		setLoading(true);
		setError('');

		try {
			const searchResults = await api.searchContent(searchKeyword);
			setResults(searchResults);
		} catch (err) {
			console.error('搜索出错:', err);
			setError('搜索过程中出现错误，请稍后重试。');
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	// 处理排序方式变化
	const handleSortChange = (newSortBy) => {
		setSortBy(newSortBy);

		const sortedResults = [...results];
		if (newSortBy === 'date') {
			// 按发布时间排序 (最新的在前)
			sortedResults.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
		} else {
			// 按相关度排序 (默认)
			sortedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
		}

		setResults(sortedResults);
	};

	// 处理内容点击，记录点击量并跳转
	const handleContentClick = async (event, id, contentType) => {
		if (event) {
			event.preventDefault();
		}

		try {
			await api.recordView(contentType, id);
			navigate(`/${contentType}/${id}`);
		} catch (error) {
			console.error('记录点击失败:', error);
			navigate(`/${contentType}/${id}`);
		}
	};

	// 高亮显示关键词的函数
	const highlightText = (text) => {
		if (!text || !keyword) return text;

		const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
		return parts.map((part, index) =>
			part.toLowerCase() === keyword.toLowerCase() ?
				<mark key={index} className="highlight">{part}</mark> :
				part
		);
	};

	// 如果没有关键词
	if (!keyword.trim()) {
		return (
			<section className="search-results">
				<header className="search-header">
					<h1>搜索</h1>
					<p className="search-meta">请输入搜索关键词以开始探索内容。</p>
				</header>
			</section>
		);
	}

	// 主渲染
	return (
		<section className="search-results">
			<header className="search-header">
				<h1>
					搜索结果: <span className="keyword">"{keyword}"</span>
				</h1>
				<p className="search-meta">
					找到 {results.length} 个结果
					{loading && ' (搜索中...)'}
				</p>
			</header>

			{results.length > 0 && (
				<div className="search-toolbar page-toolbar">
					<span>排序方式</span>
					<div className="chip-group">
						<button
							className={`sort-btn ${sortBy === 'relevance' ? 'active' : ''}`}
							onClick={() => handleSortChange('relevance')}
						>
							相关度
						</button>
						<button
							className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
							onClick={() => handleSortChange('date')}
						>
							最新发布
						</button>
					</div>
				</div>
			)}

			{error && (
				<div className="error-message">
					⚠️ {error}
				</div>
			)}

			{loading ? (
				<div className="loading-panel">
					<div className="spinner"></div>
					<p>正在搜索 "{keyword}"...</p>
				</div>
			) : results.length === 0 ? (
				<div className="no-results">
					<div className="no-results-icon">🔍</div>
					<h3>没有找到与 "{keyword}" 相关的内容</h3>
					<p>试试以下建议：</p>
					<ul>
						<li>检查关键词拼写是否正确</li>
						<li>尝试更简短或更通用的词汇</li>
						<li>浏览我们的 <a href="/">首页</a> 发现更多内容</li>
					</ul>
				</div>
			) : (
				<div className="results-grid">
					{results.map((item) => (
						<div key={`${item.contentType}-${item.id}`} className="result-item">
							{item.contentType === 'article' ? (
								<>
									<ArticleCard
										article={item}
										onClick={(e) => handleContentClick(e, item.id, 'article')}
									/>
									<div
										className="result-snippet"
										onClick={(e) => handleContentClick(e, item.id, 'article')}
									>
										{highlightText(item.description?.substring(0, 150) || '')}
										{item.description && item.description.length > 150 && '...'}
									</div>
								</>
							) : (
								<>
									<VideoCard
										video={item}
										onClick={(e) => handleContentClick(e, item.id, 'video')}
									/>
									<div
										className="result-snippet"
										onClick={(e) => handleContentClick(e, item.id, 'video')}
									>
										{highlightText(item.description?.substring(0, 150) || '')}
										{item.description && item.description.length > 150 && '...'}
									</div>
								</>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
};

export default SearchResults;