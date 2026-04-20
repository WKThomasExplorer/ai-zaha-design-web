import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '@/storage/database/db';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/jwt';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
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

    // Check if username already exists
    const db = getDb();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user
    const inserted = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
      })
      .returning({ id: users.id, username: users.username });

    const newUser = inserted[0];
    if (!newUser) throw new Error('Failed to create user');

    // Generate JWT token
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
      },
    });

    // Set cookie for middleware (7 days)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
