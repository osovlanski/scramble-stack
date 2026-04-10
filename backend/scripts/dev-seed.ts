/**
 * Creates a dev user in the database and prints a JWT for local development.
 * Run once after setting up the DB: npx tsx scripts/dev-seed.ts
 */
import 'dotenv/config';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

if (!DATABASE_URL || !JWT_SECRET) {
  console.error('Missing DATABASE_URL or JWT_SECRET in .env');
  process.exit(1);
}

const isRemote = !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
});

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ id: string }>(`
      INSERT INTO "User" (id, email, name, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'dev@localhost', 'Dev User', now(), now())
      ON CONFLICT (email) DO UPDATE SET "updatedAt" = now()
      RETURNING id
    `);

    const userId = result.rows[0].id;
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    console.log('\n✅ Dev user ready');
    console.log(`   userId: ${userId}`);
    console.log('\n📋 Run this in your browser console:\n');
    console.log(`localStorage.setItem('auth_token', '${token}')\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
