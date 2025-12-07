import React, { memo } from 'react';
import { Card, Tag, Typography, Space, Flex, Badge } from 'antd';
import { Link } from 'react-router-dom';
import {
	CalendarOutlined,
	UserOutlined,
	FireOutlined,
	PlayCircleOutlined,
} from '@ant-design/icons';
import './VideoCard.css';
import { getOptimizedImageUrl, buildResponsiveSrcSet } from '../../utils/imageUtils';

const { Paragraph, Title, Text } = Typography;

const formatDate = (value) => {
	if (!value) return '日期未知';
	try {
		return new Date(value).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch (error) {
		return value;
	}
};

const VideoCard = ({ video, onClick }) => {
	const durationLabel = video.duration || video.length || '';
	const thumbnailInitial = video.title?.charAt(0)?.toUpperCase() || 'V';
	const authorLabel = video.author || video.instructor || video.uploader || '';
	const levelLabel = video.level || video.difficulty;
	const optimizedThumbnail = getOptimizedImageUrl(video.thumbnailUrl, {
		width: 480,
		height: 270,
		quality: 70,
	});
	const responsiveSrcSet = buildResponsiveSrcSet(video.thumbnailUrl, [
		{ width: 320 },
		{ width: 480 },
		{ width: 720 },
	]);
	const thumbnailSrc = optimizedThumbnail || video.thumbnailUrl;

	return (
		<Link to={`/video/${video.id}`} className="content-card__link" onClick={onClick}>
			<Card hoverable className="content-card">
				<div className="content-card__cover video-card__cover">
					{thumbnailSrc ? (
						<img
							src={thumbnailSrc}
							srcSet={responsiveSrcSet || undefined}
							sizes="(max-width: 768px) 100vw, 360px"
							alt={video.title}
							loading="lazy"
							width={480}
							height={270}
						/>
					) : (
						<div className="content-card__placeholder">{thumbnailInitial}</div>
					)}
					{durationLabel && (
						<Badge className="video-card__badge" count={durationLabel} color="#000000bf" />
					)}
				</div>
				<Space direction="vertical" size={10} className="content-card__body">
					<Flex align="center" justify="space-between">
						<Title level={4} className="content-card__title">
							{video.title}
						</Title>
						{video.category && <Tag color="purple">{video.category}</Tag>}
					</Flex>
					<Paragraph type="secondary" ellipsis={{ rows: 2 }}>
						{video.description || '这个视频暂时没有描述，快来添加吧。'}
					</Paragraph>
					<Flex gap="small" wrap className="content-card__meta">
						<Text type="secondary">
							<CalendarOutlined /> {formatDate(video.publishedAt)}
						</Text>
						{authorLabel && (
							<Text type="secondary">
								<UserOutlined /> {authorLabel}
							</Text>
						)}
						<Text type="secondary">
							<FireOutlined /> {video.clickCount || 0} 次观看
						</Text>
					</Flex>
					<Space size={[6, 6]} wrap>
						{levelLabel && (
							<Tag icon={<PlayCircleOutlined />} color="geekblue">
								{levelLabel}
							</Tag>
						)}
						{video.tags?.slice(0, 4).map((tag) => (
							<Tag key={tag} color="blue">
								{tag}
							</Tag>
						))}
					</Space>
				</Space>
			</Card>
		</Link>
	);
};

export default memo(VideoCard);