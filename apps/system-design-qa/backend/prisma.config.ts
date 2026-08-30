import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Client generation is an install-time compile step and needs a URL shape, not
// a live database or secret. Runtime migration/deploy commands provide the real URL.
const datasourceUrl = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/scramble_qa';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: datasourceUrl,
  },
});
