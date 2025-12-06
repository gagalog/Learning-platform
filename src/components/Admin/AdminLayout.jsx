import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
	Layout,
	Menu,
	Button,
	Avatar,
	Typography,
	Space,
	Tag,
	Grid,
	Drawer,
} from 'antd';
import {
	DashboardOutlined,
	FileTextOutlined,
	VideoCameraOutlined,
	CommentOutlined,
	TeamOutlined,
	MenuOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	LogoutOutlined,
	HomeOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

const navigationItems = [
	{ key: '/admin', icon: <DashboardOutlined />, label: '仪表板' },
	{ key: '/admin/articles', icon: <FileTextOutlined />, label: '文章管理' },
	{ key: '/admin/videos', icon: <VideoCameraOutlined />, label: '视频管理' },
	{ key: '/admin/comments', icon: <CommentOutlined />, label: '评论管理' },
	{ key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
];

const AdminLayout = () => {
	const { user, logout, isAdmin, isAuthReady } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const screens = Grid.useBreakpoint();
	const isMobile = !screens.lg;

	const [collapsed, setCollapsed] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);

	useEffect(() => {
		if (!isAuthReady) return;
		if (!isAdmin()) {
			navigate('/');
		}
	}, [isAdmin, isAuthReady, navigate]);

	const selectedKey = useMemo(() => {
		const match = navigationItems.find((item) => location.pathname.startsWith(item.key));
		return match ? match.key : '/admin';
	}, [location.pathname]);

	const pageTitle = useMemo(() => {
		if (location.pathname.includes('articles')) return '文章管理';
		if (location.pathname.includes('videos')) return '视频管理';
		if (location.pathname.includes('comments')) return '评论管理';
		if (location.pathname.includes('users')) return '用户管理';
		return '仪表板';
	}, [location.pathname]);

	const handleMenuClick = ({ key }) => {
		if (key === 'logout') {
			logout();
			navigate('/');
			return;
		}
		navigate(key);
		if (isMobile) {
			setDrawerOpen(false);
		}
	};

	const renderSiderContent = (inlineCollapsed) => (
		<div className="admin-sider">
			<div className="admin-sider__brand">
				<span className="admin-sider__logo">🛠️</span>
				{!inlineCollapsed && (
					<Typography.Title level={4} className="admin-sider__title">
						管理后台
					</Typography.Title>
				)}
			</div>
			<Menu
				mode="inline"
				selectedKeys={[selectedKey]}
				items={[
					...navigationItems,
					{ type: 'divider' },
					{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
				]}
				onClick={handleMenuClick}
				inlineCollapsed={!isMobile && inlineCollapsed}
			/>
			<div className="admin-sider__user">
				<Avatar size={inlineCollapsed ? 36 : 48} style={{ backgroundColor: '#1677ff' }}>
					{user?.name?.charAt(0)?.toUpperCase() || 'A'}
				</Avatar>
				{!inlineCollapsed && (
					<div className="admin-sider__user-meta">
						<span className="admin-sider__user-name">{user?.name}</span>
						<Tag color="blue">管理员</Tag>
					</div>
				)}
			</div>
		</div>
	);

	if (!isAuthReady || !isAdmin()) {
		return null;
	}

	return (
		<Layout className="admin-shell">
			{!isMobile && (
				<Sider
					width={260}
					collapsible
					collapsed={collapsed}
					onCollapse={(value) => setCollapsed(value)}
					className="admin-shell__sider"
					trigger={null}
				>
					{renderSiderContent(collapsed)}
				</Sider>
			)}
			<Layout>
				<Header className="admin-shell__header">
					<div className="admin-shell__header-left">
						{isMobile ? (
							<Button
								type="text"
								icon={<MenuOutlined />}
								onClick={() => setDrawerOpen(true)}
							/>
						) : (
							<Button
								type="text"
								icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
								onClick={() => setCollapsed((prev) => !prev)}
							/>
						)}
						<div>
							<Typography.Title level={4} className="admin-shell__title">
								{pageTitle}
							</Typography.Title>
							<Typography.Text type="secondary" className="admin-shell__subtitle">
							</Typography.Text>
						</div>
					</div>
					<div className="admin-shell__header-right">
						<Button icon={<HomeOutlined />} onClick={() => navigate('/')}>返回首页</Button>
					</div>
				</Header>
				<Content className="admin-shell__content">
					<div className="admin-shell__content-inner">
						<Outlet />
					</div>
				</Content>
			</Layout>
			<Drawer
				placement="left"
				closable={false}
				open={isMobile && drawerOpen}
				onClose={() => setDrawerOpen(false)}
				className="admin-shell__drawer"
				bodyStyle={{ padding: 0 }}
			>
				{renderSiderContent(false)}
			</Drawer>
		</Layout>
	);
};

export default AdminLayout;