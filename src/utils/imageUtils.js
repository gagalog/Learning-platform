const isLocalHost = (hostname) => {
	if (!hostname) return false;
	const lower = hostname.toLowerCase();
	return lower === 'localhost' || lower === '127.0.0.1' || lower === '0.0.0.0';
};

const shouldOptimize = (url) => {
	if (!url || typeof url !== 'string') return false;
	if (!/^https?:\/\//i.test(url)) return false;
	try {
		const parsed = new URL(url);
		if (isLocalHost(parsed.hostname)) {
			return false;
		}
		if (typeof window !== 'undefined' && window.location?.hostname) {
			if (parsed.hostname === window.location.hostname) {
				return false;
			}
		}
		return true;
	} catch (error) {
		return false;
	}
};

export const getOptimizedImageUrl = (url, options = {}) => {
	if (!url || typeof url !== 'string') return '';
	const trimmed = url.trim();
	if (!shouldOptimize(trimmed)) {
		return trimmed;
	}

	const {
		width = 480,
		height = 270,
		quality = 75,
		format = 'webp',
		fit = 'cover'
	} = options;

	const target = trimmed.replace(/^https?:\/\//i, '');
	const params = new URLSearchParams({ url: target });

	if (width) params.set('w', width);
	if (height) params.set('h', height);
	if (fit) params.set('fit', fit);
	if (quality) params.set('q', quality);
	if (format) params.set('output', format);
	params.set('il', '1'); // enable progressive rendering

	return `https://images.weserv.nl/?${params.toString()}`;
};

export const buildResponsiveSrcSet = (url, descriptors = []) => {
	if (!url) return '';
	const items = (descriptors.length ? descriptors : [
		{ width: 320 },
		{ width: 480 },
		{ width: 640 }
	]).map((descriptor) => {
		if (typeof descriptor === 'number') {
			return { width: descriptor };
		}
		return descriptor;
	});

	const entries = items.map(({ width, height, descriptor, quality }) => {
		const computedHeight = height || Math.round((width / 16) * 9);
		const label = descriptor || `${width}w`;
		const optimized = getOptimizedImageUrl(url, {
			width,
			height: computedHeight,
			quality
		});
		return optimized ? `${optimized} ${label}` : '';
	}).filter(Boolean);

	return entries.join(', ');
};
