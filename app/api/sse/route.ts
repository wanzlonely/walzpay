/**
 * GET /api/sse?code=ORDER_CODE&token=JWT_TOKEN
 * Server-Sent Events (SSE) untuk notifikasi pembayaran real-time.
 *
 * Alur:
 * 1. Client connect saat order dibuat
 * 2. Server poll Redis setiap 2 detik
 * 3. Saat status berubah ke "paid" → kirim event ke client
 * 4. Client tampilkan notifikasi sukses
 * 5. Koneksi tutup otomatis setelah order selesai atau timeout 6 menit
 */

import { NextRequest } from 'next/server';
import { getOrderByCode } from '@/lib/storage';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const token = searchParams.get('token');

  if (!code || !token) {
    return new Response('Missing code or token', { status: 400 });
  }

  // Verifikasi auth
  const user = await getUserFromToken(token);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Pastikan order milik user ini
  const initialOrder = await getOrderByCode(code);
  if (!initialOrder || initialOrder.userId !== user.id) {
    return new Response('Order not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastStatus = initialOrder.status;

      function send(data: object) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      }

      function close() {
        if (!closed) {
          closed = true;
          try { controller.close(); } catch {}
        }
        clearInterval(pollTimer);
        clearInterval(keepAliveTimer);
        clearTimeout(maxTimeout);
      }

      // Kirim event connected
      send({ type: 'connected', code, status: initialOrder.status });

      // Poll Redis setiap 2 detik
      const pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const order = await getOrderByCode(code);
          if (!order) {
            send({ type: 'error', message: 'Order tidak ditemukan' });
            close();
            return;
          }

          // Kirim update jika status berubah
          if (order.status !== lastStatus) {
            lastStatus = order.status;
            send({
              type: 'status_change',
              data: {
                code:        order.code,
                status:      order.status,
                paidAt:      order.paidAt,
                totalAmount: order.totalAmount,
                merchantName: order.merchantName,
              },
            });

            // Tutup koneksi kalau sudah final
            if (['paid', 'expired', 'cancelled'].includes(order.status)) {
              close();
            }
          } else {
            // Kirim heartbeat dengan sisa waktu
            const remaining = Math.max(
              0,
              Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)
            );
            send({ type: 'heartbeat', remaining, status: order.status });
          }
        } catch {
          // Jangan tutup saat Redis error sementara
        }
      }, 2000);

      // Keep-alive comment setiap 20 detik (mencegah proxy timeout)
      const keepAliveTimer = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          } catch {
            close();
          }
        }
      }, 20000);

      // Timeout 6 menit (order expire 5 menit + 1 menit buffer)
      const maxTimeout = setTimeout(() => {
        send({ type: 'timeout', message: 'Koneksi SSE timeout' });
        close();
      }, 6 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',  // Untuk nginx
    },
  });
}
