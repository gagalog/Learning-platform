import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import './AdminStyles.css';

const ArticleManagement = () => {
	const [articles, setArticles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedArticles, setSelectedArticles] = useState([]);
	const [searchKeyword, setSearchKeyword] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [activeKeyword, setActiveKeyword] = useState('');

	const itemsPerPage = 10;

	useEffect(() => {
		fetchArticles();
	}, [currentPage, filterStatus, activeKeyword]);

	const fetchArticles = async () => {
		setLoading(true);
		try {
			const keyword = activeKeyword.trim();
			const response = keyword
				? await api.searchArticles(keyword, currentPage, itemsPerPage)
				: await api.getAllArticles(currentPage, itemsPerPage);

			let dataset = Array.isArray(response.data) ? response.data : [];
			if (filterStatus !== 'all') {
				dataset = dataset.filter((article) => {
					const status = article.status || 'published';
					if (filterStatus === 'published') return status === 'published';
					if (filterStatus === 'draft') return status === 'draft';
					return true;
				});
			}

			setArticles(dataset);
			setTotalPages(Math.max(1, Math.ceil((response.total || dataset.length || 1) / itemsPerPage)));
			setSelectedArticles([]);
		} catch (error) {
			console.error('获取文章失败:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		setCurrentPage(1);
		setActiveKeyword(searchKeyword.trim());
	};

	const handleDelete = async (id) => {
		if (!window.confirm('确定要删除这篇文章吗？相关评论也会被删除。')) {
			return;
		}

		try {
			await api.deleteArticle(id);
			// 从当前状态中移除已删除的文章
			setArticles(articles.filter(article => article.id !== id));
			// 同时从选中列表中移除（如果存在）
			setSelectedArticles(selectedArticles.filter(articleId => articleId !== id));

			// 使用更友好的提示
			alert('删除成功！');
		} catch (error) {
			console.error('删除失败:', error);
			// 更详细的错误提示
			alert(`删除失败: ${error.message}\n请检查控制台获取详细信息。`);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedArticles.length === 0) {
			alert('请先选择要删除的文章');
			return;
		}

		if (!window.confirm(`确定要删除选中的 ${selectedArticles.length} 篇文章吗？`)) {
			return;
		}

		try {
			const deletePromises = selectedArticles.map(id => api.deleteArticle(id));
			await Promise.all(deletePromises);
			setArticles(articles.filter(article => !selectedArticles.includes(article.id)));
			setSelectedArticles([]);
			alert('批量删除成功');
		} catch (error) {
			console.error('批量删除失败:', error);
			alert('部分删除失败');
		}
	};

	const toggleSelectAll = () => {
		if (selectedArticles.length === articles.length) {
			setSelectedArticles([]);
		} else {
			setSelectedArticles(articles.map(article => article.id));
		}
	};

	const toggleSelectArticle = (id) => {
		if (selectedArticles.includes(id)) {
			setSelectedArticles(selectedArticles.filter(articleId => articleId !== id));
		} else {
			setSelectedArticles([...selectedArticles, id]);
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return '今天';
		} else if (diffDays === 1) {
			return '昨天';
		} else if (diffDays < 7) {
			return `${diffDays}天前`;
		} else {
			return date.toLocaleDateString('zh-CN');
		}
	};

	return (
		<div className="content-management">
			<div className="management-header">
				<h2>文章管理</h2>
				<div className="header-actions">
					<Link to="/admin/articles/new" className="btn btn-primary">
						+ 新建文章
					</Link>
				</div>
			</div>

			{/* 工具栏 */}
			<div className="management-toolbar">
				<div className="search-box">
					<input
						type="text"
						placeholder="搜索文章标题..."
						value={searchKeyword}
						onChange={(e) => setSearchKeyword(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleSearch();
							}
						}}
					/>
					<button className="btn btn-primary search-btn" type="button" onClick={handleSearch}>
						搜索
					</button>
				</div>

				<div className="filter-options">
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
					>
						<option value="all">全部状态</option>
						<option value="published">已发布</option>
						<option value="draft">草稿</option>
					</select>

					{selectedArticles.length > 0 && (
						<button onClick={handleBulkDelete} className="btn btn-danger">
							删除选中 ({selectedArticles.length})
						</button>
					)}
				</div>
			</div>

			{/* 内容表格 */}
			{loading ? (
				<div className="loading-state">加载中...</div>
			) : (
				<div className="content-table-container">
					<table className="content-table">
						<thead>
							<tr>
								<th width="50">
									<input
										type="checkbox"
										checked={articles.length > 0 && selectedArticles.length === articles.length}
										onChange={toggleSelectAll}
									/>
								</th>
								<th width="50">ID</th>
								<th>标题</th>
								<th width="120">状态</th>
								<th width="120">发布时间</th>
								<th width="100">浏览</th>
								<th width="100">评论</th>
								<th width="200">操作</th>
							</tr>
						</thead>
						<tbody>
							{articles.map((article) => (
								<tr key={article.id}>
									<td>
										<input
											type="checkbox"
											checked={selectedArticles.includes(article.id)}
											onChange={() => toggleSelectArticle(article.id)}
										/>
									</td>
									<td>{article.id}</td>
									<td>
										<div className="article-title">
											<Link to={`/article/${article.id}`} target="_blank">
												{article.title}
											</Link>
											<div className="article-tags">
												{article.tags?.slice(0, 2).map(tag => (
													<span key={tag} className="tag">{tag}</span>
												))}
											</div>
										</div>
									</td>
									<td>
										<span className="status-badge published">已发布</span>
									</td>
									<td>{formatDate(article.publishedAt)}</td>
									<td>{article.clickCount || 0}</td>
									<td>{article.commentCount || 0}</td>
									<td>
										<div className="action-buttons">
											<Link
												to={`/admin/articles/edit/${article.id}`}
												className="btn btn-sm btn-edit"
											>
												编辑
											</Link>
											<Link
												to={`/article/${article.id}`}
												target="_blank"
												className="btn btn-sm btn-view"
											>
												查看
											</Link>
											<button
												onClick={() => handleDelete(article.id)}
												className="btn btn-sm btn-delete"
											>
												删除
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{articles.length === 0 && (
						<div className="empty-state">
							<div className="empty-icon">📝</div>
							<h3>暂无文章</h3>
							<p>还没有发布任何文章，开始创建第一篇吧！</p>
							<Link to="/admin/articles/new" className="btn btn-primary">
								创建文章
							</Link>
						</div>
					)}
				</div>
			)}

			{/* 分页 */}
			{totalPages > 1 && (
				<div className="pagination">
					<button
						onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
						disabled={currentPage === 1}
					>
						上一页
					</button>

					<div className="page-numbers">
						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							let pageNum;
							if (totalPages <= 5) {
								pageNum = i + 1;
							} else if (currentPage <= 3) {
								pageNum = i + 1;
							} else if (currentPage >= totalPages - 2) {
								pageNum = totalPages - 4 + i;
							} else {
								pageNum = currentPage - 2 + i;
							}

							return (
								<button
									key={pageNum}
									onClick={() => setCurrentPage(pageNum)}
									className={currentPage === pageNum ? 'active' : ''}
								>
									{pageNum}
								</button>
							);
						})}
					</div>

					<button
						onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
						disabled={currentPage === totalPages}
					>
						下一页
					</button>

					<span className="page-info">
						第 {currentPage} 页 / 共 {totalPages} 页
					</span>
				</div>
			)}
		</div>
	);
};

export default ArticleManagement;