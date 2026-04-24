import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { users } from '@/storage/database/shared/schema';
import { desc, ilike, or, sql } from 'drizzle-orm';
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

  const offset = (page - 1) * limit;

  try {
    const db = getDb();
    
    // Build query conditions
    let queryCondition = undefined;
    if (search) {
      const q = `%${search}%`;
      queryCondition = or(
        ilike(users.username, q),
        ilike(users.email, q)
      );
    }

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(queryCondition);

    // Data query
    const data = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(queryCondition)
      .orderBy(desc(users.created_at))
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
    console.error('Admin Users Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
