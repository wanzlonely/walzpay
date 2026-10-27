# QRIS Pro v2 – Multi-User Payment Gateway

Payment gateway berbasis QRIS Dinamis.
Setiap user punya akun, QRIS sendiri, API Key, dan Webhook.

## Fitur

- Multi-user (register / login)
- Upload & simpan QRIS Statis ke Upstash Redis
- Generate Payment Link otomatis
- Bottom tab floating: Menu · Transaksi · QRIS · Profile
- API Key + Public API `/api/v1/orders` (untuk bot WA/Telegram)
- Webhook outbound saat order lunas
- Liquid Glass UI

## Setup

1. Buat database gratis di https://upstash.com (Redis)
2. Copy `.env.example` → `.env.local` lalu isi:

```
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
JWT_SECRET=string-acak-panjang
```

3. Install & jalankan:

```bash
npm install
npm run dev
```

## Struktur Tab

| Tab | Path | Fungsi |
|-----|------|--------|
| Menu | `/` | Buat payment link |
| Transaksi | `/transaksi` | Daftar order |
| QRIS | `/qris` | Upload & kelola QRIS Statis |
| Profile | `/profile` | API Key, Webhook, Logout |

## Public API (integrasi bot)

```
POST /api/v1/orders
Header: X-API-Key: qris_xxxxx
Body: { "amount": 10000, "description": "Order #1" }

GET /api/v1/orders?code=XXXX
Header: X-API-Key: qris_xxxxx
```

## Deploy Vercel

1. Push ke GitHub
2. Import di Vercel
3. Isi Environment Variables (Upstash + JWT_SECRET)
4. Deploy
