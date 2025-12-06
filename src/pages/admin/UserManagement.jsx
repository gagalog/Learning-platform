import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import './AdminStyles.css';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
	const { isAdmin } = useAuth();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
	const itemsPerPage = 20;

	useEffect(() => {
		fetchUsers();
	}, [currentPage]);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const res = await api.getAllUsers(currentPage, itemsPerPage);
			setUsers(res.data);
			setTotalPages(Math.ceil(res.total / itemsPerPage));
		} catch (err) {
			console.error('获取用户失败:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleInput = (e) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	};

	const handleCreate = async (e) => {
		e.preventDefault();
		if (!isAdmin()) {
			alert('只有管理员可以添加用户');
			return;
		}
		if (!form.name || !form.email || !form.password) {
			alert('请填写姓名、邮箱和密码');
			return;
		}

		try {
			const res = await api.createUser(form);
			// 将新用户添加到当前列表（若当前页为第一页）
			setUsers(prev => [res.data, ...prev]);
			setForm({ name: '', email: '', password: '', role: 'user' });
			alert('用户创建成功');
		} catch (err) {
			console.error('创建用户失败:', err);
			alert('创建用户失败，请查看控制台');
		}
	};

	const toggleSelectAll = () => {
		if (selectedUsers.length === users.length) setSelectedUsers([]);
		else setSelectedUsers(users.map(u => u.id));
	};

	const toggleSelectUser = (id) => {
		if (selectedUsers.includes(id)) setSelectedUsers(prev => prev.filter(x => x !== id));
		else setSelectedUsers(prev => [...prev, id]);
	};

	const handleDelete = async (id) => {
		if (!isAdmin()) {
			alert('只有管理员可以删除用户');
			return;
		}
		const ok = window.confirm('确定要删除该用户吗？此操作将永久移除该用户及其相关数据（如评论）。');
		if (!ok) return;
		try {
			await api.deleteUser(id);
			setUsers(prev => prev.filter(u => u.id !== id));
			setSelectedUsers(prev => prev.filter(x => x !== id));
			alert('删除成功');
		} catch (err) {
			console.error('删除用户失败:', err);
			alert('删除失败，请查看控制台');
		}
	};

	const handleBulkDelete = async () => {
		if (!isAdmin()) {
			alert('只有管理员可以删除用户');
			return;
		}
		if (selectedUsers.length === 0) {
			alert('请先选择要删除的用户');
			return;
		}
		const ok = window.confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？此操作不可撤销。`);
		if (!ok) return;
		try {
			const res = await api.deleteUsers(selectedUsers);
			// 从列表中移除已删除的用户
			setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
			setSelectedUsers([]);
			alert(`删除完成：成功 ${res.successful}，失败 ${res.failed}`);
		} catch (err) {
			console.error('批量删除用户失败:', err);
			alert('批量删除失败，请查看控制台');
		}
	};

	return (
		<div className="content-management">
			<div className="management-header">
				<h2>用户管理</h2>
				<div className="header-actions">
					<Link to="/admin/users/new" className="btn btn-primary" style={{ display: 'none' }}>+ 新建用户</Link>
				</div>
			</div>

			<div className="management-toolbar">
				<form className="user-create-form" onSubmit={handleCreate}>
					<input name="name" placeholder="姓名" value={form.name} onChange={handleInput} />
					<input name="email" placeholder="邮箱" value={form.email} onChange={handleInput} />
					<input name="password" placeholder="密码" type="password" value={form.password} onChange={handleInput} />
					<select name="role" value={form.role} onChange={handleInput}>
						<option value="user">普通用户</option>
						<option value="admin">管理员</option>
					</select>
					<button className="btn btn-primary" type="submit">添加用户</button>
				</form>

				<div className="filter-options">
					{selectedUsers.length > 0 && (
						<button onClick={handleBulkDelete} className="btn btn-danger">删除选中 ({selectedUsers.length})</button>
					)}
				</div>
			</div>

			{loading ? (
				<div className="loading-state">加载中...</div>
			) : (
				<div className="content-table-container">
					<table className="content-table">
						<thead>
							<tr>
								<th width="50"><input type="checkbox" checked={users.length > 0 && selectedUsers.length === users.length} onChange={toggleSelectAll} /></th>
								<th>ID</th>
								<th>姓名</th>
								<th>邮箱</th>
								<th>角色</th>
								<th>创建时间</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{users.map(u => (
								<tr key={u.id}>
									<td><input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleSelectUser(u.id)} /></td>
									<td>{u.id}</td>
									<td>{u.name}</td>
									<td>{u.email}</td>
									<td>{u.role}</td>
									<td>{new Date(u.createdAt).toLocaleString()}</td>
									<td>
										<div className="action-buttons">
											<button className="btn btn-sm btn-delete" onClick={() => handleDelete(u.id)}>删除</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{users.length === 0 && (
						<div className="empty-state">
							<div className="empty-icon">👥</div>
							<h3>暂无用户</h3>
						</div>
					)}
				</div>
			)}

			{totalPages > 1 && (
				<div className="pagination">
					<button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>上一页</button>
					<div className="page-numbers">
						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							let pageNum;
							if (totalPages <= 5) pageNum = i + 1;
							else if (currentPage <= 3) pageNum = i + 1;
							else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
							else pageNum = currentPage - 2 + i;
							return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={currentPage === pageNum ? 'active' : ''}>{pageNum}</button>
						})}
					</div>
					<button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>下一页</button>
					<span className="page-info">第 {currentPage} 页 / 共 {totalPages} 页</span>
				</div>
			)}
		</div>
	);
};

export default UserManagement;
