import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import './ContentEditForm.css';

const VideoEditForm = ({ mode = 'create' }) => {
	const { id } = useParams();
	const navigate = useNavigate();

	// 表单状态
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		videoUrl: '',
		duration: '',
		tags: '',
		thumbnail: '',
		keywords: ''
	});

	// 视频预览状态
	const [videoPreview, setVideoPreview] = useState({
		isValid: false,
		loading: false,
		error: ''
	});

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [errors, setErrors] = useState({});

	const loadVideo = useCallback(async () => {
		setLoading(true);
		try {
			const video = await api.getVideo(id);
			setFormData({
				title: video.title || '',
				description: video.description || '',
				videoUrl: video.videoUrl || '',
				duration: video.duration || '',
				tags: video.tags ? video.tags.join(', ') : '',
				thumbnail: video.thumbnail || '',
				keywords: video.keywords ? video.keywords.join(', ') : ''
			});
		} catch (err) {
			setError('加载视频失败: ' + err.message);
			console.error('加载视频失败:', err);
		} finally {
			setLoading(false);
		}
	}, [id]);

	// 如果是编辑模式，加载现有数据
	useEffect(() => {
		if (mode === 'edit' && id) {
			loadVideo();
		}
	}, [mode, id, loadVideo]);

	// 当视频URL变化时验证
	useEffect(() => {
		if (formData.videoUrl.trim()) {
			validateVideoUrl(formData.videoUrl);
		} else {
			setVideoPreview({
				isValid: false,
				loading: false,
				error: ''
			});
		}
	}, [formData.videoUrl]);


	// 验证视频URL（简单验证）
	const validateVideoUrl = (url) => {
		setVideoPreview(prev => ({ ...prev, loading: true, error: '' }));

		// 简单的URL验证
		const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;

		if (!urlPattern.test(url)) {
			setVideoPreview({
				isValid: false,
				loading: false,
				error: '视频URL格式不正确'
			});
			return;
		}

		// 检查是否为常见视频平台
		const platforms = {
			'youtube.com': 'YouTube',
			'youtu.be': 'YouTube',
			'vimeo.com': 'Vimeo',
			'bilibili.com': 'Bilibili',
			'dailymotion.com': 'Dailymotion'
		};

		let platform = '未知平台';
		for (const [domain, name] of Object.entries(platforms)) {
			if (url.includes(domain)) {
				platform = name;
				break;
			}
		}

		// 模拟加载完成
		setTimeout(() => {
			setVideoPreview({
				isValid: true,
				loading: false,
				error: '',
				platform
			});
		}, 800);
	};

	// 处理输入变化
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		// 清除该字段的错误
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	// 格式化时长显示
	const formatDuration = (value) => {
		// 移除非数字字符
		const numbers = value.replace(/[^\d]/g, '');

		if (numbers.length <= 2) {
			return numbers; // 只输入了分钟
		} else if (numbers.length <= 4) {
			// 格式化为 MM:SS
			const minutes = numbers.slice(0, -2);
			const seconds = numbers.slice(-2);
			return `${minutes}:${seconds}`;
		} else {
			// 格式化为 HH:MM:SS
			const hours = numbers.slice(0, -4);
			const minutes = numbers.slice(-4, -2);
			const seconds = numbers.slice(-2);
			return `${hours}:${minutes}:${seconds}`;
		}
	};

	// 处理时长输入
	const handleDurationChange = (e) => {
		const formatted = formatDuration(e.target.value);
		setFormData(prev => ({
			...prev,
			duration: formatted
		}));
	};

	// 表单验证
	const validateForm = () => {
		const newErrors = {};

		if (!formData.title.trim()) {
			newErrors.title = '标题不能为空';
		} else if (formData.title.length > 100) {
			newErrors.title = '标题不能超过100个字符';
		}

		if (!formData.videoUrl.trim()) {
			newErrors.videoUrl = '视频URL不能为空';
		} else if (!videoPreview.isValid && !videoPreview.loading) {
			newErrors.videoUrl = '请输入有效的视频URL';
		}

		if (formData.description.length > 300) {
			newErrors.description = '描述不能超过300个字符';
		}

		// 时长格式验证 (可选)
		if (formData.duration) {
			const durationPattern = /^(\d{1,2}:)?\d{1,2}:\d{2}$|^\d{1,2}:\d{2}$|^\d+$/;
			if (!durationPattern.test(formData.duration)) {
				newErrors.duration = '时长格式不正确 (如: 05:30 或 01:23:45)';
			}
		}

		// 标签验证（可选）
		if (formData.tags) {
			const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
			if (tagsArray.length > 10) {
				newErrors.tags = '最多只能添加10个标签';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// 处理表单提交
	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setSaving(true);
		setError('');
		setSuccess('');

		try {
			// 准备提交数据
			const submissionData = {
				title: formData.title.trim(),
				description: formData.description.trim(),
				videoUrl: formData.videoUrl.trim(),
				duration: formData.duration.trim() || null,
				tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
				thumbnail: formData.thumbnail.trim() || null,
				keywords: formData.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword),
				publishedAt: new Date().toISOString()
			};

			if (mode === 'create') {
				await api.createVideo(submissionData);
				setSuccess('视频创建成功！');
			} else {
				await api.updateVideo(id, submissionData);
				setSuccess('视频更新成功！');
			}

			// 2秒后跳转回视频列表
			setTimeout(() => {
				navigate('/admin/videos');
			}, 2000);

		} catch (err) {
			setError(`保存失败: ${err.message}`);
			console.error('保存视频失败:', err);
		} finally {
			setSaving(false);
		}
	};

	// 取消编辑
	const handleCancel = () => {
		if (window.confirm('确定要取消编辑吗？未保存的内容将会丢失。')) {
			navigate('/admin/videos');
		}
	};

	// 视频预览组件
	const VideoPreview = () => {
		if (videoPreview.loading) {
			return (
				<div className="video-preview loading">
					<div className="preview-spinner"></div>
					<p>正在验证视频链接...</p>
				</div>
			);
		}

		if (videoPreview.error) {
			return (
				<div className="video-preview error">
					<div className="preview-icon">❌</div>
					<p className="preview-error">{videoPreview.error}</p>
				</div>
			);
		}

		if (videoPreview.isValid) {
			return (
				<div className="video-preview valid">
					<div className="preview-icon">✅</div>
					<div className="preview-info">
						<p className="preview-platform">检测到: {videoPreview.platform} 视频</p>
						<p className="preview-url">{formData.videoUrl}</p>
						<div className="preview-player-placeholder">
							<div className="player-icon">▶️</div>
							<p>视频预览</p>
							<small>发布后用户可在此观看视频</small>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="video-preview empty">
				<div className="preview-icon">📹</div>
				<p>输入视频URL后显示预览</p>
			</div>
		);
	};

	// 时长示例
	const DurationExamples = () => (
		<div className="duration-examples">
			<span className="example-label">示例格式:</span>
			<button
				type="button"
				className="example-btn"
				onClick={() => setFormData(prev => ({ ...prev, duration: '05:30' }))}
			>
				5分30秒
			</button>
			<button
				type="button"
				className="example-btn"
				onClick={() => setFormData(prev => ({ ...prev, duration: '01:23:45' }))}
			>
				1小时23分45秒
			</button>
			<button
				type="button"
				className="example-btn"
				onClick={() => setFormData(prev => ({ ...prev, duration: '120' }))}
			>
				120秒
			</button>
		</div>
	);

	if (loading) {
		return (
			<div className="content-edit-loading">
				<div className="loading-spinner"></div>
				<p>加载视频信息中...</p>
			</div>
		);
	}

	return (
		<div className="content-edit-form">
			<div className="form-header">
				<h2>{mode === 'create' ? '上传新视频' : '编辑视频'}</h2>
				<p className="form-subtitle">
					{mode === 'create' ? '填写视频信息并发布' : '修改视频信息并更新'}
				</p>
			</div>

			{/* 状态提示 */}
			{error && (
				<div className="alert alert-error">
					<strong>错误:</strong> {error}
				</div>
			)}

			{success && (
				<div className="alert alert-success">
					<strong>成功:</strong> {success} 2秒后自动跳转...
				</div>
			)}

			<form onSubmit={handleSubmit} className="edit-form">
				{/* 标题 */}
				<div className="form-group">
					<label htmlFor="title" className="form-label required">
						视频标题
					</label>
					<input
						type="text"
						id="title"
						name="title"
						value={formData.title}
						onChange={handleChange}
						className={`form-input ${errors.title ? 'input-error' : ''}`}
						placeholder="请输入视频标题"
						maxLength={100}
					/>
					<div className="form-input-info">
						<span className={`char-count ${formData.title.length > 80 ? 'char-warning' : ''}`}>
							{formData.title.length}/100
						</span>
						{errors.title && <span className="error-message">{errors.title}</span>}
					</div>
				</div>

				{/* 视频URL */}
				<div className="form-group">
					<label htmlFor="videoUrl" className="form-label required">
						视频URL
					</label>
					<input
						type="url"
						id="videoUrl"
						name="videoUrl"
						value={formData.videoUrl}
						onChange={handleChange}
						className={`form-input ${errors.videoUrl ? 'input-error' : ''}`}
						placeholder="https://www.youtube.com/watch?v=xxxx 或 https://vimeo.com/xxxx"
					/>
					<div className="form-input-info">
						<span className="input-hint">
							支持 YouTube, Vimeo, Bilibili 等平台
						</span>
						{errors.videoUrl && <span className="error-message">{errors.videoUrl}</span>}
					</div>

					{/* 视频预览 */}
					<div className="video-preview-container">
						<VideoPreview />
					</div>
				</div>

				{/* 时长 */}
				<div className="form-group">
					<label htmlFor="duration" className="form-label">
						视频时长
					</label>
					<div className="duration-input-group">
						<input
							type="text"
							id="duration"
							name="duration"
							value={formData.duration}
							onChange={handleDurationChange}
							className={`form-input ${errors.duration ? 'input-error' : ''}`}
							placeholder="例如: 05:30 或 01:23:45"
						/>
						<DurationExamples />
					</div>
					{errors.duration && (
						<div className="form-input-info">
							<span className="error-message">{errors.duration}</span>
						</div>
					)}
				</div>

				{/* 描述 */}
				<div className="form-group">
					<label htmlFor="description" className="form-label">
						视频描述
					</label>
					<textarea
						id="description"
						name="description"
						value={formData.description}
						onChange={handleChange}
						className={`form-textarea ${errors.description ? 'input-error' : ''}`}
						placeholder="请输入视频内容描述（可选）"
						rows={4}
						maxLength={300}
					/>
					<div className="form-input-info">
						<span className={`char-count ${formData.description.length > 250 ? 'char-warning' : ''}`}>
							{formData.description.length}/300
						</span>
						{errors.description && <span className="error-message">{errors.description}</span>}
					</div>
				</div>

				{/* 标签 */}
				<div className="form-group">
					<label htmlFor="tags" className="form-label">
						视频标签
					</label>
					<input
						type="text"
						id="tags"
						name="tags"
						value={formData.tags}
						onChange={handleChange}
						className={`form-input ${errors.tags ? 'input-error' : ''}`}
						placeholder="请输入标签，用逗号分隔（例如：教程, 编程, 前端开发）"
					/>
					<div className="form-input-info">
						<span className="input-hint">标签有助于视频分类和搜索</span>
						{errors.tags && <span className="error-message">{errors.tags}</span>}
					</div>
				</div>

				{/* 关键词 */}
				<div className="form-group">
					<label htmlFor="keywords" className="form-label">
						搜索关键词
					</label>
					<input
						type="text"
						id="keywords"
						name="keywords"
						value={formData.keywords}
						onChange={handleChange}
						className="form-input"
						placeholder="请输入搜索关键词，用逗号分隔"
					/>
					<div className="form-input-info">
						<span className="input-hint">关键词影响搜索结果排名</span>
					</div>
				</div>

				{/* 缩略图 */}
				<div className="form-group">
					<label htmlFor="thumbnail" className="form-label">
						自定义缩略图URL
					</label>
					<input
						type="url"
						id="thumbnail"
						name="thumbnail"
						value={formData.thumbnail}
						onChange={handleChange}
						className="form-input"
						placeholder="https://example.com/thumbnail.jpg (可选)"
					/>
					<div className="form-input-info">
						<span className="input-hint">如不提供，将使用视频平台默认缩略图</span>
						{formData.thumbnail && (
							<div className="thumbnail-preview">
								<p>预览:</p>
								<img
									src={formData.thumbnail}
									alt="缩略图预览"
									onError={(e) => {
										e.target.style.display = 'none';
										e.target.parentNode.innerHTML += '<span class="preview-error">图片加载失败</span>';
									}}
								/>
							</div>
						)}
					</div>
				</div>

				{/* 操作按钮 */}
				<div className="form-actions">
					<button
						type="button"
						onClick={handleCancel}
						className="btn btn-secondary"
						disabled={saving}
					>
						取消
					</button>
					<button
						type="submit"
						className="btn btn-primary"
						disabled={saving}
					>
						{saving ? (
							<>
								<span className="loading-dots"></span>
								保存中...
							</>
						) : mode === 'create' ? '发布视频' : '更新视频'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default VideoEditForm;