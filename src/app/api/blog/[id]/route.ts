import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { blogPosts } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch single article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid article ID' },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const rows = await db.select().from(blogPosts).where(eq(blogPosts.id, articleId)).limit(1);
    const article = rows[0];

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}
