import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
	const { user, updateUser } = useAuth();
	const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
	const [savingAvatar, setSavingAvatar] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [avatarMessage, setAvatarMessage] = useState(null);
	const [previewError, setPreviewError] = useState(false);
	const [localPreview, setLocalPreview] = useState('');
	const [nameValue, setNameValue] = useState(user?.name || '');
	const [savingName, setSavingName] = useState(false);
	const [nameMessage, setNameMessage] = useState(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		setAvatarUrl(user?.avatar || '');
		setPreviewError(false);
		setLocalPreview((prev) => {
			if (prev && prev.startsWith('blob:')) {
				URL.revokeObjectURL(prev);
			}
			return '';
		});
		setNameValue(user?.name || '');
		setNameMessage(null);
	}, [user]);

	useEffect(() => {
		return () => {
			if (localPreview && localPreview.startsWith('blob:')) {
				URL.revokeObjectURL(localPreview);
			}
		};
	}, [localPreview]);

	const handleAvatarUpdate = async (e) => {
		e.preventDefault();
		if (!user?.id) return;
		setSavingAvatar(true);
		setAvatarMessage(null);
		try {
			const updated = await api.updateUserAvatar(user.id, avatarUrl.trim());
			updateUser(updated);
			setAvatarMessage({ type: 'success', text: '头像已更新' });
		} catch (err) {
			console.error('更新头像失败:', err);
			setAvatarMessage({ type: 'error', text: err.message || '保存失败，请稍后再试' });
		} finally {
			setSavingAvatar(false);
		}
	};

	const handleNameUpdate = async (e) => {
		e.preventDefault();
		if (!user?.id) return;
		const nextName = nameValue.trim();
		if (!nextName || nextName === user.name) {
			setNameMessage({ type: 'info', text: '请输入新的用户名' });
			return;
		}
		setSavingName(true);
		setNameMessage(null);
		try {
			const updated = await api.updateUserProfile(user.id, { name: nextName });
			updateUser(updated);
			setNameMessage({ type: 'success', text: '用户名已更新' });
		} catch (err) {
			console.error('更新用户名失败:', err);
			const message = err?.response?.data?.message || err.message || '保存失败，请稍后再试';
			setNameMessage({ type: 'error', text: message });
		} finally {
			setSavingName(false);
		}
	};

	const handleLocalUpload = async (event) => {
		if (!user?.id) return;
		const file = event.target.files?.[0];
		if (!file) return;
		setAvatarMessage(null);
		setPreviewError(false);
		const blobUrl = URL.createObjectURL(file);
		setLocalPreview((prev) => {
			if (prev && prev.startsWith('blob:')) {
				URL.revokeObjectURL(prev);
			}
			return blobUrl;
		});
		setUploadingAvatar(true);
		try {
			const updated = await api.uploadUserAvatar(user.id, file);
			updateUser(updated);
			setAvatarMessage({ type: 'success', text: '头像上传成功' });
		} catch (err) {
			console.error('上传头像失败:', err);
			const message = err?.response?.data?.message || err.message || '上传失败，请稍后再试';
			setAvatarMessage({ type: 'error', text: message });
			setLocalPreview((prev) => {
				if (prev && prev.startsWith('blob:')) {
					URL.revokeObjectURL(prev);
				}
				return '';
			});
		} finally {
			setUploadingAvatar(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	if (!user) {
		return <div className="not-logged-in">请先登录</div>;
	}

	return (
		<div className="dashboard-container">
			<h1>个人中心</h1>

			<div className="user-info">
				<div className="avatar-card">
					<h3>我的头像</h3>
					<div className="avatar-preview">
						{(localPreview || avatarUrl) && (!previewError || localPreview) ? (
							<img
								src={localPreview || avatarUrl}
								alt="用户头像"
								onError={() => {
									if (!localPreview) {
										setPreviewError(true);
									}
								}}
							/>
						) : (
							<div className="avatar-placeholder">
								{avatarUrl && previewError ? '图片无法加载' : '未设置'}
							</div>
						)}
					</div>
					<form className="avatar-form" onSubmit={handleAvatarUpdate}>
						<input
							type="url"
							value={avatarUrl}
							onChange={(e) => {
								setAvatarUrl(e.target.value);
								setPreviewError(false);
							}}
							placeholder="粘贴图片 URL，例如 https://..."
						/>
						<button type="submit" disabled={savingAvatar}>
							{savingAvatar ? '保存中...' : '保存头像'}
						</button>
					</form>
					<div className="avatar-upload-local">
						<input
							type="file"
							accept="image/*"
							ref={fileInputRef}
							onChange={handleLocalUpload}
							disabled={uploadingAvatar}
							hidden
						/>
						<button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
							{uploadingAvatar ? '上传中...' : '上传本地图片'}
						</button>
						<span className="avatar-note">支持 JPG / PNG / GIF，大小不超过 2MB</span>
					</div>
					{avatarMessage && (
						<p className={`avatar-message ${avatarMessage.type}`}>
							{avatarMessage.text}
						</p>
					)}
				</div>

				<div className="info-card">
					<h3>基本信息</h3>
					<div className="info-item info-item--editable">
						<span className="label">姓名：</span>
						<form className="inline-form" onSubmit={handleNameUpdate}>
							<input
								type="text"
								value={nameValue}
								onChange={(e) => {
									setNameValue(e.target.value);
									setNameMessage(null);
								}}
								placeholder="输入新的昵称"
								maxLength={40}
							/>
							<button type="submit" disabled={savingName || !nameValue.trim() || nameValue.trim() === user.name}>
								{savingName ? '保存中...' : '保存'}
							</button>
						</form>
					</div>
					{nameMessage && (
						<p className={`form-message ${nameMessage.type}`}>
							{nameMessage.text}
						</p>
					)}
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