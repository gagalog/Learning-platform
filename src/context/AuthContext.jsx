import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	// 从 localStorage 同步初始化用户，避免页面刷新后丢失登录状态
	const [user, setUser] = useState(() => {
		try {
			const raw = localStorage.getItem('user');
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	});

	// 因为 localStorage 是同步读取，所以这里立即认为已完成 hydration
	const isAuthReady = true;

	const login = (userData) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
	};

	const register = (userData) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem('user');
	};

	const isAdmin = () => {
		return user?.role === 'admin';
	};

	return (
		<AuthContext.Provider value={{
			user,
			login,
			register,
			logout,
			isAdmin,
			isAuthenticated: !!user,
			isAuthReady
		}}>
			{children}
		</AuthContext.Provider>
	);
};