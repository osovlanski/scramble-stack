import cron from 'node-cron';
import { prisma } from './db';
import sourcesConfig from '../sources.config';
import { runIngestion } from './sources/ingestor';
import { runCuration } from './curator/curatorService';
import { generateDigest } from './digest/digestService';
import { runPreferenceAgent } from './personalization/preferenceAgent';

const feedCron = process.env.FEED_REFRESH_CRON ?? '*/30 * * * *';
const digestCron = process.env.DIGEST_CRON ?? '0 7 * * *';
const preferenceAgentCron = '0 3 * * 0'; // weekly, Sunday 3am
const cleanupCron = '0 4 * * 0';          // weekly, Sunday 4am

export function startScheduler(): void {
  cron.schedule(feedCron, async () => {
    console.log('[scheduler] feed refresh started');
    const { fetched } = await runIngestion(sourcesConfig);
    console.log(`[scheduler] feed refresh done — ${fetched} articles fetched`);
    const { curated } = await runCuration();
    console.log(`[scheduler] curation done — ${curated} articles enriched`);
  });

  cron.schedule(digestCron, async () => {
    const date = new Date().toISOString().split('T')[0];
    console.log(`[scheduler] generating digest for ${date}`);
    const { articleCount } = await generateDigest(date);
    console.log(`[scheduler] digest done — ${articleCount} articles`);
  });

  cron.schedule(preferenceAgentCron, async () => {
    console.log('[scheduler] running preference agent');
    const { updated } = await runPreferenceAgent();
    console.log(`[scheduler] preference agent done — updated: ${updated}`);
  });

  cron.schedule(cleanupCron, async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const { count } = await prisma.article.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    console.log(`[scheduler] cleanup done — deleted ${count} articles older than 30 days`);
  });

  console.log('[scheduler] jobs registered');
}
