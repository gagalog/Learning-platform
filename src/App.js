import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// 布局组件
import Layout from './components/Layout/Layout';
import AdminLayout from './components/Admin/AdminLayout';

// 公共页面
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import VideoDetail from './pages/VideoDetail';
import SearchResults from './pages/SearchResults';

// 用户认证页面
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';

// 管理后台页面
import AdminDashboard from './pages/admin/AdminDashboard';
import ArticleManagement from './pages/admin/ArticleManagement';
import VideoManagement from './pages/admin/VideoManagement';
import CommentManagement from './pages/admin/CommentManagement';
import UserManagement from './pages/admin/UserManagement';

// 内容编辑页面 (需要创建)
import ArticleEdit from './pages/admin/ArticleEdit';
import VideoEdit from './pages/admin/VideoEdit';

// 样式文件
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;