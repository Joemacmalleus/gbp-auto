/**
 * Simple in-memory rate limiter (Map-based, suitable for Vercel serverless).
 * Tracks requests per key and enforces rate limits.
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if a request is allowed under the rate limit.
   * Returns { allowed: boolean, retryAfter?: number }
   */
  check(
    key: string,
    config: RateLimitConfig
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // First request or window expired
    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { allowed: true };
    }

    // Within window
    if (entry.count < config.maxRequests) {
      entry.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  /**
   * Reset the rate limiter for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all stored entries (useful for testing or cleanup)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get current state for a key (for debugging)
   */
  getState(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }
}

// Global singleton instance
const globalLimiter =
  (globalThis as any)._rateLimiter || new InMemoryRateLimiter();

if (process.env.NODE_ENV !== "production") {
  (globalThis as any)._rateLimiter = globalLimiter;
}

/**
 * Create a rate limit checker for a specific endpoint.
 * Optionally accepts a custom key function (defaults to IP address).
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function check(
    key: string = "global"
  ): { allowed: boolean; retryAfter?: number } {
    return globalLimiter.check(key, config);
  };
}

/**
 * Predefined rate limit configs for common scenarios
 */
export const RateLimitPresets = {
  // Strict: 5 requests per minute
  STRICT: { windowMs: 60 * 1000, maxRequests: 5 },

  // Moderate: 20 requests per minute
  MODERATE: { windowMs: 60 * 1000, maxRequests: 20 },

  // Generous: 100 requests per minute
  GENEROUS: { windowMs: 60 * 1000, maxRequests: 100 },

  // Per-hour limits
  HOURLY_STRICT: { windowMs: 60 * 60 * 1000, maxRequests: 50 },
  HOURLY_MODERATE: { windowMs: 60 * 60 * 1000, maxRequests: 500 },
  HOURLY_GENEROUS: { windowMs: 60 * 60 * 1000, maxRequests: 5000 },
};

// Pre-created limiters for common use cases
export const rateLimiters = {
  // AI generation endpoints (strict)
  aiGeneration: createRateLimiter(RateLimitPresets.STRICT),

  // Sync operations (moderate)
  sync: createRateLimiter(RateLimitPresets.MODERATE),

  // General API endpoints (generous)
  api: createRateLimiter(RateLimitPresets.GENEROUS),
};

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (should not happen in production)
  return "unknown";
}
