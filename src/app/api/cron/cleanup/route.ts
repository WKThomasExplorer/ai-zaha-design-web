import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { generationPackages } from '@/storage/database/shared/schema';
import { lt, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  try {
    const db = getDb();
    const deleted = await db
      .delete(generationPackages)
      .where(lt(generationPackages.expires_at, sql`now()`))
      .returning({ id: generationPackages.id });
    const deletedCount = deleted.length;

    console.log(`[CRON] cleanup ok deleted=${deletedCount ?? 'unknown'} latency_ms=${Date.now() - start}`);
    return NextResponse.json({ success: true, deletedCount });
  } catch (e) {
    console.log(`[CRON] cleanup failed latency_ms=${Date.now() - start}`);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Cleanup failed' },
      { status: 500 },
    );
  }
}
