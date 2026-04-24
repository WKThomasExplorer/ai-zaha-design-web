import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '@/storage/database/db';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/jwt';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { sendWelcomeEmail } from '@/lib/resend-mail';

const SALT_ROUNDS = 10;

const EMAIL_MAX = 254;

function isValidEmail(value: string): boolean {
  if (value.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { turnstileToken, ...registrationData } = body as {
      turnstileToken?: string;
      username?: string;
      password?: string;
      email?: string;
    };
    const { username, password, email: rawEmail } = registrationData;

    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: '请先完成人机验证' },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || undefined;
    const turnstileOk = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileOk) {
      return NextResponse.json(
        { success: false, error: '人机验证失败，请重试' },
        { status: 403 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

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

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 50 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = getDb();
    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const inserted = await db
      .insert(users)
      .values({
        username,
        email,
        password: hashedPassword,
      })
      .returning({ id: users.id, username: users.username, email: users.email });

    const newUser = inserted[0];
    if (!newUser) throw new Error('Failed to create user');

    const token = signToken({
      id: newUser.id,
      username: newUser.username,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    try {
      await sendWelcomeEmail(newUser.email, newUser.username);
    } catch (error) {
      console.error('欢迎邮件发送失败：', error);
    }

    return response;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
