/**
 * 删除所有用户行并添加 users.email 列（及唯一索引）。
 * 在首次部署含 email 的 schema 前在本地/CI 对 Neon 等数据库执行一次：
 *   pnpm exec tsx scripts/apply-user-email-migration.ts
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
    await client.query('DELETE FROM users');

    const { rows: cols } = await client.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
    `);

    if (cols.length === 0) {
      // 已清空 users，可直接加 NOT NULL 列
      await client.query('ALTER TABLE users ADD COLUMN email text NOT NULL');
    }

    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (email)');

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('User email migration applied: all users removed, email column ready.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
