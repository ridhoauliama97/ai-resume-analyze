import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string): { db: Db; close: () => Promise<void> } {
  // `prepare: false` keeps postgres-js compatible with Supabase transaction
  // pooling (PgBouncer), where prepared statements are not connection-scoped.
  const max = Number(process.env.DB_MAX_CONNECTIONS ?? 3);
  const client = postgres(url, {
    max: Number.isFinite(max) && max > 0 ? max : 3,
    prepare: false,
  });
  return {
    db: drizzle(client, { schema }),
    close: async () => {
      await client.end();
    },
  };
}

let dbSingleton: Db | null = null;

export function getDb(): Db {
  if (!dbSingleton) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    dbSingleton = createDb(url).db;
  }
  return dbSingleton;
}
