/**
 * lib/utils.ts
 * ------------------
 * Fungsi-fungsi kecil yang sering dipakai (format uang, className, dll)
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind dengan aman */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format angka menjadi Rupiah (contoh: 50000 → Rp 50.000) */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tanggal Indonesia */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Hitung sisa waktu (countdown) dalam detik */
export function getRemainingSeconds(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}
