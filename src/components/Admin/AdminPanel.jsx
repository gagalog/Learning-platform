// 这个组件是管理员面板，允许管理员管理文章、视频和评论
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ContentForm from './ContentForm';
import CommentManager from './CommentManager';
import { api } from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
	const { user, isAdmin } = useAuth();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('articles');
	const [content, setContent] = useState([]);
	const [editingContent, setEditingContent] = useState(null);

	useEffect(() => {
		if (!isAdmin()) {
			navigate('/');
			return;
		}
		fetchContent();
	}, [activeTab, isAdmin, navigate]);

	const fetchContent = async () => {
		try {
			const endpoint = activeTab === 'articles' ? '/articles' : '/videos';
			const response = await api.get(endpoint);
			setContent(response.data);
		} catch (error) {
			console.error('获取内容失败:', error);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('确定要删除吗？')) return;

		try {
			await api.delete(`/${activeTab}/${id}`);
			setContent(content.filter(item => item.id !== id));
		} catch (error) {
			console.error('删除失败:', error);
		}
	};

	const handleEdit = (item) => {
		setEditingContent(item);
	};

	const handleFormSubmit = () => {
		setEditingContent(null);
		fetchContent();
	};

	if (!isAdmin()) return null;

	return (
		<div className="admin-panel">
			<div className="admin-header">
				<h1>管理员面板</h1>
				<button
					className="btn btn-primary"
					onClick={() => setEditingContent({ type: activeTab.slice(0, -1) })}
				>
					添加新{activeTab === 'articles' ? '文章' : '视频'}
				</button>
			</div>

			<div className="admin-tabs">
				<button
					className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
					onClick={() => setActiveTab('articles')}
				>
					文章管理
				</button>
				<button
					className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
					onClick={() => setActiveTab('videos')}
				>
					视频管理
				</button>
				<button
					className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
					onClick={() => setActiveTab('comments')}
				>
					评论管理
				</button>
			</div>

			<div className="admin-content">
				{activeTab === 'comments' ? (
					<CommentManager />
				) : editingContent ? (
					<ContentForm
						content={editingContent}
						onCancel={() => setEditingContent(null)}
						onSubmit={handleFormSubmit}
					/>
				) : (
					<table className="content-table">
						<thead>
							<tr>
								<th>标题</th>
								<th>发布时间</th>
								<th>点击量</th>
								<th>评论数</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{content.map(item => (
								<tr key={item.id}>
									<td>{item.title}</td>
									<td>{new Date(item.publishedAt).toLocaleDateString()}</td>
									<td>{item.clickCount || 0}</td>
									<td>{item.commentCount || 0}</td>
									<td>
										<button onClick={() => handleEdit(item)}>编辑</button>
										<button onClick={() => handleDelete(item.id)}>删除</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
};

export default AdminPanel;