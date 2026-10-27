/**
 * middleware.ts
 * Next.js Edge Middleware — berjalan di semua request
 *
 * Fitur:
 * - Security headers (CSP, X-Frame-Options, HSTS, dll)
 * - CORS protection untuk API
 * - Blokir path berbahaya / scanner
 * - Tambahkan request ID untuk tracing
 */

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Match semua routes kecuali static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};

/** Path yang langsung ditolak — biasanya scanner / bot */
const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login.php', '/xmlrpc.php',
  '/.env', '/.git', '/config.php', '/admin.php',
  '/phpinfo', '/phpmyadmin', '/shell.php',
  '/backup', '/db.sql', '/dump.sql',
  '/.well-known/acme-challenge',
];

/** User-Agent patterns yang mencurigakan */
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i,
  /zgrab/i, /python-requests\/2\.[01]/i,
  /go-http-client\/1\.1/i,
];

function addSecurityHeaders(res: NextResponse): NextResponse {
  // Prevent framing (clickjacking)
  res.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // Legacy XSS filter
  res.headers.set('X-XSS-Protection', '1; mode=block');

  // Strict referrer
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — batasi fitur browser
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // HSTS — force HTTPS
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);

  // Remove server info headers
  res.headers.delete('X-Powered-By');
  res.headers.delete('Server');

  return res;
}

function handleCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin') || '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const allowedOrigins = [baseUrl, 'http://localhost:3000', 'http://localhost:3001'];

  if (allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key, X-Webhook-Signature, X-Request-ID'
  );
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get('user-agent') || '';

  // ── 1. Blokir path berbahaya ─────────────────────
  if (BLOCKED_PATHS.some((p) => pathname.startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  // ── 2. Blokir User-Agent scanner ─────────────────
  if (BLOCKED_UA_PATTERNS.some((p) => p.test(ua))) {
    return new NextResponse(null, { status: 403 });
  }

  // ── 3. Handle CORS preflight ─────────────────────
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const res = new NextResponse(null, { status: 204 });
    addSecurityHeaders(res);
    handleCors(req, res);
    return res;
  }

  // ── 4. Lanjutkan request dengan security headers ──
  const res = NextResponse.next();

  // Tambahkan request ID untuk tracing
  const requestId = crypto.randomUUID();
  res.headers.set('X-Request-ID', requestId);

  if (pathname.startsWith('/api/')) {
    handleCors(req, res);
  }

  addSecurityHeaders(res);
  return res;
}
