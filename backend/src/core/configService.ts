import logger from './logger';

const DEFAULT_CONFIG = {
  'canvas.diagram.maxVersions': 20,
  'canvas.diagram.versionEveryNSaves': 10,
  'canvas.ai.maxTokens': 4000,
  'canvas.export.maxThumbnailSize': 500000,
  'api.rateLimit.requests': 100,
  'api.rateLimit.windowMs': 60000,
  'ai.claude.defaultModel': 'claude-sonnet-4-20250514',
  'cache.memory.ttlSeconds': 300,
  'cache.redis.ttlSeconds': 3600,
} as const;

type ConfigKey = keyof typeof DEFAULT_CONFIG;
type ConfigValue = string | number | boolean;

const configCache: Map<string, unknown> = new Map();

export const configService = {
  init: async (): Promise<void> => {
    logger.success('Config service initialized');
  },

  get: <T extends ConfigValue>(key: ConfigKey, defaultValue?: T): T => {
    const envKey = key.toUpperCase().replace(/\./g, '_');
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      if (envValue === 'true') return true as T;
      if (envValue === 'false') return false as T;
      if (!isNaN(Number(envValue))) return Number(envValue) as T;
      return envValue as T;
    }
    const dbValue = configCache.get(key);
    if (dbValue !== undefined) return dbValue as T;
    return (defaultValue ?? DEFAULT_CONFIG[key]) as T;
  },
};

export default configService;
