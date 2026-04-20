import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// JWT_SECRET matching src/lib/jwt.ts
const JWT_SECRET = process.env.JWT_SECRET || 'ai-zaha-home-design-secret-key-2024';

// Check if username is admin
const ADMIN_USERNAMES = ['admin'];

export async function middleware(request: NextRequest) {
  // Only protect /admin routes (excluding API for now, API handles its own auth)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check auth cookie or Authorization header (for simplicity, we'll rely on the token stored in localStorage, 
    // but middleware can't read localStorage. In a real app, token should be in a cookie.
    // For this MVP without refactoring the entire auth to use cookies, 
    // we will check if there's a token in a cookie. If not, redirect to login.)
    
    const tokenCookie = request.cookies.get('auth_token');
    
    if (!tokenCookie?.value) {
      // Redirect to login if accessing admin without token
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(tokenCookie.value, secret);
      
      const username = payload.username as string;
      
      if (!ADMIN_USERNAMES.includes(username)) {
        // Not an admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // Is admin, allow
      return NextResponse.next();
    } catch (error) {
      // Invalid token
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
