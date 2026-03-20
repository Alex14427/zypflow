import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const rateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'ratelimit:chat',
    })
  : null;

// AI routes rate limiter: 10 requests per hour per IP (more restrictive since they're expensive)
const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'ratelimit:ai',
    })
  : null;

// In-memory fallback rate limiter when Redis is unavailable
const memoryLimiter = new Map<string, { count: number; resetAt: number }>();
function memoryLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryLimiter.get(key);
  if (!entry || now > entry.resetAt) {
    memoryLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

/** Rate limit — fails CLOSED (blocks) if Redis is down, using in-memory fallback */
export const chatRateLimit = {
  async limit(key: string): Promise<{ success: boolean }> {
    if (!rateLimit) {
      // No Redis — use in-memory limiter (30 req/hour)
      return { success: memoryLimit(`chat:${key}`, 30, 3600_000) };
    }
    try {
      return await rateLimit.limit(key);
    } catch (err) {
      console.error('Rate limit check failed, using memory fallback:', err);
      return { success: memoryLimit(`chat:${key}`, 30, 3600_000) };
    }
  },
};

/** Rate limit for expensive AI routes (extract-business, generate-prompt, suggest-replies) */
export const aiRouteRateLimit = {
  async limit(key: string): Promise<{ success: boolean }> {
    if (!aiRateLimit) {
      return { success: memoryLimit(`ai:${key}`, 10, 3600_000) };
    }
    try {
      return await aiRateLimit.limit(key);
    } catch (err) {
      console.error('AI rate limit check failed, using memory fallback:', err);
      return { success: memoryLimit(`ai:${key}`, 10, 3600_000) };
    }
  },
};
