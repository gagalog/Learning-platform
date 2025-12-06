import React from 'react';
import { Card, Tag, Typography, Space, Flex } from 'antd';
import { Link } from 'react-router-dom';
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import './ArticleCard.css';

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

const ArticleCard = ({ article, onClick }) => {
	const coverInitial = article.title?.charAt(0)?.toUpperCase() || 'A';

	return (
		<Link to={`/article/${article.id}`} className="content-card__link" onClick={onClick}>
			<Card hoverable className="content-card">
				<div className="content-card__cover">
					{article.thumbnail ? (
						<img src={article.thumbnail} alt={article.title} loading="lazy" />
					) : (
						<div className="content-card__placeholder">{coverInitial}</div>
					)}
				</div>
				<Space direction="vertical" size={12} className="content-card__body">
					<Title level={4} className="content-card__title">
						{article.title}
					</Title>
					<Paragraph type="secondary" ellipsis={{ rows: 2 }}>
						{article.description || '这篇文章暂时没有简介。'}
					</Paragraph>
					<Flex gap="small" wrap className="content-card__meta">
						<Text type="secondary">
							<CalendarOutlined /> {formatDate(article.publishedAt)}
						</Text>
						<Text type="secondary">
							<EyeOutlined /> {article.clickCount || 0} 浏览
						</Text>
					</Flex>
					{article.tags && article.tags.length > 0 && (
						<Space size={[4, 4]} wrap>
							{article.tags.map((tag) => (
								<Tag key={tag} color="blue">
									{tag}
								</Tag>
							))}
						</Space>
					)}
				</Space>
			</Card>
		</Link>
	);
};

export default ArticleCard;