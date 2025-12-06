import React from 'react';
import { useParams } from 'react-router-dom';
import VideoEditForm from '../../components/Admin/VideoEditForm';
import './ContentEditPage.css';

const VideoEdit = () => {
	const { id } = useParams();
	const mode = id ? 'edit' : 'create';

	return (
		<div className="content-edit-page">
			<VideoEditForm mode={mode} />
		</div>
	);
};

export default VideoEdit;