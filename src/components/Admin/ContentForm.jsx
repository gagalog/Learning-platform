import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../services/api';
import './ContentForm.css';

const ContentForm = ({ content, onCancel, onSubmit }) => {
	const { register, handleSubmit, setValue, watch } = useForm();
	const [editorContent, setEditorContent] = useState(content?.content || '');
	const [tags, setTags] = useState(content?.tags?.join(',') || '');
	const [loading, setLoading] = useState(false);

	const contentType = content?.type || 'article';
	const isEdit = !!content?.id;

	const modules = {
		toolbar: [
			[{ 'header': [1, 2, 3, false] }],
			['bold', 'italic', 'underline', 'strike'],
			[{ 'list': 'ordered' }, { 'list': 'bullet' }],
			['link', 'image'],
			['clean']
		],
	};

	const formats = [
		'header', 'bold', 'italic', 'underline', 'strike',
		'list', 'bullet', 'link', 'image'
	];

	const onEditorChange = (value) => {
		setEditorContent(value);
		setValue('content', value);
	};

	const onFormSubmit = async (data) => {
		setLoading(true);
		try {
			const formData = {
				...data,
				content: editorContent,
				tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
				type: contentType,
				publishedAt: new Date().toISOString()
			};

			if (isEdit) {
				await api.put(`/${contentType}s/${content.id}`, formData);
			} else {
				await api.post(`/${contentType}s`, formData);
			}

			onSubmit();
		} catch (error) {
			console.error('保存失败:', error);
			alert('保存失败，请重试');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="content-form">
			<div className="form-group">
				<label>标题 *</label>
				<input
					{...register('title', { required: true })}
					defaultValue={content?.title}
					placeholder="请输入标题"
				/>
			</div>

			<div className="form-group">
				<label>描述</label>
				<textarea
					{...register('description')}
					defaultValue={content?.description}
					rows="3"
					placeholder="请输入描述"
				/>
			</div>

			{contentType === 'article' ? (
				<div className="form-group">
					<label>内容 *</label>
					<ReactQuill
						theme="snow"
						value={editorContent}
						onChange={onEditorChange}
						modules={modules}
						formats={formats}
					/>
				</div>
			) : (
				<div className="form-group">
					<label>视频URL *</label>
					<input
						{...register('videoUrl', { required: true })}
						defaultValue={content?.videoUrl}
						placeholder="请输入视频URL"
					/>
				</div>
			)}

			<div className="form-group">
				<label>标签（用逗号分隔）</label>
				<input
					value={tags}
					onChange={(e) => setTags(e.target.value)}
					placeholder="例如：JavaScript,React,编程"
				/>
			</div>

			<div className="form-group">
				<label>缩略图URL</label>
				<input
					{...register('thumbnail')}
					defaultValue={content?.thumbnail}
					placeholder="请输入缩略图URL"
				/>
			</div>

			<div className="form-group">
				<label>关键词（用于搜索，用逗号分隔）</label>
				<input
					{...register('keywords')}
					defaultValue={content?.keywords?.join(',')}
					placeholder="例如：前端开发,React教程,JavaScript"
				/>
			</div>

			<div className="form-actions">
				<button type="button" onClick={onCancel} disabled={loading}>
					取消
				</button>
				<button type="submit" disabled={loading}>
					{loading ? '保存中...' : isEdit ? '更新' : '发布'}
				</button>
			</div>
		</form>
	);
};

export default ContentForm;