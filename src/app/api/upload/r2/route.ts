import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/jwt';
import { buildR2ObjectKey, uploadToR2 } from '@/lib/r2';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Missing file (use form field "file")' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File must be 10MB or smaller' },
        { status: 400 }
      );
    }

    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED.has(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, or WebP is allowed' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = buildR2ObjectKey(file.name);
    const url = await uploadToR2(buffer, key, contentType);

    return NextResponse.json({ success: true, url, key });
  } catch (err) {
    console.error('R2 upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
