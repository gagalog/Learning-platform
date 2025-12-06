import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
	Row,
	Col,
	Card,
	Statistic,
	Typography,
	Button,
	List,
	Tag,
	Space,
	Empty,
	Skeleton,
} from 'antd';
import {
	ReloadOutlined,
	FileTextOutlined,
	VideoCameraOutlined,
	CommentOutlined,
	TeamOutlined,
	EyeOutlined,
	CalendarOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
	const [stats, setStats] = useState({
		totalArticles: 0,
		totalVideos: 0,
		totalComments: 0,
		totalUsers: 0,
		recentArticles: [],
		recentComments: [],
	});
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		fetchDashboardStats();
	}, []);

	const fetchDashboardStats = async () => {
		try {
			setRefreshing(true);
			const [articlesRes, videosRes, commentsRes, usersRes] = await Promise.all([
				api.getAllArticles(1, 5),
				api.getAllVideos(1, 5),
				api.getAllComments(1, 10),
				api.getAllUsers(1, 5),
			]);

			setStats({
				totalArticles: articlesRes.total,
				totalVideos: videosRes.total,
				totalComments: commentsRes.total,
				totalUsers: usersRes.total,
				recentArticles: articlesRes.data,
				recentComments: commentsRes.data,
			});
		} catch (error) {
			console.error('获取仪表板数据失败:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const metricCards = useMemo(
		() => [
			{
				key: 'articles',
				label: '总文章数',
				value: stats.totalArticles,
				icon: <FileTextOutlined />,
				accent: '#1677ff',
			},
			{
				key: 'videos',
				label: '总视频数',
				value: stats.totalVideos,
				icon: <VideoCameraOutlined />,
				accent: '#13c2c2',
			},
			{
				key: 'comments',
				label: '总评论数',
				value: stats.totalComments,
				icon: <CommentOutlined />,
				accent: '#fa8c16',
			},
			{
				key: 'users',
				label: '总用户数',
				value: stats.totalUsers,
				icon: <TeamOutlined />,
				accent: '#722ed1',
			},
		],
		[stats]
	);

	return (
		<div className="admin-dashboard">
			<div className="admin-dashboard__header">
				<div>
					<Typography.Title level={3} className="admin-dashboard__title">
						数据概览
					</Typography.Title>
					<Typography.Text type="secondary">
						掌握平台的实时动态与健康状况
					</Typography.Text>
				</div>
				<Button
					icon={<ReloadOutlined />}
					type="default"
					onClick={fetchDashboardStats}
					loading={refreshing}
				>
					刷新数据
				</Button>
			</div>

			<Row gutter={[20, 20]}>
				{metricCards.map(({ key, label, value, icon, accent }) => (
					<Col xs={24} sm={12} xl={6} key={key}>
						<Card className="admin-dashboard__stat-card" bordered={false}>
							<Space size={20} align="center">
								<div
									className="admin-dashboard__stat-icon"
									style={{ color: accent, backgroundColor: `${accent}20` }}
								>
									{icon}
								</div>
								<Statistic value={value} title={label} valueStyle={{ fontSize: 28 }} />
							</Space>
						</Card>
					</Col>
				))}
			</Row>

			<Row gutter={[24, 24]} className="admin-dashboard__sections">
				<Col xs={24} lg={12}>
					<Card
						title="最新文章"
						extra={<Link to="/admin/articles">查看所有</Link>}
						bodyStyle={{ paddingTop: 0 }}
					>
						{loading ? (
							<Skeleton active paragraph={{ rows: 6 }} />
						) : (
							<List
								itemLayout="horizontal"
								dataSource={stats.recentArticles}
								locale={{ emptyText: <Empty description="暂无文章" /> }}
								renderItem={(article) => (
									<List.Item>
										<List.Item.Meta
											title={<Link to={`/article/${article.id}`}>{article.title}</Link>}
											description={
												<Space split={<span>·</span>} size={8} wrap>
													<span><CalendarOutlined /> {new Date(article.publishedAt).toLocaleDateString()}</span>
													<span><EyeOutlined /> {article.clickCount} 浏览</span>
												</Space>
											}
										/>
									</List.Item>
								)}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card
						title="最新评论"
						extra={<Link to="/admin/comments">查看所有</Link>}
						bodyStyle={{ paddingTop: 0 }}
					>
						{loading ? (
							<Skeleton active paragraph={{ rows: 6 }} />
						) : (
							<List
								itemLayout="vertical"
								dataSource={stats.recentComments}
								locale={{ emptyText: <Empty description="暂无评论" /> }}
								renderItem={(comment) => (
									<List.Item>
										<List.Item.Meta
											title={comment.userName || '匿名用户'}
											description={comment.content}
										/>
										<Tag icon={<CalendarOutlined />}>
											{new Date(comment.createdAt).toLocaleDateString()}
										</Tag>
									</List.Item>
								)}
							/>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default AdminDashboard;