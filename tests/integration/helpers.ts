import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { createDb, type Db } from '@/lib/db/client';

config({ path: '.env.local' });

const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl || !new URL(testUrl).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL must point to a *_test database');
}

export const { db: testDb, close: closeTestDb } = createDb(testUrl);

export async function resetDb(db: Db = testDb): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE feedback, recommendations, analyses, clients, app_settings CASCADE`,
  );
}
