/**
 * 本地验证：注册成功 + 尝试发送 Resend 欢迎邮件。
 * 需：服务已起在 http://localhost:5000、DATABASE_URL、RESEND_API_KEY、
 *     且 .env.local 中 TURNSTILE_BYPASS_DEV=1（仅开发，用于跳过人机验证）
 *
 * 运行：
 *   TURNSTILE_BYPASS_DEV=1 TEST_WELCOME_EMAIL=你的真实邮箱@example.com pnpm exec tsx scripts/test-register-welcome.ts
 */
import { config } from 'dotenv';
import path from 'node:path';
import { TURNSTILE_DEV_BYPASS_TOKEN } from '../src/lib/turnstile';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

const base = process.env.TEST_REGISTER_BASE_URL || 'http://localhost:5000';
const testEmail = process.env.TEST_WELCOME_EMAIL || '';

async function main() {
  if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
    console.error('请设置环境变量 TEST_WELCOME_EMAIL=你的可收信邮箱 再运行。');
    process.exit(1);
  }
  if (process.env.TURNSTILE_BYPASS_DEV !== '1') {
    console.error('请设置 TURNSTILE_BYPASS_DEV=1（仅本地开发，见 src/lib/turnstile.ts）。');
    process.exit(1);
  }

  const username = `test_welcome_${Date.now()}`;
  const password = 'testpw123';

  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      email: testEmail,
      turnstileToken: TURNSTILE_DEV_BYPASS_TOKEN,
    }),
  });

  const data = (await res.json()) as { success?: boolean; error?: string; user?: { email: string } };

  if (!res.ok || !data.success) {
    console.error('注册失败:', res.status, data);
    process.exit(1);
  }

  console.log('注册成功:', { username, email: data.user?.email });
  console.log('若 RESEND 与发件域配置正确，请检查邮箱收件箱/垃圾箱（主题含 Welcome to AI ZAHA）。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
