import React from 'react';
import { useParams } from 'react-router-dom';
import ArticleEditForm from '../../components/Admin/ArticleEditForm';
import './ContentEditPage.css';

const ArticleEdit = () => {
	const { id } = useParams();
	const mode = id ? 'edit' : 'create';

	return (
		<div className="content-edit-page">
			<ArticleEditForm mode={mode} />
		</div>
	);
};

export default ArticleEdit;