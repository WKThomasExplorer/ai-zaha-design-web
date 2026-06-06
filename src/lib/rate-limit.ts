type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const rateLimitStore: Map<string, RateLimitState> =
  (globalThis as typeof globalThis & { __rateLimitStore__?: Map<string, RateLimitState> }).__rateLimitStore__ ??
  new Map<string, RateLimitState>();

(globalThis as typeof globalThis & { __rateLimitStore__?: Map<string, RateLimitState> }).__rateLimitStore__ = rateLimitStore;

function cleanupExpired(now: number) {
  for (const [key, state] of rateLimitStore.entries()) {
    if (state.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function consumeRateLimit(
  key: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpired(now);

  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      limited: false,
      remaining: Math.max(0, config.maxRequests - 1),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  const limited = existing.count > config.maxRequests;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    limited,
    remaining: Math.max(0, config.maxRequests - existing.count),
    retryAfterSeconds,
  };
}
