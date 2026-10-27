/**
 * POST /api/webhook
 * Menerima notifikasi pembayaran real-time.
 *
 * KEAMANAN:
 * 1. Verifikasi HMAC-SHA256 signature (X-Webhook-Signature header)
 * 2. Rate limiting per IP
 * 3. Validasi payload dengan Zod
 * 4. Log semua upaya webhook yang gagal
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderByCode, updateOrderStatus } from '@/lib/storage';
import { getRedis, keys } from '@/lib/redis';
import { verifyWebhookSignature, logSecurityEvent } from '@/lib/security';
import { rateLimit, LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import type { User } from '@/types';

// Schema validasi payload webhook
const WebhookSchema = z.object({
  event: z.enum(['payment.received', 'payment.confirmed', 'order.paid']),
  orderCode: z.string().min(4).max(20).optional(),
  amount: z.number().positive().optional(),
  paidAt: z.string().datetime().optional(),
  reference: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // ── 1. Rate limiting ──────────────────────────────
  const rl = await rateLimit(`webhook:${ip}`, LIMITS.WEBHOOK.limit, LIMITS.WEBHOOK.windowMs);
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  // ── 2. Baca raw body untuk signature verification ─
  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature') || '';
  const webhookSecret = process.env.WEBHOOK_SECRET || '';

  // ── 3. Verifikasi HMAC signature ─────────────────
  if (webhookSecret) {
    const valid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!valid) {
      await logSecurityEvent({
        type: 'INVALID_SIGNATURE',
        severity: 'HIGH',
        ip,
        details: `Webhook dengan signature tidak valid. Sig: ${signature.slice(0, 20)}...`,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }
  }

  // ── 4. Parse dan validasi payload ────────────────
  let body: z.infer<typeof WebhookSchema>;
  try {
    const parsed = JSON.parse(rawBody);
    const result = WebhookSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Payload tidak valid', details: result.error.issues },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json({ success: false, error: 'JSON tidak valid' }, { status: 400 });
  }

  console.log('[Webhook]', { ip, event: body.event, orderCode: body.orderCode });

  // ── 5. Proses pembayaran ─────────────────────────
  if (!body.orderCode) {
    return NextResponse.json({ success: true, message: 'Event diterima, no order action' });
  }

  const order = await getOrderByCode(body.orderCode);
  if (!order) {
    return NextResponse.json({ success: true, message: 'Order tidak ditemukan, skip' });
  }

  // Sudah final? Skip
  if (['paid', 'expired', 'cancelled'].includes(order.status)) {
    return NextResponse.json({ success: true, message: 'Order sudah final' });
  }

  if (['payment.received', 'payment.confirmed', 'order.paid'].includes(body.event)) {
    const paidAt = body.paidAt || new Date().toISOString();
    const updated = await updateOrderStatus(order.code, 'paid', { paidAt });

    // Forward ke webhook URL user jika ada
    if (updated) {
      try {
        const redis = getRedis();
        const user = await redis.get<User>(keys.user(updated.userId));
        if (user?.webhookUrl) {
          await fetch(user.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'QRIS-Pro-Webhook/1.0',
            },
            body: JSON.stringify({
              event: 'order.paid',
              orderCode: updated.code,
              amount: updated.totalAmount,
              paidAt: updated.paidAt,
              externalId: updated.externalId,
            }),
          }).catch((e) => console.error('Forward webhook failed:', e));
        }
      } catch (e) {
        console.error('Webhook forward error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil diproses',
      data: { orderCode: order.code, status: 'paid' },
    });
  }

  return NextResponse.json({ success: true, message: 'Event diterima' });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint aktif. Gunakan POST dengan payload JSON dan X-Webhook-Signature header.',
    docs: 'Lihat README untuk panduan integrasi.',
  });
}
