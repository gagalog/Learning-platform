import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullscreen = false, label = '加载中...' }) => (
	<div className={`loading-spinner${fullscreen ? ' loading-spinner--fullscreen' : ''}`} role="status" aria-live="polite">
		<div className="loading-spinner__circle" />
		{label && <span className="loading-spinner__label">{label}</span>}
	</div>
);

export default LoadingSpinner;
