import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - Fetch single article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid article ID' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .eq('id', articleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article: data });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}
