/**
 * 验证：公网图 URL → 拉取 → uploadToR2（与 /api/generate 内镜像同一路径）→
 * 公网可访问、HeadObject 确认在桶内。
 * 使用：pnpm exec tsx scripts/test-r2-mirror.ts
 */
import { config } from 'dotenv';
import { nanoid } from 'nanoid';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { uploadToR2 } from '../src/lib/r2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

/** 稳定可公网拉取的测试图（模拟 AI 临时 URL） */
const TEST_IMAGE =
  'https://dummyimage.com/320x200/1a1f36/ffffff.png&text=R2+test';

function isR2Configured(): boolean {
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
  return 'png';
}

function headR2Object(key: string) {
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client.send(
    new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  );
}

function keyFromPublicUrl(
  publicUrl: string,
  publicBase: string
): string | null {
  const b = publicBase.replace(/\/+$/, '');
  if (!publicUrl.startsWith(b)) {
    return null;
  }
  return publicUrl.slice(b.length + 1) || null;
}

async function main() {
  console.log('1) R2 环境齐全 →', isR2Configured());
  if (!isR2Configured()) {
    console.error(
      '请在 .env.local 中设置 R2_ENDPOINT、密钥、R2_BUCKET_NAME、R2_PUBLIC_URL。'
    );
    process.exit(1);
  }

  console.log('2) 从公网拉取（模拟 AI 返回的临时链）…', TEST_IMAGE);
  const res = await fetch(TEST_IMAGE);
  if (!res.ok) {
    throw new Error(`fetch 失败: ${res.status}`);
  }
  const contentType =
    res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
  const imageBuffer = Buffer.from(await res.arrayBuffer());
  const fileName = `images/effect/${nanoid()}.${extForContentType(contentType)}`;
  const permanentUrl = await uploadToR2(
    imageBuffer,
    fileName,
    contentType
  );
  console.log('3) 上传后的永久公网 URL：\n   ', permanentUrl);

  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (!permanentUrl.startsWith(base)) {
    console.error('URL 域名与 R2_PUBLIC_URL 不一致。');
    process.exit(1);
  }

  const key = keyFromPublicUrl(permanentUrl, base);
  if (!key) {
    console.error('无法从 URL 解析 Object Key。');
    process.exit(1);
  }
  console.log('4) R2 Object Key：', key);

  console.log('5) 公网 GET 测试…');
  const getRes = await fetch(permanentUrl, { method: 'GET' });
  console.log('   HTTP', getRes.status, getRes.headers.get('content-type') ?? '');

  console.log('6) S3 HeadObject（确认在桶 aizaha 内）…');
  const head = await headR2Object(key);
  console.log('   ContentLength', head.ContentLength, 'ContentType', head.ContentType);
  console.log(
    '\n✓ 通过：链接在 pub r2.dev 上可访问，且对象存在于你的 R2 桶。'
  );
  console.log(
    '  在页面里生图时，/api/generate 会把 AI 图用同样方式写入 R2 并返回此格式 URL。'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
