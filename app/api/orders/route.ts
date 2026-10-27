/**
 * GET  /api/orders  → list order user (filter expired)
 * POST /api/orders  → buat order baru (generate QRIS dinamis)
 *
 * Security: auth required, rate limiting, input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import {
  createOrder,
  getUserOrders,
  getDefaultQris,
  getQrisById,
} from '@/lib/storage';
import { convertToDynamic } from '@/lib/qris';
import { rateLimit, LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import {
  trackOrderCreation,
  isReasonableAmount,
  sanitizeInput,
  logSecurityEvent,
} from '@/lib/security';

async function getAuthUser(req: NextRequest) {
  const auth  = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  return getUserFromToken(token);
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const allOrders = await getUserOrders(user.id, 100);
  const now = Date.now();

  // Filter: hapus expired/cancelled order yg sudah > 5 menit
  const filtered = allOrders.filter((o) => {
    if (['paid'].includes(o.status)) return true; // Tetap tampil
    const expiry = new Date(o.expiresAt).getTime();
    return expiry > now; // Hanya tampil order yg belum expired
  });

  return NextResponse.json({ success: true, data: filtered });
}

export async function POST(req: NextRequest) {
  const ip   = getClientIp(req);
  const user = await getAuthUser(req);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 30 order per menit per user
  const rl = await rateLimit(`orders:${user.id}`, LIMITS.ORDERS.limit, LIMITS.ORDERS.windowMs);
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  try {
    const body        = await req.json();
    const { amount, description, qrisId } = body;
    const nominal     = parseInt(String(amount ?? '').replace(/\D/g, ''), 10);
    const desc        = description ? sanitizeInput(description, 200) : undefined;

    if (!nominal || !isReasonableAmount(nominal)) {
      return NextResponse.json(
        { success: false, error: 'Nominal tidak valid (Rp 100 – Rp 500.000.000)' },
        { status: 400 }
      );
    }

    let qris = qrisId ? await getQrisById(qrisId) : await getDefaultQris(user.id);
    if (!qris || qris.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Belum ada QRIS. Upload QRIS statis terlebih dahulu.' },
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
    });

    // Track untuk anomaly detection
    await trackOrderCreation(user.id, nominal);

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    await logSecurityEvent({
      type: 'ANOMALY',
      severity: 'LOW',
      ip,
      userId: (await getAuthUser(req))?.id,
      details: `Error saat buat order: ${err.message}`,
    });
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
