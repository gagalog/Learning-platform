import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
	const { user } = useAuth();

	if (!user) {
		return <div className="not-logged-in">请先登录</div>;
	}

	return (
		<div className="dashboard-container">
			<h1>个人中心</h1>

			<div className="user-info">
				<div className="info-card">
					<h3>基本信息</h3>
					<div className="info-item">
						<span className="label">姓名：</span>
						<span className="value">{user.name}</span>
					</div>
					<div className="info-item">
						<span className="label">邮箱：</span>
						<span className="value">{user.email}</span>
					</div>
					<div className="info-item">
						<span className="label">角色：</span>
						<span className="value">
							{user.role === 'admin' ? '管理员' : '普通用户'}
						</span>
					</div>
				</div>

				{user.role === 'admin' && (
					<div className="admin-features">
						<h3>管理员功能</h3>
						<div className="feature-buttons">
							<Link to="/admin/articles" className="feature-btn">
								发布文章
							</Link>
							<Link to="/admin/videos" className="feature-btn">
								发布视频
							</Link>
							<Link to="/admin/comments" className="feature-btn">
								管理评论
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;