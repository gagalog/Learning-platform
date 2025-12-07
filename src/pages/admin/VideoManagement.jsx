import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
// 复用文章管理页面的样式
import './AdminStyles.css';

const VideoManagement = () => {
	const [videos, setVideos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedVideos, setSelectedVideos] = useState([]);
	const [searchKeyword, setSearchKeyword] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [activeKeyword, setActiveKeyword] = useState('');

	const itemsPerPage = 10;

	const fetchVideos = useCallback(async () => {
		setLoading(true);
		try {
			const keyword = activeKeyword.trim();
			const response = keyword
				? await api.searchVideos(keyword, currentPage, itemsPerPage)
				: await api.getAllVideos(currentPage, itemsPerPage);

			let dataset = Array.isArray(response.data) ? response.data : [];
			if (filterStatus === 'recent') {
				const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
				dataset = dataset.filter((video) => new Date(video.publishedAt).getTime() >= weekAgo);
			} else if (filterStatus === 'popular') {
				dataset = dataset.filter((video) => (video.clickCount || 0) >= 100);
			} else if (filterStatus === 'unviewed') {
				dataset = dataset.filter((video) => (video.status || 'pending') === 'pending');
			}

			setVideos(dataset);
			setTotalPages(Math.max(1, Math.ceil((response.total || dataset.length || 1) / itemsPerPage)));
			setSelectedVideos([]);
		} catch (error) {
			console.error('获取视频列表失败:', error);
			// 可以添加更友好的错误提示
		} finally {
			setLoading(false);
		}
	}, [activeKeyword, currentPage, filterStatus, itemsPerPage]);

	useEffect(() => {
		fetchVideos();
	}, [fetchVideos]);

	const handleSearch = () => {
		setCurrentPage(1);
		setActiveKeyword(searchKeyword.trim());
	};

	const handleDelete = async (id) => {
		if (!window.confirm('确定要删除这个视频吗？相关评论也会被删除。')) {
			return;
		}

		try {
			await api.deleteVideo(id);
			// 从当前状态中移除已删除的视频
			setVideos(videos.filter(video => video.id !== id));
			// 同时从选中列表中移除（如果存在）
			setSelectedVideos(selectedVideos.filter(videoId => videoId !== id));
			alert('删除成功');
		} catch (error) {
			console.error('删除视频失败:', error);
			alert('删除失败，请重试');
		}
	};

	const handleBulkDelete = async () => {
		if (selectedVideos.length === 0) {
			alert('请先选择要删除的视频');
			return;
		}

		if (!window.confirm(`确定要删除选中的 ${selectedVideos.length} 个视频吗？`)) {
			return;
		}

		try {
			const deletePromises = selectedVideos.map(id => api.deleteVideo(id));
			await Promise.all(deletePromises);
			// 批量删除后，从列表中移除
			setVideos(videos.filter(video => !selectedVideos.includes(video.id)));
			setSelectedVideos([]);
			alert(`成功删除 ${selectedVideos.length} 个视频`);
		} catch (error) {
			console.error('批量删除失败:', error);
			alert('删除过程中出现错误');
		}
	};

	const toggleSelectAll = () => {
		if (selectedVideos.length === videos.length) {
			setSelectedVideos([]);
		} else {
			setSelectedVideos(videos.map(video => video.id));
		}
	};

	const toggleSelectVideo = (id) => {
		if (selectedVideos.includes(id)) {
			setSelectedVideos(selectedVideos.filter(videoId => videoId !== id));
		} else {
			setSelectedVideos([...selectedVideos, id]);
		}
	};

	// 格式化日期显示
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
				<h2>视频管理</h2>
				<div className="header-actions">
					<Link to="/admin/videos/new" className="btn btn-primary">
						+ 上传新视频
					</Link>
				</div>
			</div>

			{/* 工具栏 */}
			<div className="management-toolbar">
				<div className="search-box">
					<input
						type="text"
						placeholder="搜索视频标题或描述..."
						value={searchKeyword}
						onChange={(e) => setSearchKeyword(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleSearch();
							}
						}}
					/>
					<button
						className="btn btn-primary search-btn"
						type="button"
						onClick={handleSearch}
					>
						搜索
					</button>
				</div>

				<div className="filter-options">
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="filter-select"
					>
						<option value="all">全部视频</option>
						<option value="recent">最近一周</option>
						<option value="popular">热门视频</option>
						<option value="unviewed">待审核</option>
					</select>

					{selectedVideos.length > 0 && (
						<button
							onClick={handleBulkDelete}
							className="btn btn-danger bulk-delete-btn"
						>
							删除选中 ({selectedVideos.length})
						</button>
					)}
				</div>
			</div>

			{/* 视频列表表格 */}
			{loading ? (
				<div className="loading-state">
					<div className="loading-spinner"></div>
					<p>加载视频列表中...</p>
				</div>
			) : (
				<div className="content-table-container">
					{videos.length > 0 ? (
						<>
							<table className="content-table">
								<thead>
									<tr>
										<th width="50">
											<input
												type="checkbox"
												checked={videos.length > 0 && selectedVideos.length === videos.length}
												onChange={toggleSelectAll}
												className="select-all-checkbox"
											/>
										</th>
										<th width="50">ID</th>
										<th>视频信息</th>
										<th width="120">时长</th>
										<th width="120">发布时间</th>
										<th width="100">播放量</th>
										<th width="100">评论</th>
										<th width="200">操作</th>
									</tr>
								</thead>
								<tbody>
									{videos.map((video) => (
										<tr key={video.id} className="video-row">
											<td>
												<input
													type="checkbox"
													checked={selectedVideos.includes(video.id)}
													onChange={() => toggleSelectVideo(video.id)}
													className="video-checkbox"
												/>
											</td>
											<td className="video-id">{video.id}</td>
											<td>
												<Link to={`/video/${video.id}`} target="_blank" className="video-title">
													{video.title}
												</Link>
											</td>
											<td className="video-duration">
												{video.duration || '--:--'}
											</td>
											<td className="video-date">
												{formatDate(video.publishedAt)}
											</td>
											<td className="video-views">
												<span className="views-count">{video.clickCount || 0}</span>
												<span className="views-label">次播放</span>
											</td>
											<td className="video-comments">
												{video.commentCount || 0}
											</td>
											<td>
												<div className="action-buttons">
													<Link
														to={`/admin/videos/edit/${video.id}`}
														className="btn btn-sm btn-edit"
													>
														编辑
													</Link>
													<Link
														to={`/video/${video.id}`}
														target="_blank"
														className="btn btn-sm btn-view"
													>
														预览
													</Link>
													<button
														onClick={() => handleDelete(video.id)}
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

							{/* 分页组件 */}
							{totalPages > 1 && (
								<div className="pagination">
									<button
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
										disabled={currentPage === 1}
										className="page-btn prev-btn"
									>
										&lt; 上一页
									</button>

									<div className="page-numbers">
										{(() => {
											// 生成分页按钮
											const buttons = [];
											const maxVisible = 5;
											let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
											const endPage = Math.min(totalPages, startPage + maxVisible - 1);

											if (endPage - startPage + 1 < maxVisible) {
												startPage = Math.max(1, endPage - maxVisible + 1);
											}

											for (let i = startPage; i <= endPage; i++) {
												buttons.push(
													<button
														key={i}
														onClick={() => setCurrentPage(i)}
														className={`page-btn ${currentPage === i ? 'active' : ''}`}
													>
														{i}
													</button>
												);
											}
											return buttons;
										})()}
									</div>

									<button
										onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
										disabled={currentPage === totalPages}
										className="page-btn next-btn"
									>
										下一页 &gt;
									</button>

									<div className="page-info">
										第 {currentPage} 页 / 共 {totalPages} 页
									</div>
								</div>
							)}
						</>
					) : (
						<div className="empty-state">
							<div className="empty-icon">🎬</div>
							<h3>暂无视频内容</h3>
							<p>还没有上传任何视频，开始创建第一个视频吧！</p>
							<Link to="/admin/videos/new" className="btn btn-primary">
								上传视频
							</Link>
						</div>
					)}
				</div>
			)}

			{/* 统计信息栏 */}
			<div className="stats-bar">
				<div className="stat-item">
					<span className="stat-label">视频总数:</span>
					<span className="stat-value">{videos.length}</span>
				</div>
				<div className="stat-item">
					<span className="stat-label">总播放量:</span>
					<span className="stat-value">
						{videos.reduce((sum, video) => sum + (video.clickCount || 0), 0)}
					</span>
				</div>
				<div className="stat-item">
					<span className="stat-label">平均播放:</span>
					<span className="stat-value">
						{videos.length > 0
							? Math.round(videos.reduce((sum, video) => sum + (video.clickCount || 0), 0) / videos.length)
							: 0}
					</span>
				</div>
			</div>
		</div>
	);
};

export default VideoManagement;