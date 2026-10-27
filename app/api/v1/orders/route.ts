/**
 * Public API v1 – integrasi bot WhatsApp / Telegram / web
 * Auth: Header X-API-Key: qris_xxxxx
 *
 * POST /api/v1/orders  → Buat order baru
 * GET  /api/v1/orders?code=XXXX → Cek status order
 *
 * Security: API key auth, rate limiting, input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromApiKey } from '@/lib/auth';
import {
  createOrder,
  getOrderByCode,
  getDefaultQris,
  getQrisById,
} from '@/lib/storage';
import { convertToDynamic } from '@/lib/qris';
import { rateLimit, LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import {
  checkSuspiciousActivity,
  trackOrderCreation,
  isReasonableAmount,
  sanitizeInput,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || '';
  const ip     = getClientIp(req);

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'X-API-Key required' }, { status: 401 });
  }

  // Cek IP blocked
  const { blocked } = await checkSuspiciousActivity(ip, 'api');
  if (blocked) {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
  }

  // Rate limit per API key
  const rl = await rateLimit(`v1:${apiKey}`, LIMITS.API_KEY.limit, LIMITS.API_KEY.windowMs);
  if (!rl.success) return rateLimitResponse(rl);

  const user = await getUserFromApiKey(apiKey);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 401 });
  }

  try {
    const body    = await req.json();
    const nominal = parseInt(String(body.amount ?? '').replace(/\D/g, ''), 10);

    if (!nominal || !isReasonableAmount(nominal)) {
      return NextResponse.json(
        { success: false, error: 'amount tidak valid (Rp 100 – Rp 500.000.000)' },
        { status: 400 }
      );
    }

    const desc = body.description ? sanitizeInput(body.description, 200) : undefined;
    let qris   = body.qrisId ? await getQrisById(body.qrisId) : await getDefaultQris(user.id);

    if (!qris || qris.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No QRIS configured. Upload static QRIS first.' },
        { status: 400 }
      );
    }

    const dynamic = convertToDynamic(qris.qrisString, { amount: nominal });
    const order   = await createOrder({
      userId:       user.id,
      amount:       dynamic.amount,
      feeAmount:    dynamic.feeAmount,
      totalAmount:  dynamic.totalAmount,
      description:  desc,
      qrisString:   dynamic.qrisString,
      merchantName: dynamic.merchantName,
      expiresAt:    dynamic.expiresAt,
      qrisId:       qris.id,
      externalId:   body.externalId ? sanitizeInput(body.externalId, 100) : undefined,
    });

    await trackOrderCreation(user.id, nominal);

    const host  = req.headers.get('host') || 'localhost:3000';
    const proto = host.includes('localhost') ? 'http' : 'https';

    return NextResponse.json({
      success: true,
      data: {
        id:          order.id,
        code:        order.code,
        amount:      order.totalAmount,
        status:      order.status,
        qrisString:  order.qrisString,
        paymentUrl:  `${proto}://${host}/pay/${order.code}`,
        expiresAt:   order.expiresAt,
        externalId:  order.externalId,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || '';
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'X-API-Key required' }, { status: 401 });
  }

  const rl = await rateLimit(`v1:${apiKey}`, LIMITS.API_KEY.limit, LIMITS.API_KEY.windowMs);
  if (!rl.success) return rateLimitResponse(rl);

  const user = await getUserFromApiKey(apiKey);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 401 });
  }

  const code = new URL(req.url).searchParams.get('code');
  if (!code) {
    return NextResponse.json({ success: false, error: 'code required' }, { status: 400 });
  }

  const order = await getOrderByCode(code);
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id:          order.id,
      code:        order.code,
      amount:      order.totalAmount,
      status:      order.status,
      description: order.description,
      paidAt:      order.paidAt,
      expiresAt:   order.expiresAt,
      externalId:  order.externalId,
    },
  });
}
