import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local' });

async function main() {
  const isTest = process.argv.includes('--test');
  const url = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

  if (!url) {
    throw new Error(isTest ? 'TEST_DATABASE_URL is not set' : 'DATABASE_URL is not set');
  }

  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
    console.log(`migrations applied to ${isTest ? 'test' : 'dev'} database`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
