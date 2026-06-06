/**
 * 创建 email_leads / result_feedback 表及索引。
 * 执行：pnpm exec tsx scripts/apply-leads-feedback-migration.ts
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
      CREATE TABLE IF NOT EXISTS email_leads (
        id serial PRIMARY KEY,
        email text NOT NULL,
        source text NOT NULL,
        prompt text,
        style text,
        effect_image_url text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS email_leads_email_idx ON email_leads (email)');
    await client.query('CREATE INDEX IF NOT EXISTS email_leads_source_idx ON email_leads (source)');
    await client.query('CREATE INDEX IF NOT EXISTS email_leads_created_at_idx ON email_leads (created_at)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS result_feedback (
        id serial PRIMARY KEY,
        email text,
        rating text NOT NULL,
        comment text,
        prompt text,
        effect_image_url text,
        explosion_image_url text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS result_feedback_rating_idx ON result_feedback (rating)');
    await client.query('CREATE INDEX IF NOT EXISTS result_feedback_created_at_idx ON result_feedback (created_at)');

    await client.query('COMMIT');
    console.log('Leads & feedback migration applied.');
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
