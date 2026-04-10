import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: process.env.NEWS_DATABASE_URL ?? 'file:./prisma/dev.db' },
    },
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
