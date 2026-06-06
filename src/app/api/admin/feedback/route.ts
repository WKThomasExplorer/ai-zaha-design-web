import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { resultFeedback } from '@/storage/database/shared/schema';
import { desc, sql } from 'drizzle-orm';
import { verifyAdmin } from '../overview/route';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  try {
    const db = getDb();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(resultFeedback);

    const data = await db
      .select({
        id: resultFeedback.id,
        email: resultFeedback.email,
        rating: resultFeedback.rating,
        comment: resultFeedback.comment,
        prompt: resultFeedback.prompt,
        effect_image_url: resultFeedback.effect_image_url,
        explosion_image_url: resultFeedback.explosion_image_url,
        created_at: resultFeedback.created_at,
      })
      .from(resultFeedback)
      .orderBy(desc(resultFeedback.created_at))
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
    console.error('Admin Feedback Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
