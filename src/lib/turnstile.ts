const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * 使用 Cloudflare Turnstile 站点密钥校验前端 token（仅服务端调用）。
 * 与官方推荐一致，使用 `application/json` 请求体。
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return false;
  }
  if (!token || typeof token !== 'string') {
    return false;
  }

  const payload: { secret: string; response: string; remoteip?: string } = {
    secret,
    response: token,
  };
  if (remoteip) {
    payload.remoteip = remoteip;
  }

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
