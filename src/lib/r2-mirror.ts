import { nanoid } from 'nanoid';
import { uploadToR2 } from '@/lib/r2';

/** 业务所需 R2 环境变量是否齐全；未配置时仍走 AI 返回的临时 URL 写入历史记录。 */
export function isR2MirroringEnabled(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

function extForContentType(contentType: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('png')) return 'png';
  if (ct.includes('gif')) return 'gif';
  return 'png';
}

/**
 * 拉取 AI 返回的临时图，上传到 R2，返回可长期访问的公网 URL。
 */
export async function mirrorTempImageUrlToR2(
  tempImageUrl: string,
  kind: 'effect' | 'explosion'
): Promise<string> {
  const res = await fetch(tempImageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch temp image: HTTP ${res.status}`);
  }
  const rawType = res.headers.get('content-type');
  const contentType = rawType?.split(';')[0]?.trim() || 'image/png';
  const imageBuffer = Buffer.from(await res.arrayBuffer());
  const fileName = `images/${kind}/${nanoid()}.${extForContentType(contentType)}`;
  return uploadToR2(imageBuffer, fileName, contentType);
}
