import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../services/api'
import './AdminStyles.css'

const PAGE_SIZE = 10

const CommentManagement = () => {
	const [tableState, setTableState] = useState({
		rows: [],
		loading: true,
		error: '',
		page: 1,
		totalPages: 1,
		total: 0,
	})
	const [searchInput, setSearchInput] = useState('')
	const [selected, setSelected] = useState(new Set())
	const queryRef = useRef('')

	const loadComments = useCallback(async ({ page = 1, keyword } = {}) => {
		setTableState((prev) => ({ ...prev, loading: true, error: '' }))
		const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : queryRef.current

		try {
			const response = normalizedKeyword
				? await api.searchComments(normalizedKeyword, page, PAGE_SIZE)
				: await api.getAllComments(page, PAGE_SIZE)

			const rows = response.data || []
			const total = Number(response.total) || rows.length || 0

			setTableState({
				rows,
				loading: false,
				error: '',
				page,
				totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
				total,
			})
			setSelected(new Set())
			if (keyword !== undefined) {
				queryRef.current = normalizedKeyword
			}
		} catch (error) {
			console.error('加载评论失败:', error)
			setTableState((prev) => ({
				...prev,
				loading: false,
				error: '加载评论失败，请稍后重试。',
				rows: [],
			}))
		}
	}, [])

	useEffect(() => {
		loadComments({ page: 1, keyword: '' })
	}, [loadComments])

	const toKey = (id) => String(id)
	const rowCount = tableState.rows.length
	const selectedCount = selected.size
	const hasSelection = selectedCount > 0
	const allSelected = rowCount > 0 && selectedCount === rowCount

	const pageNumbers = useMemo(() => {
		const pages = []
		const maxVisible = 5
		let start = Math.max(1, tableState.page - Math.floor(maxVisible / 2))
		const end = Math.min(tableState.totalPages, start + maxVisible - 1)
		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1)
		}
		for (let i = start; i <= end; i += 1) {
			pages.push(i)
		}
		return pages
	}, [tableState.page, tableState.totalPages])

	const formatDate = (value) => {
		if (!value) return '—'
		try {
			return new Date(value).toLocaleString()
		} catch (error) {
			return value
		}
	}

	const handleSearch = (event) => {
		event.preventDefault()
		loadComments({ page: 1, keyword: searchInput })
	}

	const handleRefresh = () => {
		setSearchInput('')
		queryRef.current = ''
		loadComments({ page: 1, keyword: '' })
	}

	const handleDelete = async (id) => {
		if (!window.confirm('确定要删除该评论吗？')) return
		try {
			await api.deleteComment(id)
			await loadComments({ page: tableState.page })
		} catch (error) {
			console.error('删除评论失败:', error)
			alert('删除失败，请稍后重试。')
		}
	}

	const handleBulkDelete = async () => {
		if (!hasSelection) return
		if (!window.confirm(`确定要删除选中的 ${selectedCount} 条评论吗？`)) return
		try {
			const ids = Array.from(selected)
			await Promise.all(ids.map((id) => api.deleteComment(id)))
			await loadComments({ page: tableState.page })
		} catch (error) {
			console.error('批量删除失败:', error)
			alert('部分评论删除失败，请稍后重试。')
		}
	}

	const toggleSelectAll = () => {
		if (allSelected) {
			setSelected(new Set())
			return
		}
		setSelected(new Set(tableState.rows.map((row) => toKey(row.id))))
	}

	const toggleSelectOne = (id) => {
		setSelected((prev) => {
			const draft = new Set(prev)
			const key = toKey(id)
			if (draft.has(key)) {
				draft.delete(key)
			} else {
				draft.add(key)
			}
			return draft
		})
	}

	const handlePageChange = (page) => {
		if (page === tableState.page) return
		loadComments({ page })
	}

	return (
		<div className="content-management">
			<div className="management-header">
				<h2>评论管理</h2>
				<div className="header-actions">
					<button type="button" className="btn btn-primary" onClick={handleRefresh}>
						刷新
					</button>
				</div>
			</div>

			<div className="management-toolbar">
				<form onSubmit={handleSearch} className="search-box">
					<input
						type="text"
						placeholder="按评论内容搜索..."
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
					/>
					<button type="submit" className="btn btn-primary">
						搜索
					</button>
				</form>

				<div className="filter-options">
					<span className="stat-label">
						当前显示 {rowCount} / {tableState.total || 0} 条评论
					</span>
					{queryRef.current && (
						<span className="stat-label">关键词：{queryRef.current}</span>
					)}
					{hasSelection && (
						<button type="button" className="btn btn-danger" onClick={handleBulkDelete}>
							删除选中 ({selectedCount})
						</button>
					)}
				</div>
			</div>

			<div className="content-table-container">
				{tableState.loading ? (
					<div className="loading-state">加载中...</div>
				) : tableState.error ? (
					<div className="empty-state">
						<div className="empty-icon">⚠️</div>
						<h3>数据加载失败</h3>
						<p>{tableState.error}</p>
						<button type="button" className="btn btn-primary" onClick={handleRefresh}>
							重新加载
						</button>
					</div>
				) : rowCount === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">💬</div>
						<h3>暂无评论</h3>
						<p>用户的评论会显示在这里，继续保持社区活跃吧！</p>
					</div>
				) : (
					<table className="content-table">
						<thead>
							<tr>
								<th width="60">
									<input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
								</th>
								<th width="160">用户</th>
								<th>评论内容</th>
								<th width="180">创建时间</th>
								<th width="140">操作</th>
							</tr>
						</thead>
						<tbody>
							{tableState.rows.map((comment) => (
								<tr key={comment.id}>
									<td>
										<input
											type="checkbox"
											checked={selected.has(toKey(comment.id))}
											onChange={() => toggleSelectOne(comment.id)}
										/>
									</td>
									<td>{comment.authorName || comment.userName || comment.userId || '匿名用户'}</td>
									<td>
										<div className="comment-content-cell">{comment.content}</div>
										<div className="comment-meta">
											关联内容: {comment.contentType || '未知'} #{comment.contentId || '—'}
										</div>
									</td>
									<td>{formatDate(comment.createdAt || comment.timestamp || comment.created)}</td>
									<td>
										<div className="action-buttons">
											<button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(comment.id)}>
												删除
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{!tableState.loading && !tableState.error && rowCount > 0 && tableState.totalPages > 1 && (
				<div className="pagination">
					<button
						type="button"
						className="page-btn"
						onClick={() => handlePageChange(Math.max(1, tableState.page - 1))}
						disabled={tableState.page === 1}
					>
						上一页
					</button>

					<div className="page-numbers">
						{pageNumbers.map((page) => (
							<button
								key={page}
								type="button"
								className={`page-btn ${tableState.page === page ? 'active' : ''}`}
								onClick={() => handlePageChange(page)}
							>
								{page}
							</button>
						))}
					</div>

					<button
						type="button"
						className="page-btn"
						onClick={() => handlePageChange(Math.min(tableState.totalPages, tableState.page + 1))}
						disabled={tableState.page === tableState.totalPages}
					>
						下一页
					</button>

					<span className="page-info">
						第 {tableState.page} 页 / 共 {tableState.totalPages} 页
					</span>
				</div>
			)}
		</div>
	)
}

export default CommentManagement
