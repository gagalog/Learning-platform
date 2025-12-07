import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
	Layout as AntLayout,
	Menu,
	Button,
	Avatar,
	Space,
	Dropdown,
	Tag,
	Typography,
	FloatButton,
} from 'antd';
import {
	HomeOutlined,
	ReadOutlined,
	VideoCameraOutlined,
	LoginOutlined,
	UserOutlined,
	LogoutOutlined,
	DashboardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const { Header, Content, Footer } = AntLayout;

const primaryMenuItems = [
	{ key: '/', label: '首页', icon: <HomeOutlined /> },
	{ key: '/articles', label: '文章', icon: <ReadOutlined /> },
	{ key: '/videos', label: '视频', icon: <VideoCameraOutlined /> },
];

const Layout = () => {
	const { user, logout, isAdmin } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const currentKey = useMemo(() => {
		if (location.pathname.startsWith('/articles')) return '/articles';
		if (location.pathname.startsWith('/videos')) return '/videos';
		return '/';
	}, [location.pathname]);

	const handleNavigate = (path) => {
		navigate(path);
	};

	const handleUserMenuClick = ({ key }) => {
		if (key === 'logout') {
			logout();
			navigate('/');
			return;
		}
		navigate(key);
	};

	const userMenuItems = useMemo(() => {
		if (!user) return [];
		const items = [
			{ key: '/dashboard', icon: <UserOutlined />, label: '个人中心' },
		];
		if (isAdmin()) {
			items.push({ key: '/admin', icon: <DashboardOutlined />, label: '管理后台' });
		}
		items.push({ type: 'divider' });
		items.push({ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true });
		return items;
	}, [user, isAdmin]);

	return (
		<AntLayout className="app-shell">
			<Header className="app-shell__header">
				<div className="app-shell__brand">
					<Link to="/" className="app-shell__brand-link" aria-label="在线学习平台">
						<span className="app-shell__logo">🎓</span>
						<Typography.Title level={4} className="app-shell__brand-text">
							在线学习平台
						</Typography.Title>
					</Link>
				</div>
				<Menu
					mode="horizontal"
					selectedKeys={[currentKey]}
					items={primaryMenuItems}
					onClick={({ key }) => handleNavigate(key)}
				/>
				<div className="app-shell__actions">
					{user ? (
						<Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
							<div className="app-shell__user" role="button" tabIndex={0}>
								<Avatar
									size={40}
									src={user.avatar || undefined}
									style={{ backgroundColor: '#1677ff' }}
								>
									{user.name?.charAt(0)?.toUpperCase() || 'U'}
								</Avatar>
								<div className="app-shell__user-meta">
									<span className="app-shell__user-name">{user.name}</span>
									{isAdmin() && <Tag color="blue">管理员</Tag>}
								</div>
							</div>
						</Dropdown>
					) : (
						<Space size="middle">
							<Button icon={<LoginOutlined />} onClick={() => handleNavigate('/login')}>
								登录
							</Button>
							<Button type="primary" onClick={() => handleNavigate('/register')}>
								注册
							</Button>
						</Space>
					)}
				</div>
			</Header>
			<Content className="app-shell__content">
				<div className="app-shell__inner">
					<Outlet />
				</div>
			</Content>
			<Footer className="app-shell__footer">
				© {new Date().getFullYear()} 在线学习平台 · Empowering Lifelong Learners
			</Footer>
			<FloatButton.BackTop visibilityHeight={200} />
		</AntLayout>
	);
};

export default Layout;