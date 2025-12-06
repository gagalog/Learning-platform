export const themeConfig = {
	token: {
		colorPrimary: '#1677ff',
		colorInfo: '#1677ff',
		colorSuccess: '#52c41a',
		colorWarning: '#faad14',
		colorError: '#ff4d4f',
		colorBgBase: '#f5f6fb',
		colorBgLayout: '#f0f2f5',
		borderRadius: 8,
		fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
	},
	components: {
		Layout: {
			headBg: '#ffffff',
			siderBg: '#ffffff',
			bodyBg: '#f5f6fb',
		},
		Button: {
			borderRadius: 8,
		},
		Card: {
			borderRadiusLG: 16,
			paddingLG: 28,
		},
		Modal: {
			borderRadiusLG: 16,
		},
	},
};

export const pageContainerStyle = {
	width: '100%',
	maxWidth: 1200,
	margin: '0 auto',
	padding: '0 24px 48px',
	minHeight: '100%',
};

export const cardGridProps = {
	gutter: [24, 24],
	justify: 'start',
	align: 'stretch',
};
