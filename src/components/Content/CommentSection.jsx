import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
	Card,
	List,
	Avatar,
	Button,
	Input,
	Space,
	Spin,
	Empty,
	Typography,
	Divider,
	message,
	Modal,
	Alert,
} from 'antd';
import {
	HeartOutlined,
	HeartFilled,
	DeleteOutlined,
	LoginOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './CommentSection.css';

const { TextArea } = Input;
const { Text } = Typography;

const CommentSection = ({ contentType, contentId }) => {
	const { user, isAdmin } = useAuth();
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState('');
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [likesStatus, setLikesStatus] = useState({});

	useEffect(() => {
		fetchComments();
	}, [contentType, contentId]);

	const fetchComments = async () => {
		setLoading(true);
		try {
			const data = await api.getComments(contentType, contentId);
			setComments(data);

			if (user) {
				const statusEntries = await Promise.all(
					data.map(async (comment) => {
						const liked = await api.checkUserLike(comment.id, user.id);
						return [comment.id, liked];
					})
				);
				setLikesStatus(Object.fromEntries(statusEntries));
			} else {
				setLikesStatus({});
			}
		} catch (error) {
			console.error('加载评论失败:', error);
			message.error('评论加载失败，请稍后重试。');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async () => {
		if (!newComment.trim() || !user) return;

		setSubmitting(true);
		try {
			const commentPayload = {
				contentId: Number(contentId),
				contentType,
				userId: user.id,
				userName: user.name || '匿名用户',
				userAvatar: user.avatar || '',
				content: newComment.trim(),
			};
			const savedComment = await api.postComment(commentPayload);
			setComments((prev) => [savedComment, ...prev]);
			setNewComment('');
			message.success('评论已发布');
		} catch (error) {
			console.error('提交评论失败:', error);
			message.error('评论提交失败，请稍后再试');
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmDelete = (commentId) => {
		Modal.confirm({
			title: '删除评论',
			content: '确定要删除这条评论吗？该操作不可恢复。',
			okText: '删除',
			cancelText: '取消',
			okType: 'danger',
			onOk: () => handleDelete(commentId),
		});
	};

	const handleDelete = async (commentId) => {
		try {
			await api.deleteComment(commentId);
			setComments((prev) => prev.filter((comment) => comment.id !== commentId));
			setLikesStatus((prev) => {
				const next = { ...prev };
				delete next[commentId];
				return next;
			});
			message.success('评论已删除');
		} catch (error) {
			console.error('删除评论失败:', error);
			message.error('删除失败，请稍后再试');
		}
	};

	const handleLike = async (commentId) => {
		if (!user) {
			message.info('请先登录后再点赞');
			return;
		}

		try {
			const result = await api.toggleLike(commentId, user.id);
			setComments((prev) =>
				prev.map((comment) =>
					comment.id === commentId
						? {
							...comment,
							likes: result.liked
								? (comment.likes || 0) + 1
								: Math.max(0, (comment.likes || 0) - 1),
						}
						: comment
				)
			);
			setLikesStatus((prev) => ({
				...prev,
				[commentId]: result.liked,
			}));
		} catch (error) {
			console.error('点赞失败:', error);
			message.error(error.message || '操作失败，请稍后重试');
		}
	};

	const formatDate = (value) => {
		if (!value) return '刚刚';
		const date = new Date(value);
		const diff = Date.now() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return '刚刚';
		if (mins < 60) return `${mins} 分钟前`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} 小时前`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days} 天前`;
		return date.toLocaleDateString('zh-CN');
	};

	return (
		<Card className="comment-section-card" title={`评论 (${comments.length})`} bordered={false}>
			{user ? (
				<Space direction="vertical" size="middle" className="comment-editor">
					<TextArea
						rows={4}
						placeholder="分享你的看法..."
						value={newComment}
						onChange={(event) => setNewComment(event.target.value)}
						disabled={submitting}
						maxLength={500}
						showCount
					/>
					<Space>
						<Button type="primary" loading={submitting} disabled={!newComment.trim()} onClick={handleSubmit}>
							发表评论
						</Button>
						<Button onClick={() => setNewComment('')} disabled={submitting || !newComment}>
							清空
						</Button>
					</Space>
				</Space>
			) : (
				<Alert
					message="请登录后发表评论"
					type="info"
					action={
						<Link to="/login">
							<Button type="primary" icon={<LoginOutlined />}>立即登录</Button>
						</Link>
					}
					showIcon
				/>
			)}

			<Divider />

			{loading ? (
				<div className="comment-list__loading">
					<Spin tip="加载评论中..." />
				</div>
			) : comments.length === 0 ? (
				<Empty description="暂无评论，快来抢沙发吧！" image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<List
					itemLayout="horizontal"
					dataSource={comments}
					renderItem={(comment) => (
						<List.Item
							actions={[
								<Button
									type="text"
									icon={likesStatus[comment.id] ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
									onClick={() => handleLike(comment.id)}
								>
									{comment.likes || 0}
								</Button>,
								(isAdmin() || user?.id === comment.userId) && (
									<Button
										key="delete"
										type="text"
										danger
										icon={<DeleteOutlined />}
										onClick={() => handleConfirmDelete(comment.id)}
									>
										删除
									</Button>
								),
							].filter(Boolean)}
						>
							<List.Item.Meta
								avatar={
									<Avatar size={44} style={{ backgroundColor: '#1d4ed8' }} src={comment.userAvatar}>
										{comment.userName?.charAt(0)?.toUpperCase() || 'U'}
									</Avatar>
								}
								title={
									<Space direction="vertical" size={0}>
										<Text strong>{comment.userName}</Text>
										<Text type="secondary">{formatDate(comment.createdAt)}</Text>
									</Space>
								}
								description={<Text>{comment.content}</Text>}
							/>
						</List.Item>
					)}
				/>
			)}
		</Card>
	);
};

export default CommentSection;