import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import logger from './logger';

let pool: pg.Pool | null = null;
let adapter: PrismaPg | null = null;
let prismaInstance: PrismaClient | null = null;
let initialized = false;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const initializePrisma = (): PrismaClient | null => {
  if (initialized) return prismaInstance;
  initialized = true;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.skip('DATABASE_URL not set, database features disabled');
    return null;
  }

  try {
    pool = new pg.Pool({ connectionString: databaseUrl });
    adapter = new PrismaPg(pool);

    prismaInstance = globalThis.prisma ?? new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalThis.prisma = prismaInstance;
    }

    logger.success('Prisma client initialized');
    return prismaInstance;
  } catch (error) {
    logger.fail('Failed to initialize Prisma client', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export const getPrisma = (): PrismaClient | null => {
  if (!initialized) initializePrisma();
  return prismaInstance;
};

export const databaseService = {
  isConfigured: () => {
    if (!initialized) initializePrisma();
    return !!prismaInstance;
  },

  connect: async (): Promise<void> => {
    initializePrisma();
    if (prismaInstance) {
      await prismaInstance.$connect();
      logger.db('Database connected');
    }
  },

  disconnect: async (): Promise<void> => {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      logger.disconnect('Database disconnected');
    }
    if (pool) {
      await pool.end();
    }
  },
};

export default databaseService;
