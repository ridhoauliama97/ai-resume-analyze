import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local' });

export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;

  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must point to a *_test database');
  }

  const client = postgres(url, { max: 1 });

  try {
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
    await client`TRUNCATE TABLE feedback, recommendations, analyses, clients CASCADE`;
  } finally {
    await client.end();
  }
}
