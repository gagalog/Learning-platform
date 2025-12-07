import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoadingSpinner from './components/Common/LoadingSpinner';
import './App.css';

// 懒加载布局与页面组件，降低首屏体积
const Layout = lazy(() => import('./components/Layout/Layout'));
const AdminLayout = lazy(() => import('./components/Admin/AdminLayout'));

// 公共页面
const Home = lazy(() => import('./pages/public/Home'));
const ArticleDetail = lazy(() => import('./pages/public/ArticleDetail'));
const VideoDetail = lazy(() => import('./pages/public/VideoDetail'));
const SearchResults = lazy(() => import('./pages/public/SearchResults'));

// 用户认证/个人中心
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Dashboard = lazy(() => import('./pages/user/Dashboard'));

// 管理后台页面
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ArticleManagement = lazy(() => import('./pages/admin/ArticleManagement'));
const VideoManagement = lazy(() => import('./pages/admin/VideoManagement'));
const CommentManagement = lazy(() => import('./pages/admin/CommentManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ArticleEdit = lazy(() => import('./pages/admin/ArticleEdit'));
const VideoEdit = lazy(() => import('./pages/admin/VideoEdit'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner fullscreen label="页面加载中..." />}>
          <Routes>
            {/* 主布局的路由 */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="articles" element={<Home filter="article" />} />
              <Route path="videos" element={<Home filter="video" />} />
              <Route path="article/:id" element={<ArticleDetail />} />
              <Route path="video/:id" element={<VideoDetail />} />
              <Route path="search" element={<SearchResults />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="dashboard" element={<Dashboard />} />
              {/* 其他子路由 */}
            </Route>

            {/* 管理后台路由（独立布局） */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="articles" element={<ArticleManagement />} />
              <Route path="videos" element={<VideoManagement />} />
              <Route path="comments" element={<CommentManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="articles/new" element={<ArticleEdit />} />
              <Route path="articles/edit/:id" element={<ArticleEdit />} />
              <Route path="videos/new" element={<VideoEdit />} />
              <Route path="videos/edit/:id" element={<VideoEdit />} />
              {/* ... 其他管理路由 ... */}
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;