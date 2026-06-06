import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { purchaseIntents } from '@/storage/database/shared/schema';

const EMAIL_MAX = 254;

function isValidEmail(value: string): boolean {
  if (value.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      price = '$19',
      product = 'hd_unlock_waitlist',
      prompt,
      effectImageUrl,
      explosionImageUrl,
    } = body as {
      email?: string;
      price?: string;
      product?: string;
      prompt?: string;
      effectImageUrl?: string;
      explosionImageUrl?: string;
    };

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
      .insert(purchaseIntents)
      .values({
        email: normalizedEmail,
        price: String(price),
        product: String(product),
        prompt: typeof prompt === 'string' ? prompt : null,
        effect_image_url: typeof effectImageUrl === 'string' ? effectImageUrl : null,
        explosion_image_url: typeof explosionImageUrl === 'string' ? explosionImageUrl : null,
      })
      .returning({ id: purchaseIntents.id });

    return NextResponse.json({ success: true, intentId: inserted[0]?.id ?? null });
  } catch (error) {
    console.error('Purchase intent capture error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture purchase intent' },
      { status: 500 }
    );
  }
}
