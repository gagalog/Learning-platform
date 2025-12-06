import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './Auth.css';

const Register = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: ''
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const { register } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (formData.password !== formData.confirmPassword) {
			setError('两次输入的密码不一致');
			return;
		}

		setLoading(true);

		try {
			const { confirmPassword, ...userData } = formData;
			const response = await api.register(userData);
			// 调用上下文中的 register 方法，更新全局用户状态
			register(response.data.user);
			navigate('/');
		} catch (err) {
			setError(err.message || '注册失败');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h2>注册</h2>
				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label>姓名</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleChange}
							required
							placeholder="请输入姓名"
						/>
					</div>

					<div className="form-group">
						<label>邮箱</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							placeholder="请输入邮箱"
						/>
					</div>

					<div className="form-group">
						<label>密码</label>
						<input
							type="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							required
							placeholder="请输入密码"
							minLength="6"
						/>
					</div>

					<div className="form-group">
						<label>确认密码</label>
						<input
							type="password"
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
							required
							placeholder="请再次输入密码"
						/>
					</div>

					<button type="submit" disabled={loading} className="submit-btn">
						{loading ? '注册中...' : '注册'}
					</button>
				</form>

				<div className="auth-links">
					<p>已有账号？ <a href="/login">登录</a></p>
				</div>
			</div>
		</div>
	);
};

export default Register;