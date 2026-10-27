/**
 * lib/security.ts
 * Keamanan inti payment gateway:
 * - HMAC signature verification untuk webhook
 * - Deteksi perilaku mencurigakan (brute force, anomaly)
 * - IP blocking otomatis
 * - Security event logging
 */

import { getRedis } from './redis';
import type { SecurityEvent } from '@/types';

// ──────────────────────────────────────────────
// HMAC Webhook Signature Verification
// ──────────────────────────────────────────────

/**
 * Verifikasi signature webhook menggunakan HMAC-SHA256.
 * Webhook sender harus menyertakan header X-Webhook-Signature: sha256=<hash>
 * Hash dihitung dari: HMAC-SHA256(secret, rawBody)
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const buf = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expected =
      'sha256=' +
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return timingSafeEqual(signature, expected);
  } catch {
    return false;
  }
}

/** Constant-time string comparison (prevent timing attacks) */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ──────────────────────────────────────────────
// Security Event Logging
// ──────────────────────────────────────────────

export async function logSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const redis = getRedis();
    const fullEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const pipe = redis.pipeline();
    // Simpan di list global (max 2000 events)
    pipe.lpush('security:events', JSON.stringify(fullEvent));
    pipe.ltrim('security:events', 0, 1999);
    pipe.expire('security:events', 30 * 24 * 60 * 60); // 30 hari

    // Simpan per IP untuk quick lookup
    if (event.ip) {
      pipe.lpush(`security:ip:${event.ip}`, JSON.stringify(fullEvent));
      pipe.ltrim(`security:ip:${event.ip}`, 0, 49);
      pipe.expire(`security:ip:${event.ip}`, 7 * 24 * 60 * 60);
    }

    await pipe.exec();
  } catch {
    // Silent fail — jangan sampai security logging merusak payment flow
  }
}

export async function getSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
  try {
    const redis = getRedis();
    const raw = await redis.lrange('security:events', 0, limit - 1);
    return (raw as string[])
      .map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean) as SecurityEvent[];
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Failed Login / Brute Force Tracking
// ──────────────────────────────────────────────

export async function trackFailedLogin(ip: string, email?: string): Promise<number> {
  try {
    const redis = getRedis();
    const key = `security:failed_login:${ip}`;
    const pipe = redis.pipeline();
    pipe.incr(key);
    pipe.expire(key, 60 * 60); // 1 jam
    const results = await pipe.exec();
    const count = (results[0] as number) || 1;

    // Log kalau sudah >= 5 percobaan
    if (count >= 5) {
      await logSecurityEvent({
        type: 'BRUTE_FORCE',
        severity: count >= 10 ? 'CRITICAL' : 'HIGH',
        ip,
        details: `${count} kali gagal login${email ? ` untuk email: ${email}` : ''}`,
        metadata: { email, count },
      });
    }

    // Auto-block IP setelah 20 percobaan gagal
    if (count >= 20) {
      await blockIp(ip, 24 * 60 * 60 * 1000); // Block 24 jam
    }

    return count;
  } catch {
    return 0;
  }
}

export async function clearFailedLogins(ip: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`security:failed_login:${ip}`);
  } catch {}
}

export async function getFailedLoginCount(ip: string): Promise<number> {
  try {
    const redis = getRedis();
    return (await redis.get<number>(`security:failed_login:${ip}`)) || 0;
  } catch {
    return 0;
  }
}

// ──────────────────────────────────────────────
// IP Blocking
// ──────────────────────────────────────────────

export async function blockIp(ip: string, durationMs = 60 * 60 * 1000): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(`security:blocked_ip:${ip}`, '1', { px: durationMs });
    await logSecurityEvent({
      type: 'IP_BLOCKED',
      severity: 'HIGH',
      ip,
      details: `IP diblokir selama ${Math.round(durationMs / 60000)} menit`,
    });
  } catch {}
}

export async function unblockIp(ip: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`security:blocked_ip:${ip}`);
  } catch {}
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const blocked = await redis.get(`security:blocked_ip:${ip}`);
    return !!blocked;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Suspicious Activity Detection
// ──────────────────────────────────────────────

/** Periksa apakah request dari IP ini mencurigakan */
export async function checkSuspiciousActivity(
  ip: string,
  action: string,
  userId?: string
): Promise<{ blocked: boolean; reason?: string }> {
  // 1. Cek IP blocked
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    return { blocked: true, reason: 'IP Anda diblokir karena aktivitas mencurigakan' };
  }

  // 2. Cek failed login count
  const failedLogins = await getFailedLoginCount(ip);
  if (failedLogins >= 15) {
    await blockIp(ip, 24 * 60 * 60 * 1000);
    return { blocked: true, reason: 'Terlalu banyak percobaan login gagal' };
  }

  return { blocked: false };
}

/** Track order creation anomali (terlalu banyak order dalam waktu singkat) */
export async function trackOrderCreation(userId: string, amount: number): Promise<void> {
  try {
    const redis = getRedis();
    const key = `security:orders:${userId}:${new Date().toISOString().slice(0, 13)}`; // per jam
    const count = await redis.incr(key);
    await redis.expire(key, 3600);

    if (count > 100) {
      await logSecurityEvent({
        type: 'ANOMALY',
        severity: 'MEDIUM',
        details: `User ${userId} membuat ${count} order dalam 1 jam`,
        metadata: { userId, count, lastAmount: amount },
      });
    }
  } catch {}
}

/** Validasi apakah amount order wajar */
export function isReasonableAmount(amount: number): boolean {
  return amount >= 100 && amount <= 500_000_000; // Rp 100 s/d Rp 500 juta
}

/** Sanitize string input dari user */
export function sanitizeInput(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/[\x00-\x1f\x7f]/g, ''); // Remove control characters
}
