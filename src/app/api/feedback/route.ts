import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { resultFeedback } from '@/storage/database/shared/schema';

const ALLOWED_RATINGS = new Set(['love_it', 'needs_changes', 'not_useful']);
const EMAIL_MAX = 254;

function isValidEmail(value: string): boolean {
  if (value.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rating,
      comment,
      email,
      prompt,
      effectImageUrl,
      explosionImageUrl,
    } = body as {
      rating?: string;
      comment?: string;
      email?: string;
      prompt?: string;
      effectImageUrl?: string;
      explosionImageUrl?: string;
    };

    if (typeof rating !== 'string' || !ALLOWED_RATINGS.has(rating)) {
      return NextResponse.json(
        { success: false, error: 'Invalid rating' },
        { status: 400 }
      );
    }

    let normalizedEmail: string | null = null;
    if (typeof email === 'string' && email.trim()) {
      const trimmed = email.trim().toLowerCase();
      if (!isValidEmail(trimmed)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        );
      }
      normalizedEmail = trimmed;
    }

    const db = getDb();
    const inserted = await db
      .insert(resultFeedback)
      .values({
        email: normalizedEmail,
        rating,
        comment: typeof comment === 'string' && comment.trim() ? comment.trim() : null,
        prompt: typeof prompt === 'string' ? prompt : null,
        effect_image_url: typeof effectImageUrl === 'string' ? effectImageUrl : null,
        explosion_image_url: typeof explosionImageUrl === 'string' ? explosionImageUrl : null,
      })
      .returning({ id: resultFeedback.id });

    return NextResponse.json({ success: true, feedbackId: inserted[0]?.id ?? null });
  } catch (error) {
    console.error('Feedback capture error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture feedback' },
      { status: 500 }
    );
  }
}
