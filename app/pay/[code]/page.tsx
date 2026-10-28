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
            width: 280, margin: 2, color: { dark: "#020617", light: "#ffffff" },
          });
          setQrDataUrl(url);
        }
        setRemaining(getRemainingSeconds(json.data.expiresAt));
      }
    } catch {
      setOrder(null);
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
    if (!confirm("Batalkan tagihan pembayaran ini?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
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
      <div className="relative min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <p className="text-xs text-slate-400 font-medium">Memuat tagihan pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#020617] p-4 text-center">
        <div className="glass-card-premium rounded-3xl p-6 max-w-xs w-full space-y-4">
          <h2 className="text-base font-bold text-white">Tagihan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400">Kode pembayaran tidak valid atau telah dihapus.</p>
          <button onClick={() => router.back()} className="w-full glass-input-premium rounded-xl py-2.5 text-xs font-bold text-white">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isActive = !["paid", "expired", "cancelled"].includes(order.status);

  return (
    <main className="relative min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] animate-ambient" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-4 animate-entrance">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Kembali
        </button>

        <div className="glass-card-premium rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1 border-b border-slate-800/80 pb-4">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">TOTAL TAGIHAN</span>
            <h1 className="text-3xl font-black text-white heading-font">{formatRupiah(order.totalAmount)}</h1>
            <p className="text-xs font-semibold text-sky-400">{order.merchantName}</p>
          </div>

          {order.status === "paid" && (
            <div className="py-6 text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h2 className="text-base font-bold text-emerald-400">Pembayaran Lunas</h2>
              <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
            </div>
          )}

          {isActive && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-2xl">
                    <img src={qrDataUrl} alt="QRIS" className="h-48 w-48 block rounded-lg" />
                  </div>
                ) : (
                  <div className="h-48 w-48 rounded-2xl bg-slate-800 animate-pulse" />
                )}
              </div>

              {remaining > 0 && (
                <div className="glass-input-premium rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SISA WAKTU</p>
                  <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-xs divide-y divide-slate-800/60 pt-2">
            <div className="flex justify-between py-1.5"><span className="text-slate-400">Status</span><span className="font-bold text-white capitalize">{order.status}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-slate-400">Kode Order</span><span className="font-mono font-bold text-sky-400">{order.code}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-slate-400">Tanggal</span><span className="font-semibold text-slate-300">{formatDate(order.createdAt)}</span></div>
            {order.description && <div className="flex justify-between py-1.5"><span className="text-slate-400">Catatan</span><span className="font-semibold text-slate-300">{order.description}</span></div>}
          </div>

          {isActive && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95"
            >
              {cancelling ? "Membatalkan..." : "Batalkan Pembayaran"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
