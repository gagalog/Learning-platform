import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './Auth.css';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			// const response = await api.post('/auth/login', { email, password });
			const response = await api.login(email, password);
			login(response.data.user);
			navigate('/');
		} catch (err) {
			setError(err.message || '登录失败');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h2>登录</h2>
				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label>邮箱</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="请输入邮箱"
						/>
					</div>

					<div className="form-group">
						<label>密码</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="请输入密码"
						/>
					</div>

					<button type="submit" disabled={loading} className="submit-btn">
						{loading ? '登录中...' : '登录'}
					</button>
				</form>

				<div className="auth-links">
					<p>还没有账号？ <a href="/register">注册</a></p>
				</div>

				<div className="test-credentials">
					<p>测试账号：</p>
					<p>管理员：admin@test.com / admin123</p>
					<p>普通用户：user@test.com / user123</p>
				</div>
			</div>
		</div>
	);
};

export default Login;