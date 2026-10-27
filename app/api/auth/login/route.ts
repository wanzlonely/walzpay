/**
 * POST /api/auth/login
 * Security: rate limiting per IP + brute force detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { rateLimit, LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import {
  trackFailedLogin,
  clearFailedLogins,
  checkSuspiciousActivity,
  logSecurityEvent,
  sanitizeInput,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // ── 1. Cek suspicious activity (IP blocked?) ─────
  const { blocked, reason } = await checkSuspiciousActivity(ip, 'login');
  if (blocked) {
    await logSecurityEvent({
      type: 'UNAUTHORIZED',
      severity: 'HIGH',
      ip,
      details: reason || 'Login dari IP terblokir',
    });
    return NextResponse.json(
      { success: false, error: 'Akses ditolak. Hubungi administrator.' },
      { status: 403 }
    );
  }

  // ── 2. Rate limit: 5 per 15 menit per IP ─────────
  const rl = await rateLimit(`login:${ip}`, LIMITS.LOGIN.limit, LIMITS.LOGIN.windowMs);
  if (!rl.success) {
    await logSecurityEvent({
      type: 'RATE_LIMIT',
      severity: 'MEDIUM',
      ip,
      details: `Rate limit login terlampaui dari IP ${ip}`,
    });
    return rateLimitResponse(rl);
  }

  try {
    const body = await req.json();
    const email    = sanitizeInput(body.email    || '', 200);
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi format email dasar
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    const { user, token } = await loginUser(email, password);

    // Login berhasil → reset failed login counter
    await clearFailedLogins(ip);

    return NextResponse.json({ success: true, data: { user, token } });
  } catch (err: any) {
    // Login gagal → track untuk brute force detection
    const failedCount = await trackFailedLogin(ip, '***'); // Jangan log email asli

    // Error message generic untuk mencegah user enumeration
    const errorMsg =
      failedCount >= 5
        ? `Login gagal (${failedCount}x). Tunggu beberapa saat sebelum mencoba lagi.`
        : 'Email atau password salah';

    return NextResponse.json({ success: false, error: errorMsg }, { status: 401 });
  }
}
