import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
	const [query, setQuery] = useState('');
	const navigate = useNavigate();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (query.trim()) {
			if (onSearch) {
				onSearch(query);
			} else {
				navigate(`/search?q=${encodeURIComponent(query)}`);
			}
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleSubmit(e);
		}
	};

	return (
		<div className="search-bar">
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyPress={handleKeyPress}
					placeholder="搜索文章或视频..."
					className="search-input"
				/>
				<button type="submit" className="search-button">
					搜索
				</button>
			</form>
		</div>
	);
};

export default SearchBar;