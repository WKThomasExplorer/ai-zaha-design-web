import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

let s3Client: S3Client | null = null;

function getR2S3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2: missing R2_ENDPOINT, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY');
  }
  s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  return s3Client;
}

function publicObjectUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  const path = key.replace(/^\/+/, '');
  return `${base}/${path}`;
}

/**
 * 上传文件到 Cloudflare R2（S3 兼容 API），返回公开访问 URL。
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2: R2_BUCKET_NAME is not set');
  }

  const client = getR2S3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return publicObjectUrl(fileName);
}

const SAFE_FILENAME = /[^a-zA-Z0-9._-]/g;

/**
 * 生成可安全作为 R2 Key 使用的路径（避免路径穿越与覆盖随意文件）。
 */
export function buildR2ObjectKey(originalName: string, prefix = 'uploads'): string {
  const base =
    originalName
      .split(/[/\\]/)
      .pop()
      ?.replace(SAFE_FILENAME, '_')
      .slice(0, 120) || 'file';
  const id = randomBytes(8).toString('hex');
  return `${prefix.replace(/\/+$/, '')}/${Date.now()}-${id}-${base}`;
}
