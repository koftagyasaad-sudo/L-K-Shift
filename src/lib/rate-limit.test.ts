import { describe, expect, it } from "vitest";
import { checkRateLimit, clearRateLimit, getClientIp } from "./rate-limit";

describe("request rate limiting", () => {
  it("blocks requests after the configured window quota", () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    try {
      expect(checkRateLimit(key, 2).success).toBe(true);
      expect(checkRateLimit(key, 2).success).toBe(true);
      const blocked = checkRateLimit(key, 2);

      expect(blocked.success).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    } finally {
      clearRateLimit(key);
    }
  });

  it("uses the first forwarded address and falls back to the real IP header", () => {
    const forwardedRequest = new Request("https://example.test", {
      headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" },
    });
    const realIpRequest = new Request("https://example.test", {
      headers: { "x-real-ip": "203.0.113.9" },
    });

    expect(getClientIp(forwardedRequest)).toBe("203.0.113.8");
    expect(getClientIp(realIpRequest)).toBe("203.0.113.9");
  });
});
