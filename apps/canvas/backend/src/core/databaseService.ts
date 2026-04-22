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
    const isRemote = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isRemote ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Reset all state on pool error so the next request re-initializes cleanly
    pool.on('error', (err) => {
      logger.fail('Database pool error — will reconnect on next request', { error: err.message });
      const dyingPool = pool;
      pool = null;
      adapter = null;
      prismaInstance = null;
      globalThis.prisma = undefined;
      initialized = false;
      dyingPool?.end().catch(() => {});
    });

    adapter = new PrismaPg(pool);

    prismaInstance = new PrismaClient({
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

export class DbNotInitializedError extends Error {
  constructor() {
    super('Database is not initialized — check DATABASE_URL and DB connectivity');
    this.name = 'DbNotInitializedError';
  }
}

export const requirePrisma = (): PrismaClient => {
  const client = getPrisma();
  if (!client) throw new DbNotInitializedError();
  return client;
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
