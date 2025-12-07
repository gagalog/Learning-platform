const categories = ['wallpaper', 'waifu', 'neko', 'shinobu', 'megumin', 'happy', 'smile', 'wink'];

let clientPromise;

const getClient = () => {
	if (!clientPromise) {
		clientPromise = import('waifu-pics-api').then((mod) => mod.default || mod);
	}
	return clientPromise;
};

const getRandomWallpaper = async (preferredCategory) => {
	try {
		const fetchWallpaper = await getClient();
		const category = preferredCategory || categories[Math.floor(Math.random() * categories.length)];
		const url = await fetchWallpaper(category, { nsfw: false });
		return url;
	} catch (error) {
		console.error('Failed to fetch wallpaper:', error.message || error);
		return null;
	}
};

module.exports = {
	getRandomWallpaper,
};
