/**
 * POST /api/auth/register
 * Security: rate limiting, validasi input ketat, password strength
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createToken } from '@/lib/auth';
import { rateLimit, LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { checkSuspiciousActivity, logSecurityEvent, sanitizeInput } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // ── 1. Cek IP blocked ────────────────────────────
  const { blocked } = await checkSuspiciousActivity(ip, 'register');
  if (blocked) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak.' },
      { status: 403 }
    );
  }

  // ── 2. Rate limit: 3 per jam per IP ─────────────
  const rl = await rateLimit(`register:${ip}`, LIMITS.REGISTER.limit, LIMITS.REGISTER.windowMs);
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  try {
    const body = await req.json();
    const email    = sanitizeInput(body.email    || '', 200).toLowerCase();
    const name     = sanitizeInput(body.name     || '', 100);
    const password = body.password || '';

    // Validasi input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, dan nama wajib diisi' },
        { status: 400 }
      );
    }
    if (name.length < 2) {
      return NextResponse.json({ success: false, error: 'Nama minimal 2 karakter' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password minimal 8 karakter' }, { status: 400 });
    }
    // Password strength: harus ada huruf + angka
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password harus mengandung huruf dan angka' },
        { status: 400 }
      );
    }

    const user  = await registerUser(email, password, name);
    const token = await createToken(user.id);

    await logSecurityEvent({
      type: 'ANOMALY',
      severity: 'LOW',
      ip,
      details: `Akun baru terdaftar: ${email.slice(0, 3)}***`,
    });

    return NextResponse.json({ success: true, data: { user, token } });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal register' },
      { status: 400 }
    );
  }
}
