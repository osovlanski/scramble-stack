import { prisma } from '../db';
import { fetchFromSource } from './fetcherRegistry';
import type { SourceConfig } from './types';

export async function runIngestion(sources: SourceConfig[]): Promise<{ fetched: number }> {
  let fetched = 0;

  for (const source of sources) {
    const articles = await fetchFromSource(source);

    for (const article of articles) {
      await prisma.article.upsert({
        where: { externalId: article.externalId },
        update: {},
        create: {
          externalId: article.externalId,
          title: article.title,
          url: article.url,
          sourceId: article.sourceId,
          publishedAt: article.publishedAt,
          rawContent: article.rawContent,
        },
      });
    }

    fetched += articles.length;
  }

  return { fetched };
}
