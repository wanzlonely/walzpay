"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatRupiah, getRemainingSeconds, formatDate } from "@/lib/utils";
import type { Order } from "@/types";
import QRCode from "qrcode";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${code}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        if (json.data.qrisString && json.data.status !== "paid") {
          const url = await QRCode.toDataURL(json.data.qrisString, {
            width: 260, margin: 2, color: { dark: "#0f172a", light: "#ffffff" },
          });
          setQrDataUrl(url);
        }
        setRemaining(getRemainingSeconds(json.data.expiresAt));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrder(); }, [code]);

  useEffect(() => {
    if (!order || ["paid", "expired", "cancelled"].includes(order.status)) return;
    const timer = setInterval(() => {
      const sec = getRemainingSeconds(order.expiresAt);
      setRemaining(sec);
      if (sec <= 0) setOrder((prev) => (prev ? { ...prev, status: "expired" } : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.expiresAt, order?.status]);

  const handleCancel = async () => {
    if (!confirm("Batalkan transaksi ini?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      setOrder(json.success ? json.data : (prev => prev ? { ...prev, status: "cancelled" } : null));
    } catch {
      setOrder(prev => prev ? { ...prev, status: "cancelled" } : null);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
        <p className="text-base font-bold text-slate-800">Transaksi Tidak Ditemukan</p>
        <button onClick={() => router.back()} className="mt-4 rounded-xl bg-white px-5 py-2 text-xs font-bold text-slate-600 border border-slate-200">
          ← Kembali
        </button>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isActive = !["paid", "expired", "cancelled"].includes(order.status);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-sm">
        
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm backdrop-blur-md">
          ← Kembali
        </button>

        <div className="overflow-hidden rounded-3xl border border-white bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          
          <div className="text-center border-b border-slate-100 pb-5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Tagihan</span>
            <h1 className="text-3xl font-black text-slate-900 mt-1">{formatRupiah(order.totalAmount)}</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">{order.merchantName}</p>
          </div>

          {order.status === "paid" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-2xl">✓</div>
              <h2 className="text-lg font-bold text-emerald-600">Pembayaran Berhasil</h2>
              <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
          )}

          {isActive && (
            <div className="py-5 space-y-4">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-md">
                    <img src={qrDataUrl} alt="QRIS" width={200} height={200} className="block rounded-lg" />
                  </div>
                ) : (
                  <div className="h-48 w-48 animate-pulse rounded-2xl bg-slate-100" />
                )}
              </div>

              {remaining > 0 && (
                <div className="rounded-2xl bg-slate-50 p-3 text-center border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Sisa Waktu Pembayaran</p>
                  <p className="font-mono text-base font-black text-indigo-600 mt-0.5">{minutes}:{seconds.toString().padStart(2, "0")}</p>
                </div>
              )}
            </div>
          )}

          {/* Detailed Rows */}
          <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-400 font-medium">Kode</span><span className="font-mono font-bold text-slate-800">{order.code}</span></div>
            <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-400 font-medium">Tanggal</span><span className="font-semibold text-slate-700">{formatDate(order.createdAt)}</span></div>
            <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-400 font-medium">Nominal</span><span className="font-semibold text-slate-700">{formatRupiah(order.amount)}</span></div>
            {order.feeAmount > 0 && <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-400 font-medium">Biaya</span><span className="font-semibold text-slate-700">{formatRupiah(order.feeAmount)}</span></div>}
            {order.description && <div className="flex justify-between px-4 py-2.5 text-xs"><span className="text-slate-400 font-medium">Ket</span><span className="font-semibold text-slate-700">{order.description}</span></div>}
          </div>

          {isActive && (
            <button onClick={handleCancel} disabled={cancelling} className="mt-5 w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100">
              {cancelling ? "Membatalkan..." : "Batalkan Pembayaran"}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
