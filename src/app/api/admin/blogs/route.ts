import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { blogPosts } from '@/storage/database/shared/schema';
import { desc, ilike, sql } from 'drizzle-orm';
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
    
    let queryCondition = undefined;
    if (search) {
      queryCondition = ilike(blogPosts.title, `%${search}%`);
    }

    // Count query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(queryCondition);

    // Data query
    const data = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        summary: blogPosts.summary,
        created_at: blogPosts.created_at,
        updated_at: blogPosts.updated_at,
      })
      .from(blogPosts)
      .where(queryCondition)
      .orderBy(desc(blogPosts.created_at))
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
    console.error('Admin Blogs Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blogs' }, { status: 500 });
  }
}
