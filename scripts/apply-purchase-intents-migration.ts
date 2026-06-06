/**
 * 创建 purchase_intents 表及索引。
 * 执行：pnpm exec tsx scripts/apply-purchase-intents-migration.ts
 */
import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_intents (
        id serial PRIMARY KEY,
        email text,
        price text NOT NULL,
        product text NOT NULL,
        prompt text,
        effect_image_url text,
        explosion_image_url text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS purchase_intents_price_idx ON purchase_intents (price)');
    await client.query('CREATE INDEX IF NOT EXISTS purchase_intents_created_at_idx ON purchase_intents (created_at)');

    await client.query('COMMIT');
    console.log('Purchase intents migration applied.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
