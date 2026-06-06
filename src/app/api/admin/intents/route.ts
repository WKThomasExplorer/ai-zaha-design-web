import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { purchaseIntents } from '@/storage/database/shared/schema';
import { desc, sql } from 'drizzle-orm';
import { verifyAdmin } from '../overview/route';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    const db = getDb();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseIntents);

    const data = await db
      .select({
        id: purchaseIntents.id,
        email: purchaseIntents.email,
        price: purchaseIntents.price,
        product: purchaseIntents.product,
        prompt: purchaseIntents.prompt,
        effect_image_url: purchaseIntents.effect_image_url,
        explosion_image_url: purchaseIntents.explosion_image_url,
        created_at: purchaseIntents.created_at,
      })
      .from(purchaseIntents)
      .orderBy(desc(purchaseIntents.created_at))
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
    console.error('Admin Intents Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch intents' }, { status: 500 });
  }
}
