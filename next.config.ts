import type { NextConfig } from "next";

/**
 * Konfigurasi Next.js
 * - output: 'standalone' biar mudah di-deploy ke Vercel
 * - images: izinkan domain eksternal kalau nanti pakai logo merchant
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Uncomment kalau mau deploy sebagai standalone
  // output: "standalone",
};

export default nextConfig;
