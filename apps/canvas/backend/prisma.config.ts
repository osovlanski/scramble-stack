import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// `prisma generate` runs during a clean install and does not connect to the DB.
// Keep installs reproducible without requiring a developer/CI secret; migrate and
// deploy commands still receive the real URL from their runtime environment.
const datasourceUrl = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/scramble_canvas';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: datasourceUrl,
  },
});
