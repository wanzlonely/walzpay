import { NextRequest, NextResponse } from 'next/server';
import { getOrderByCode, updateOrderStatus } from '@/lib/storage';
import { getUserFromToken } from '@/lib/auth';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`order_get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl);

  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const auth  = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  const user  = token ? await getUserFromToken(token) : null;
  const isOwner = user && user.id === order.userId;

  const isActiveOrder = !['paid', 'expired', 'cancelled'].includes(order.status);

  return NextResponse.json({
    success: true,
    data: {
      id:           order.id,
      code:         order.code,
      amount:       order.amount,
      feeAmount:    order.feeAmount,
      totalAmount:  order.totalAmount,
      description:  order.description,
      status:       order.status,
      merchantName: order.merchantName,
      createdAt:    order.createdAt,
      expiresAt:    order.expiresAt,
      paidAt:       order.paidAt,
      ...(isOwner || isActiveOrder ? { qrisString: order.qrisString } : {}),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`order_patch:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl);

  const { code } = await params;
  const body = await req.json();
  const { status } = body;

  if (!['paid', 'cancelled', 'expired'].includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const order = await getOrderByCode(code);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  if (['paid', 'expired', 'cancelled'].includes(order.status)) {
    return NextResponse.json({ success: false, error: 'Order sudah final' }, { status: 400 });
  }

  const updated = await updateOrderStatus(code, status, {
    ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}),
  });

  return NextResponse.json({ success: true, data: updated });
}
