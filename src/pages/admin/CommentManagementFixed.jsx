import React, { useEffect, useState } from 'react'
import { api } from '../../services/api'
import '../../pages/admin/AdminStyles.css'
import { useAuth } from '../../context/AuthContext'

const CommentManagementFixed = () => {
	const { user } = useAuth()
	const [comments, setComments] = useState([])
	const [loading, setLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedComments, setSelectedComments] = useState(new Set())
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const PAGE_SIZE = 10

	useEffect(() => {
		fetchComments(1)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	async function fetchComments(pageToFetch = 1) {
		setLoading(true)
		try {
			const res = await api.getAllComments({ page: pageToFetch, limit: PAGE_SIZE })
			const total = res.total || res.length || 0
			setComments(res.data || res)
			setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
			setCurrentPage(pageToFetch)
			setSelectedComments(new Set())
		} catch (err) {
			console.error('Failed to fetch comments', err)
		} finally {
			setLoading(false)
		}
	}

	async function handleSearch(e) {
		e.preventDefault()
		setLoading(true)
		try {
			const res = await api.searchComments(searchQuery, 1, PAGE_SIZE)
			const total = res.total || res.length || 0
			setComments(res.data || res)
			setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
			setCurrentPage(1)
			setSelectedComments(new Set())
		} catch (err) {
			console.error('Search failed', err)
		} finally {
			setLoading(false)
		}
	}

	async function handleDelete(id) {
		if (!window.confirm('确定要删除该评论吗？')) return
		try {
			await api.deleteComment(id)
			fetchComments(currentPage)
		} catch (err) {
			console.error('Delete failed', err)
		}
	}

	function toggleSelectComment(id) {
		const copy = new Set(selectedComments)
		if (copy.has(id)) copy.delete(id)
		else copy.add(id)
		setSelectedComments(copy)
	}

	function toggleSelectAll() {
		if (selectedComments.size === comments.length) {
			setSelectedComments(new Set())
		} else {
			setSelectedComments(new Set(comments.map((c) => c.id)))
		}
	}

	async function handleBulkDelete() {
		if (selectedComments.size === 0) return
		if (!window.confirm(`确定要删除选中的 ${selectedComments.size} 条评论吗？`)) return
		try {
			const ids = Array.from(selectedComments)
			await Promise.all(ids.map((id) => api.deleteComment(id)))
			fetchComments(currentPage)
		} catch (err) {
			console.error('Bulk delete failed', err)
		}
	}

	function formatDate(ts) {
		try {
			return new Date(ts).toLocaleString()
		} catch {
			return ts
		}
	}

	return (
		<div className="admin-page-container">
			<h2 className="admin-page-title">评论管理</h2>

			<div className="admin-toolbar">
				<form onSubmit={handleSearch} className="admin-search-form">
					<input
						type="text"
						placeholder="按评论内容搜索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<button type="submit">搜索</button>
				</form>

				<div className="admin-actions">
					<button onClick={() => fetchComments(1)}>刷新</button>
					<button onClick={handleBulkDelete} disabled={selectedComments.size === 0}>
						批量删除
					</button>
				</div>
			</div>

			<div className="content-table-container">
				<table className="content-table">
					<thead>
						<tr>
							<th style={{ width: '60px' }}>
								<input
									type="checkbox"
									checked={selectedComments.size === comments.length && comments.length > 0}
									onChange={toggleSelectAll}
								/>
							</th>
							<th style={{ width: '120px' }}>用户</th>
							<th>评论内容</th>
							<th style={{ width: '160px' }}>创建时间</th>
							<th style={{ width: '120px' }}>操作</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={5} className="loading-cell">
									加载中...
								</td>
							</tr>
						) : comments.length === 0 ? (
							<tr>
								<td colSpan={5} className="no-data-cell">
									暂无数据
								</td>
							</tr>
						) : (
							comments.map((c) => (
								<tr key={c.id}>
									<td>
										<input
											type="checkbox"
											checked={selectedComments.has(c.id)}
											onChange={() => toggleSelectComment(c.id)}
										/>
									</td>
									<td>{c.authorName || c.userId}</td>
									<td>
										<div className="comment-content-cell">{c.content}</div>
										<div className="comment-meta">关联内容: {c.contentType} #{c.contentId}</div>
									</td>
									<td>{formatDate(c.createdAt || c.timestamp || c.created)}</td>
									<td>
										<button className="danger" onClick={() => handleDelete(c.id)}>
											删除
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				<div className="pagination-container">
					<button onClick={() => fetchComments(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
						上一页
					</button>
					<span>
						第 {currentPage} 页 / 共 {totalPages} 页
					</span>
					<button
						onClick={() => fetchComments(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
					>
						下一页
					</button>
				</div>
			</div>
		</div>
	)
}

export default CommentManagementFixed
