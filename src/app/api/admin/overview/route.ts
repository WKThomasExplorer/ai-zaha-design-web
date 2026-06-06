import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/storage/database/db';
import { users, blogPosts, generationRuns, purchaseIntents, emailLeads, resultFeedback } from '@/storage/database/shared/schema';
import { count, eq, sql } from 'drizzle-orm';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-zaha-home-design-secret-key-2024';
const ADMIN_USERNAMES = ['admin'];

// Helper to verify admin token in API routes
export async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    const cookieToken = request.cookies.get('auth_token');
    token = cookieToken?.value || null;
  }

  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const username = payload.username as string;
    return ADMIN_USERNAMES.includes(username);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();

    // 1. User metrics
    const [totalUsers] = await db.select({ count: count() }).from(users);
    
    // Recent users (last 7 days)
    const [recentUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.created_at} > now() - interval '7 days'`);

    // 2. Blog metrics
    const [totalBlogs] = await db.select({ count: count() }).from(blogPosts);

    // 3. Generation metrics
    const [effectCount] = await db
      .select({ count: count() })
      .from(generationRuns)
      .where(eq(generationRuns.type, 'effect'));

    const [explosionCount] = await db
      .select({ count: count() })
      .from(generationRuns)
      .where(eq(generationRuns.type, 'explosion'));

    const [failedCount] = await db
      .select({ count: count() })
      .from(generationRuns)
      .where(eq(generationRuns.status, 'failed'));

    // Recent generations (last 7 days)
    const [recentGenerations] = await db
      .select({ count: count() })
      .from(generationRuns)
      .where(sql`${generationRuns.created_at} > now() - interval '7 days'`);

    // 4. Lead and feedback metrics
    const [leadTotal] = await db.select({ count: count() }).from(emailLeads);
    const [feedbackTotal] = await db.select({ count: count() }).from(resultFeedback);

    // 5. Purchase intent metrics
    const [intentTotal] = await db.select({ count: count() }).from(purchaseIntents);
    const [intentRecent] = await db
      .select({ count: count() })
      .from(purchaseIntents)
      .where(sql`${purchaseIntents.created_at} > now() - interval '7 days'`);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers.count,
          recent: recentUsers.count,
        },
        blogs: {
          total: totalBlogs.count,
        },
        generations: {
          effectTotal: effectCount.count,
          explosionTotal: explosionCount.count,
          failedTotal: failedCount.count,
          recentTotal: recentGenerations.count,
        },
        leads: {
          total: leadTotal.count,
        },
        feedback: {
          total: feedbackTotal.count,
        },
        intents: {
          total: intentTotal.count,
          recent: intentRecent.count,
        }
      }
    });
  } catch (error) {
    console.error('Admin Overview Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch overview data' }, { status: 500 });
  }
}
