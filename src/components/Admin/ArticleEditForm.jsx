import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import './ContentEditForm.css';

const ArticleEditForm = ({ mode = 'create' }) => {
	const { id } = useParams();
	const navigate = useNavigate();

	// 表单状态
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		content: '',
		tags: '',
		thumbnail: '',
		keywords: ''
	});

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// 表单验证错误
	const [errors, setErrors] = useState({});

	// 如果是编辑模式，加载现有数据
	useEffect(() => {
		if (mode === 'edit' && id) {
			loadArticle();
		}
	}, [mode, id]);

	const loadArticle = async () => {
		setLoading(true);
		try {
			const article = await api.getArticle(id);
			setFormData({
				title: article.title || '',
				description: article.description || '',
				content: article.content || '',
				tags: article.tags ? article.tags.join(', ') : '',
				thumbnail: article.thumbnail || '',
				keywords: article.keywords ? article.keywords.join(', ') : ''
			});
		} catch (err) {
			setError('加载文章失败: ' + err.message);
			console.error('加载文章失败:', err);
		} finally {
			setLoading(false);
		}
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

	// 处理内容变化（富文本编辑器）
	const handleContentChange = (content) => {
		setFormData(prev => ({
			...prev,
			content
		}));

		if (errors.content) {
			setErrors(prev => ({
				...prev,
				content: ''
			}));
		}
	};

	// 表单验证
	const validateForm = () => {
		const newErrors = {};

		if (!formData.title.trim()) {
			newErrors.title = '标题不能为空';
		} else if (formData.title.length > 100) {
			newErrors.title = '标题不能超过100个字符';
		}

		if (formData.description.length > 200) {
			newErrors.description = '描述不能超过200个字符';
		}

		if (!formData.content.trim()) {
			newErrors.content = '内容不能为空';
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
				content: formData.content,
				tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
				thumbnail: formData.thumbnail.trim(),
				keywords: formData.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword),
				publishedAt: new Date().toISOString()
			};

			let result;
			if (mode === 'create') {
				result = await api.createArticle(submissionData);
				setSuccess('文章创建成功！');
			} else {
				result = await api.updateArticle(id, submissionData);
				setSuccess('文章更新成功！');
			}

			// 2秒后跳转回文章列表
			setTimeout(() => {
				navigate('/admin/articles');
			}, 2000);

		} catch (err) {
			setError(`保存失败: ${err.message}`);
			console.error('保存文章失败:', err);
		} finally {
			setSaving(false);
		}
	};

	// 取消编辑
	const handleCancel = () => {
		if (window.confirm('确定要取消编辑吗？未保存的内容将会丢失。')) {
			navigate('/admin/articles');
		}
	};

	// 简单富文本编辑器组件（内联实现，避免兼容性问题）
	const SimpleEditor = ({ value, onChange, placeholder }) => {
		const [isPreview, setIsPreview] = useState(false);

		return (
			<div className="simple-editor">
				<div className="editor-toolbar">
					<button
						type="button"
						className={`toolbar-btn ${!isPreview ? 'active' : ''}`}
						onClick={() => setIsPreview(false)}
					>
						编辑
					</button>
					<button
						type="button"
						className={`toolbar-btn ${isPreview ? 'active' : ''}`}
						onClick={() => setIsPreview(true)}
					>
						预览
					</button>
					<div className="toolbar-tips">
						支持Markdown语法: **粗体** *斜体* `代码` [链接](url)
					</div>
				</div>

				{isPreview ? (
					<div className="editor-preview">
						<div
							className="preview-content"
							dangerouslySetInnerHTML={{
								__html: value
									.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
									.replace(/\*(.*?)\*/g, '<em>$1</em>')
									.replace(/`(.*?)`/g, '<code>$1</code>')
									.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
									.replace(/\n/g, '<br>')
							}}
						/>
					</div>
				) : (
					<textarea
						className="editor-textarea"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						rows={15}
					/>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="content-edit-loading">
				<div className="loading-spinner"></div>
				<p>加载文章中...</p>
			</div>
		);
	}

	return (
		<div className="content-edit-form">
			<div className="form-header">
				<h2>{mode === 'create' ? '创建新文章' : '编辑文章'}</h2>
				<p className="form-subtitle">
					{mode === 'create' ? '填写文章信息并发布' : '修改文章内容并更新'}
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
						文章标题
					</label>
					<input
						type="text"
						id="title"
						name="title"
						value={formData.title}
						onChange={handleChange}
						className={`form-input ${errors.title ? 'input-error' : ''}`}
						placeholder="请输入文章标题"
						maxLength={100}
					/>
					<div className="form-input-info">
						<span className={`char-count ${formData.title.length > 80 ? 'char-warning' : ''}`}>
							{formData.title.length}/100
						</span>
						{errors.title && <span className="error-message">{errors.title}</span>}
					</div>
				</div>

				{/* 描述 */}
				<div className="form-group">
					<label htmlFor="description" className="form-label">
						文章描述
					</label>
					<textarea
						id="description"
						name="description"
						value={formData.description}
						onChange={handleChange}
						className={`form-textarea ${errors.description ? 'input-error' : ''}`}
						placeholder="请输入文章简要描述（可选）"
						rows={3}
						maxLength={200}
					/>
					<div className="form-input-info">
						<span className={`char-count ${formData.description.length > 150 ? 'char-warning' : ''}`}>
							{formData.description.length}/200
						</span>
						{errors.description && <span className="error-message">{errors.description}</span>}
					</div>
				</div>

				{/* 内容 */}
				<div className="form-group">
					<label htmlFor="content" className="form-label required">
						文章内容
					</label>
					<SimpleEditor
						value={formData.content}
						onChange={handleContentChange}
						placeholder="请输入文章内容，支持Markdown格式..."
					/>
					{errors.content && (
						<div className="form-input-info">
							<span className="error-message">{errors.content}</span>
						</div>
					)}
				</div>

				{/* 标签 */}
				<div className="form-group">
					<label htmlFor="tags" className="form-label">
						文章标签
					</label>
					<input
						type="text"
						id="tags"
						name="tags"
						value={formData.tags}
						onChange={handleChange}
						className={`form-input ${errors.tags ? 'input-error' : ''}`}
						placeholder="请输入标签，用逗号分隔（例如：React, JavaScript, 前端开发）"
					/>
					<div className="form-input-info">
						<span className="input-hint">标签有助于文章分类和搜索</span>
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
						placeholder="请输入搜索关键词，用逗号分隔（例如：教程, 入门, 高级技巧）"
					/>
					<div className="form-input-info">
						<span className="input-hint">关键词影响搜索结果排名</span>
					</div>
				</div>

				{/* 缩略图 */}
				<div className="form-group">
					<label htmlFor="thumbnail" className="form-label">
						缩略图URL
					</label>
					<input
						type="url"
						id="thumbnail"
						name="thumbnail"
						value={formData.thumbnail}
						onChange={handleChange}
						className="form-input"
						placeholder="https://example.com/image.jpg"
					/>
					<div className="form-input-info">
						<span className="input-hint">请输入完整的图片URL地址</span>
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
						) : mode === 'create' ? '发布文章' : '更新文章'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ArticleEditForm;