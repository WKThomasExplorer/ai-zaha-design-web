import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { generationRuns, users } from '@/storage/database/shared/schema';
import { desc, eq, ilike, sql, and } from 'drizzle-orm';
import { verifyAdmin } from '../overview/route';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';

  const offset = (page - 1) * limit;

  try {
    const db = getDb();
    
    // Build conditions
    const conditions = [];
    if (search) {
      // Allow searching by username or prompt description
      conditions.push(sql`${generationRuns.description} ILIKE ${'%' + search + '%'} OR ${users.username} ILIKE ${'%' + search + '%'}`);
    }
    if (status) {
      conditions.push(eq(generationRuns.status, status));
    }
    if (type) {
      conditions.push(eq(generationRuns.type, type));
    }

    const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generationRuns)
      .leftJoin(users, eq(generationRuns.user_id, users.id))
      .where(finalCondition);

    // Data query
    const data = await db
      .select({
        id: generationRuns.id,
        user_id: generationRuns.user_id,
        username: users.username,
        type: generationRuns.type,
        input_image_url: generationRuns.input_image_url,
        description: generationRuns.description,
        provider: generationRuns.provider,
        model: generationRuns.model,
        status: generationRuns.status,
        result_image_url: generationRuns.result_image_url,
        error_message: generationRuns.error_message,
        latency_ms: generationRuns.latency_ms,
        created_at: generationRuns.created_at,
      })
      .from(generationRuns)
      .leftJoin(users, eq(generationRuns.user_id, users.id))
      .where(finalCondition)
      .orderBy(desc(generationRuns.created_at))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Admin Renders Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renders' }, { status: 500 });
  }
}
