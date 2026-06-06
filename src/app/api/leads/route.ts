import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { emailLeads } from '@/storage/database/shared/schema';

const EMAIL_MAX = 254;

function isValidEmail(value: string): boolean {
  if (value.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email: rawEmail,
      source = 'unknown',
      prompt,
      style,
      effectImageUrl,
    } = body as {
      email?: string;
      source?: string;
      prompt?: string;
      style?: string;
      effectImageUrl?: string;
    };

    if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const db = getDb();
    const inserted = await db
      .insert(emailLeads)
      .values({
        email,
        source: String(source),
        prompt: typeof prompt === 'string' ? prompt : null,
        style: typeof style === 'string' ? style : null,
        effect_image_url: typeof effectImageUrl === 'string' ? effectImageUrl : null,
      })
      .returning({ id: emailLeads.id });

    const lead = inserted[0];
    return NextResponse.json({ success: true, leadId: lead?.id ?? null });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
