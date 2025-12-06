export const searchContent = (content, query) => {
	if (!query.trim()) return content;

	const searchTerms = query.toLowerCase().split(/\s+/);

	return content.filter(item => {
		const searchText = `
      ${item.title || ''}
      ${item.description || ''}
      ${item.content || ''}
      ${item.keywords?.join(' ') || ''}
      ${item.tags?.join(' ') || ''}
    `.toLowerCase();

		return searchTerms.every(term => searchText.includes(term));
	});
};

export const highlightText = (text, query) => {
	if (!query) return text;

	const regex = new RegExp(`(${query})`, 'gi');
	return text.replace(regex, '<mark>$1</mark>');
};