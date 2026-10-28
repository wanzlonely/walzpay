# WalzPay – Multi-User QRIS Payment Gateway

**WalzPay** adalah payment gateway berbasis **QRIS Dinamis** yang mendukung multi-user.  
Setiap merchant/user memiliki akun sendiri, QRIS Statis, API Key, Webhook, serta dashboard transaksi yang modern.

> Built with **Next.js 15**, **Upstash Redis**, **JWT**, dan **Tailwind CSS**.

---

## ✨ Fitur Utama

- **Multi-user Authentication**  
  Register & Login dengan email + password (JWT + bcrypt)

- **QRIS Statis Management**  
  Upload, simpan, set default, dan kelola multiple QRIS Statis per user

- **Generate Payment Link**  
  Buat QRIS Dinamis dengan nominal custom + otomatis generate payment page

- **Dashboard Merchant**  
  - Total omset  
  - Statistik order (Lunas / Menunggu / Expired)  
  - Riwayat transaksi terbaru

- **Public API**  
  Endpoint `/api/v1/orders` untuk integrasi bot WhatsApp / Telegram / sistem eksternal

- **Webhook Outbound**  
  Notifikasi otomatis ke URL merchant saat order status berubah (paid / cancelled / expired)

- **Security**  
  - Rate limiting  
  - JWT authentication  
  - API Key protection  
  - HMAC signature untuk webhook

- **Modern UI**  
  Dark mode, liquid glass effect, responsive, floating bottom navigation

---

## 🛠️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 15 (App Router)             |
| Language       | TypeScript                          |
| Styling        | Tailwind CSS                        |
| Database       | Upstash Redis                       |
| Auth           | JWT (`jose`) + bcryptjs             |
| QR Code        | `qrcode` + `jsqr`                   |
| Validation     | Zod                                 |
| Deployment     | Vercel                              |

---

## 📁 Struktur Project

```
walzpay/
├── app/
│   ├── api/
│   │   ├── auth/          # login, register, me
│   │   ├── orders/        # CRUD order
│   │   ├── qris/          # kelola QRIS Statis
│   │   ├── v1/orders/     # Public API
│   │   ├── webhook/       # inbound webhook handler
│   │   └── sse/           # Server-Sent Events
│   ├── login/
│   ├── register/
│   ├── pay/[code]/       # halaman pembayaran publik
│   ├── qris/
│   ├── transaksi/
│   ├── profile/
│   └── page.tsx           # Dashboard utama
├── components/
│   └── BottomNav.tsx
├── lib/
│   ├── auth.ts
│   ├── client-auth.ts
│   ├── qris.ts            # parsing & generate QRIS
│   ├── redis.ts
│   ├── storage.ts         # abstraksi data layer
│   ├── security.ts
│   └── utils.ts
├── types/
└── middleware.ts
```

---

## 🚀 Setup Local

### 1. Clone repository

```bash
git clone https://github.com/wanzlonely/walzpay.git
cd walzpay
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file contoh:

```bash
cp .env.example .env.local
```

Isi nilai berikut di `.env.local`:

```env
# Upstash Redis (wajib)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx

# JWT Secret (minimal 32 karakter)
JWT_SECRET=ganti-dengan-string-acak-panjang-minimal-32-char

# Webhook Secret (untuk verifikasi HMAC)
WEBHOOK_SECRET=ganti-dengan-secret-webhook-acak-panjang

# Base URL aplikasi
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Dapatkan kredensial Redis gratis di [upstash.com](https://upstash.com)

### 4. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📡 Public API

Semua endpoint public membutuhkan header:

```
X-API-Key: qris_xxxxxxxxxxxxxxxx
```

### Buat Order

```http
POST /api/v1/orders
Content-Type: application/json
X-API-Key: qris_xxxxx

{
  "amount": 25000,
  "description": "Pembayaran Order #123"
}
```

**Response contoh:**
```json
{
  "success": true,
  "data": {
    "code": "A1B2C3D4",
    "amount": 25000,
    "totalAmount": 25000,
    "status": "pending",
    "paymentUrl": "https://yourdomain.com/pay/A1B2C3D4",
    "qrisString": "00020101...",
    "expiresAt": "2026-10-28T12:00:00.000Z"
  }
}
```

### Cek Status Order

```http
GET /api/v1/orders?code=A1B2C3D4
X-API-Key: qris_xxxxx
```

---

## 🔔 Webhook

Saat status order berubah menjadi `paid`, `cancelled`, atau `expired`, sistem akan mengirim POST request ke URL webhook yang sudah disetting user.

**Payload contoh:**
```json
{
  "event": "order.paid",
  "data": {
    "code": "A1B2C3D4",
    "amount": 25000,
    "status": "paid",
    "paidAt": "2026-10-28T11:45:00.000Z"
  }
}
```

Request dilindungi dengan signature HMAC-SHA256 di header `X-Webhook-Signature`.

---

## 📱 Navigasi Aplikasi

| Tab        | Path         | Fungsi                              |
|------------|--------------|-------------------------------------|
| Dashboard  | `/`          | Overview omset & transaksi terbaru  |
| Transaksi  | `/transaksi` | Daftar lengkap semua order          |
| QRIS       | `/qris`      | Upload & kelola QRIS Statis         |
| Profile    | `/profile`   | API Key, Webhook URL, Logout        |

Halaman publik pembayaran: `/pay/[code]`

---

## ☁️ Deploy ke Vercel

1. Push project ke GitHub
2. Import repository di [vercel.com](https://vercel.com)
3. Tambahkan Environment Variables yang sama seperti `.env.local`
4. Deploy

Setelah deploy, update `NEXT_PUBLIC_BASE_URL` dengan domain production kamu.

---

## 📄 License

Private project – All rights reserved.

---

Dibuat dengan ❤️ oleh **wanzlonely**
