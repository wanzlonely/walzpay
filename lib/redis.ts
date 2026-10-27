/**
 * lib/redis.ts
 * Koneksi Upstash Redis
 * Set env: UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN wajib diisi di .env.local"
      );
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

/** Key helpers biar konsisten */
export const keys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email.toLowerCase()}`,
  userByApiKey: (apiKey: string) => `user:apikey:${apiKey}`,
  userQrisList: (userId: string) => `user:${userId}:qris`,
  qris: (id: string) => `qris:${id}`,
  userOrders: (userId: string) => `user:${userId}:orders`,
  order: (id: string) => `order:${id}`,
  orderByCode: (code: string) => `order:code:${code}`,
};
