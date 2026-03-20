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

/** Rate limit with graceful fallback — allows request if Redis is unavailable */
export const chatRateLimit = {
  async limit(key: string): Promise<{ success: boolean }> {
    if (!rateLimit) return { success: true }; // No Redis = no rate limiting (dev mode)
    try {
      return await rateLimit.limit(key);
    } catch (err) {
      console.error('Rate limit check failed, allowing request:', err);
      return { success: true }; // Fail open — don't block users if Redis is down
    }
  },
};

/** Rate limit for expensive AI routes (extract-business, generate-prompt, suggest-replies) */
export const aiRouteRateLimit = {
  async limit(key: string): Promise<{ success: boolean }> {
    if (!aiRateLimit) return { success: true };
    try {
      return await aiRateLimit.limit(key);
    } catch (err) {
      console.error('AI rate limit check failed, allowing request:', err);
      return { success: true };
    }
  },
};
