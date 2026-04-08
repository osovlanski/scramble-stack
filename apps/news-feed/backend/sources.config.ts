import { defineSource } from './src/sources/types';

export default [
  defineSource({
    id: 'geektime',
    type: 'rss',
    label: 'GeekTime',
    url: 'https://www.geektime.co.il/feed/',
    lang: 'he',
  }),
  defineSource({
    id: 'calcalist',
    type: 'rss',
    label: 'Calcalist Tech',
    url: 'https://www.calcalist.co.il/rss/',
    lang: 'he',
  }),
  defineSource({
    id: 'reddit-eng',
    type: 'reddit',
    label: 'r/engineering',
    subreddits: ['ExperiencedDevs', 'systems', 'devops', 'MachineLearning'],
    limit: 20,
  }),
  defineSource({
    id: 'tg-geektime',
    type: 'rsshub',
    label: 'GeekTime Telegram',
    rsshubRoute: '/telegram/channel/geektime_il',
  }),
  defineSource({
    id: 'tiktok-tech',
    type: 'rsshub',
    label: 'TikTok Tech Trending',
    rsshubRoute: '/tiktok/tag/softwareengineering',
  }),
];
