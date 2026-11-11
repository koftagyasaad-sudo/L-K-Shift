// In-memory sliding-window rate limiter for serverless runtimes
declare global {
  var loginRateLimitMap: Map<string, { count: number; expiresAt: number }> | undefined;
}

const attemptsMap = globalThis.loginRateLimitMap || new Map<string, { count: number; expiresAt: number }>();
if (process.env.NODE_ENV !== "production") {
  globalThis.loginRateLimitMap = attemptsMap;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit = 5, windowMs = 60000): RateLimitResult {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record || record.expiresAt < now) {
    attemptsMap.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.expiresAt - now) / 1000);
    return { success: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, retryAfterSeconds: 0 };
}

export function clearRateLimit(key: string): void {
  attemptsMap.delete(key);
}
