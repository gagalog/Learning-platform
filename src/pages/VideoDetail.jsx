import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { api } from '../services/api';
import './VideoDetail.css';
import CommentSection from '../components/Content/CommentSection';

const VideoDetail = () => {
	const { id } = useParams();
	const [video, setVideo] = useState(null);
	const [loading, setLoading] = useState(true);

	const playableSource = useMemo(() => {
		if (!video?.videoUrl) return null;
		const url = video.videoUrl.trim();
		if (ReactPlayer.canPlay(url)) {
			return { type: 'react-player', url };
		}

		const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/i);
		if (bilibiliMatch) {
			const bvid = bilibiliMatch[1];
			const embedUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`;
			return { type: 'iframe', url: embedUrl };
		}

		return null;
	}, [video?.videoUrl]);

	useEffect(() => {
		const fetchVideo = async () => {
			try {
				const data = await api.getVideo(id);
				setVideo(data);
				await api.recordView('video', id);
			} catch (error) {
				console.error('获取视频详情失败:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchVideo();
	}, [id]);

	if (loading) return <div className="loading">加载中...</div>;
	if (!video) return <div className="error">视频不存在</div>;

	return (
		<div className="video-detail">
			<h1>{video.title}</h1>
			<div className="meta">
				<span>📅 发布时间: {new Date(video.publishedAt).toLocaleDateString()}</span>
				<span>👁️ 浏览: {video.clickCount || 0}次</span>
				<span>🏷️ 标签: {video.tags?.join(', ') || '无'}</span>
			</div>
			<div className="responsive-player">
				<div className="video-player">
					{playableSource ? (
						playableSource.type === 'iframe' ? (
							<iframe
								src={playableSource.url}
								title={video.title}
								className="embedded-player"
								frameBorder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
								allowFullScreen
							/>
						) : (
							<ReactPlayer
								url={playableSource.url}
								className="react-player"
								width="100%"
								height="100%"
								controls
								playsinline
								config={{
									file: {
										attributes: {
											poster: video.thumbnailUrl || undefined
										}
									}
								}}
							/>
						)
					) : (
						<div className="player-placeholder">
							<p>🎬 暂无可播放的视频链接</p>
							<p>请联系管理员补充 videoUrl</p>
						</div>
					)}
				</div>
			</div>
			<div className="description">
				<h3>视频描述</h3>
				<p>{video.description}</p>
			</div>
			<CommentSection contentType="video" contentId={id} />
		</div>
	);
};

export default VideoDetail;