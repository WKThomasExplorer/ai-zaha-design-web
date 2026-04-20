import { NextRequest, NextResponse } from 'next/server';

const SAFE_FILENAME_REGEX = /[^a-zA-Z0-9._-]/g;

export async function GET(request: NextRequest) {
  try {
    const targetUrl = request.nextUrl.searchParams.get('url');
    const filenameParam = request.nextUrl.searchParams.get('filename') || 'download.png';

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing url query parameter' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid url query parameter' },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { success: false, error: 'Only http/https URLs are allowed' },
        { status: 400 }
      );
    }

    const upstream = await fetch(parsedUrl.toString());
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch upstream file (${upstream.status})` },
        { status: 502 }
      );
    }

    const fileBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const safeFilename = filenameParam.replace(SAFE_FILENAME_REGEX, '_');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    );
  }
}
