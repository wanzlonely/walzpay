/**
 * lib/rate-limit.ts
 * Sliding-window rate limiting menggunakan Upstash Redis
 * Aman dari brute force, DDoS ringan, dan abuse API
 */

import { getRedis } from './redis';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

/**
 * Sliding window rate limit via Redis sorted set
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;

  try {
    // Atomic pipeline: cleanup old + add new + count
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(redisKey, '-inf', windowStart);
    pipe.zadd(redisKey, { score: now, member });
    pipe.zcard(redisKey);
    pipe.pexpire(redisKey, windowMs + 5000);
    const results = await pipe.exec();

    const count = (results[2] as number) ?? 0;
    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: now + windowMs,
    };
  } catch {
    // Fail open - jangan blokir user kalau Redis error
    return { success: true, limit, remaining: limit, resetAt: now + windowMs };
  }
}

/** Rate limit presets */
export const LIMITS = {
  LOGIN:    { limit: 5,   windowMs: 15 * 60 * 1000 }, // 5x per 15 menit per IP
  REGISTER: { limit: 3,   windowMs: 60 * 60 * 1000 }, // 3x per jam per IP
  API_KEY:  { limit: 120, windowMs: 60 * 1000 },       // 120x per menit per API key
  WEBHOOK:  { limit: 60,  windowMs: 60 * 1000 },       // 60x per menit
  ORDERS:   { limit: 30,  windowMs: 60 * 1000 },       // 30x per menit per user
  GENERAL:  { limit: 300, windowMs: 60 * 1000 },       // 300x per menit per IP
} as const;

/** Helper: return 429 response with proper headers */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  );
}
