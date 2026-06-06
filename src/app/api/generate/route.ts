import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { imageService } from '@/lib/ai/image-service';
import { isR2MirroringEnabled, mirrorTempImageUrlToR2 } from '@/lib/r2-mirror';
import { extractTokenFromHeader, verifyToken } from '@/lib/jwt';
import { getDb } from '@/storage/database/db';
import { generationPackages, generationRuns } from '@/storage/database/shared/schema';
import { and, desc, eq } from 'drizzle-orm';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { consumeRateLimit } from '@/lib/rate-limit';

/** AI 返回的临时 URL 在可配置时先镜像到 R2，数据库与接口统一返回可长期访问的地址。 */
async function resolveResultImageForStorage(
  tempUrl: string | undefined,
  kind: 'effect' | 'explosion'
): Promise<string | null> {
  if (!tempUrl) {
    return null;
  }
  if (!isR2MirroringEnabled()) {
    return tempUrl;
  }
  return mirrorTempImageUrlToR2(tempUrl, kind);
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim();
  return ip || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, effectImageUrl, description, type, turnstileToken } = body;

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    const payload = token ? verifyToken(token) : null;
    const userId = payload?.id ?? null;
    const isAnonymous = !userId;
    const requestIp = getRequestIp(request);

    if (isAnonymous) {
      if (typeof turnstileToken !== 'string' || !turnstileToken) {
        return NextResponse.json(
          { success: false, error: 'Please complete human verification' },
          { status: 400 }
        );
      }

      const turnstileOk = await verifyTurnstileToken(turnstileToken, requestIp);
      if (!turnstileOk) {
        return NextResponse.json(
          { success: false, error: 'Human verification failed, please retry' },
          { status: 403 }
        );
      }

      const rate = consumeRateLimit(`generate:${requestIp}:${type}`, {
        windowMs: 24 * 60 * 60 * 1000,
        maxRequests: 3,
      });

      if (rate.limited) {
        return NextResponse.json(
          {
            success: false,
            error: `Free preview limit reached. Please try again later or sign in.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(rate.retryAfterSeconds),
            },
          }
        );
      }
    }

    const db = getDb();
    const model = process.env.ARK_IMAGE_MODEL || 'doubao-seedream-4-0-250828';
    const provider = 'ark';
    const size = '2K';
    const watermark = false;

    const inputImageHash =
      typeof imageBase64 === 'string' && imageBase64.length > 0
        ? createHash('sha256').update(imageBase64).digest('hex')
        : null;

    let result;
    /** 与写入 generation_runs.result_image_url 相同：临时图已换成的 R2 永久链或回退的临时链 */
    let persistedResultImageUrl: string | null = null;

    if (type === 'effect') {
      const insertedPackages = await db
        .insert(generationPackages)
        .values({
          user_id: userId,
          input_image_hash: inputImageHash,
        })
        .returning({ id: generationPackages.id });
      const packageId = insertedPackages[0]?.id;
      if (!packageId) throw new Error('Failed to create generation package');

      result = await imageService.generateFacadeEffect(description, imageBase64);

      let resultImageForDb: string | null = null;
      if (result.success) {
        try {
          resultImageForDb = await resolveResultImageForStorage(
            result.imageUrl,
            'effect'
          );
        } catch (e) {
          console.error('[generate] R2 mirror failed (effect):', e);
          await db.insert(generationRuns).values({
            package_id: packageId,
            user_id: userId,
            type: 'effect',
            input_image_hash: inputImageHash,
            description,
            provider,
            model,
            size,
            watermark,
            status: 'failed',
            result_image_url: null,
            latency_ms:
              typeof result.latency === 'number' ? Math.round(result.latency) : null,
            error_code: 'r2_mirror',
            error_message: 'Failed to persist image to storage',
          });
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to persist image to storage. Please try again.',
            },
            { status: 502 }
          );
        }
      }
      persistedResultImageUrl = resultImageForDb;

      await db.insert(generationRuns).values({
        package_id: packageId,
        user_id: userId,
        type: 'effect',
        input_image_hash: inputImageHash,
        description,
        provider,
        model,
        size,
        watermark,
        status: result.success ? 'succeeded' : 'failed',
        result_image_url: resultImageForDb,
        latency_ms: typeof result.latency === 'number' ? Math.round(result.latency) : null,
        error_code: result.success ? null : result.error?.code ?? null,
        error_message: result.success ? null : result.error?.message ?? null,
      });
    } else if (type === 'explosion') {
      const baseImageUrl = effectImageUrl || imageBase64;
      if (typeof baseImageUrl !== 'string' || baseImageUrl.length === 0) {
        return NextResponse.json(
          { success: false, error: 'effectImageUrl is required for explosion generation' },
          { status: 400 }
        );
      }

      const existingEffect = await db
        .select({ package_id: generationRuns.package_id })
        .from(generationRuns)
        .where(and(eq(generationRuns.type, 'effect'), eq(generationRuns.result_image_url, baseImageUrl)))
        .orderBy(desc(generationRuns.created_at))
        .limit(1);

      let packageId = existingEffect[0]?.package_id;
      if (!packageId) {
        const insertedPackages = await db
          .insert(generationPackages)
          .values({
            user_id: userId,
            input_image_url: baseImageUrl,
          })
          .returning({ id: generationPackages.id });
        packageId = insertedPackages[0]?.id;
      }

      if (!packageId) throw new Error('Failed to resolve generation package');

      result = await imageService.generateExplosionDiagram(description, baseImageUrl);

      let resultImageForDb: string | null = null;
      if (result.success) {
        try {
          resultImageForDb = await resolveResultImageForStorage(
            result.imageUrl,
            'explosion'
          );
        } catch (e) {
          console.error('[generate] R2 mirror failed (explosion):', e);
          await db.insert(generationRuns).values({
            package_id: packageId,
            user_id: userId,
            type: 'explosion',
            input_image_url: baseImageUrl,
            description,
            provider,
            model,
            size,
            watermark,
            status: 'failed',
            result_image_url: null,
            latency_ms:
              typeof result.latency === 'number' ? Math.round(result.latency) : null,
            error_code: 'r2_mirror',
            error_message: 'Failed to persist image to storage',
          });
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to persist image to storage. Please try again.',
            },
            { status: 502 }
          );
        }
      }
      persistedResultImageUrl = resultImageForDb;

      await db.insert(generationRuns).values({
        package_id: packageId,
        user_id: userId,
        type: 'explosion',
        input_image_url: baseImageUrl,
        description,
        provider,
        model,
        size,
        watermark,
        status: result.success ? 'succeeded' : 'failed',
        result_image_url: resultImageForDb,
        latency_ms: typeof result.latency === 'number' ? Math.round(result.latency) : null,
        error_code: result.success ? null : result.error?.code ?? null,
        error_message: result.success ? null : result.error?.message ?? null,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid generation type' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        imageUrl: persistedResultImageUrl!,
        latency: result.latency,
      });
    } else {
      // Map internal error types to HTTP status codes
      let status = 500;
      const errorType = result.error?.type;
      
      if (errorType === 'AUTH') status = 401;
      else if (errorType === 'RATE') status = 429;
      else if (errorType === 'TIMEOUT') status = 504;

      return NextResponse.json(
        { 
          success: false, 
          error: result.error?.message || 'Generation failed',
          code: result.error?.code 
        },
        { status }
      );
    }
  } catch (error) {
    console.error('[ROUTE-ERROR] Generation API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
