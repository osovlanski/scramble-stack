import { describe, it, expect } from 'vitest';
import { defineSource } from './types';

describe('defineSource', () => {
  it('returns the source config unchanged', () => {
    const source = defineSource({ id: 'test', type: 'rss', label: 'Test', url: 'https://example.com/feed' });
    expect(source.id).toBe('test');
    expect(source.type).toBe('rss');
  });

  it('accepts reddit source with subreddits', () => {
    const source = defineSource({ id: 'r', type: 'reddit', label: 'Reddit', subreddits: ['ExperiencedDevs'] });
    expect(source.subreddits).toEqual(['ExperiencedDevs']);
  });

  it('accepts rsshub source with route', () => {
    const source = defineSource({ id: 'tg', type: 'rsshub', label: 'Telegram', rsshubRoute: '/telegram/channel/foo' });
    expect(source.rsshubRoute).toBe('/telegram/channel/foo');
  });
});
