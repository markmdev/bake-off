/**
 * Simple in-memory rate limiter for API endpoints
 * For production at scale, consider Redis-based solutions like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and rate limit info
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    store.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientId(request: Request): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback - in production behind a proxy, this may not be accurate
  return 'unknown';
}

// Pre-configured rate limiters
export const authRateLimit = {
  limit: 10,
  windowMs: 60 * 1000, // 10 requests per minute
};

export const agentRateLimit = {
  limit: 60,
  windowMs: 60 * 1000, // 60 requests per minute (1 per second avg)
};
