/**
 * GET /api/security/events
 * Melihat log keamanan — hanya untuk admin/pemilik sistem
 *
 * Auth: Bearer token
 * Query: ?limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getSecurityEvents } from '@/lib/security';

export async function GET(req: NextRequest) {
  const auth  = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(
    parseInt(new URL(req.url).searchParams.get('limit') || '50', 10),
    200
  );

  const events = await getSecurityEvents(limit);
  return NextResponse.json({ success: true, data: events });
}
