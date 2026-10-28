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
      <div className="payment-page relative flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px] animate-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] animate-float-slow" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent shadow-lg shadow-emerald-500/20" />
          <p className="text-xs font-semibold text-slate-400 animate-pulse">Memuat tagihan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="payment-page relative flex min-h-screen flex-col items-center justify-center bg-[#030712] px-4 text-center">
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="glass-card relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl ring-1 ring-white/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
            </svg>
          </div>
          <p className="text-base font-bold text-slate-100">Transaksi Tidak Ditemukan</p>
          <p className="mt-1 text-xs text-slate-400">Kode transaksi tidak valid atau telah dihapus.</p>
          <button onClick={() => router.back()} className="mt-6 w-full rounded-2xl border border-slate-700/60 bg-slate-800/60 px-5 py-3 text-xs font-extrabold text-slate-200 transition-all hover:bg-slate-800 hover:text-white active:scale-95">
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isActive = !["paid", "expired", "cancelled"].includes(order.status);

  return (
    <div className="payment-page relative flex min-h-screen flex-col items-center justify-center bg-[#030712] px-5 py-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] animate-float-slow" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[140px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="payment-brandbar"><div className="payment-brandmark">W</div><div><strong>WALZPAY</strong><span>SECURE PAYMENT</span></div><div className="payment-lock">✓</div></div>
        <button onClick={() => router.back()} className="group mb-5 inline-flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-2.5 text-xs font-extrabold text-slate-300 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:text-white hover:bg-slate-800/80 active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Kembali
        </button>

        <div className="receipt-card glass-card glass-card-hover relative rounded-3xl p-6 shadow-2xl ring-1 ring-white/10 transition-all duration-300">
          <div className="text-center border-b border-slate-800/60 pb-5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Tagihan</span>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mt-1">
              {formatRupiah(order.totalAmount)}
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">{order.merchantName}</p>
          </div>

          {order.status === "paid" && (
            <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/30">
                  ✓
                </div>
              </div>
              <h2 className="text-lg font-extrabold text-emerald-400">Pembayaran Berhasil</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
          )}

          {isActive && (
            <div className="py-5 space-y-4">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <div className="group relative rounded-2xl bg-white p-4 shadow-2xl ring-4 ring-emerald-500/20 transition-all duration-300 hover:scale-[1.02]">
                    <img src={qrDataUrl} alt="QRIS" width={200} height={200} className="block rounded-lg" />
                  </div>
                ) : (
                  <div className="h-52 w-52 animate-pulse rounded-2xl bg-slate-800/60 border border-slate-700/50" />
                )}
              </div>

              {remaining > 0 && (
                <div className="rounded-2xl bg-slate-950/60 p-3.5 text-center border border-slate-800/80 backdrop-blur-md">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sisa Waktu Pembayaran</p>
                  <p className="font-mono text-lg font-black text-emerald-400 mt-0.5 tracking-wider animate-pulse">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 divide-y divide-slate-800/60 rounded-2xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
            <div className="flex justify-between px-4 py-3 text-xs"><span className="text-slate-400 font-medium">Status</span><span className="font-semibold text-emerald-400">{order.status === "paid" ? "Berhasil" : order.status === "expired" ? "Kadaluarsa" : order.status === "cancelled" ? "Dibatalkan" : "Menunggu pembayaran"}</span></div>
            <div className="flex justify-between px-4 py-3 text-xs"><span className="text-slate-400 font-medium">Kode</span><span className="font-mono font-bold text-slate-200">{order.code}</span></div>
            <div className="flex justify-between px-4 py-3 text-xs"><span className="text-slate-400 font-medium">Tanggal</span><span className="font-semibold text-slate-300">{formatDate(order.createdAt)}</span></div>
            <div className="flex justify-between px-4 py-3 text-xs"><span className="text-slate-400 font-medium">Nominal</span><span className="font-semibold text-slate-200">{formatRupiah(order.amount)}</span></div>
            {order.feeAmount > 0 && <div className="flex justify-between px-4 py-3 text-xs"><span className="text-slate-400 font-medium">Biaya</span><span className="font-semibold text-slate-200">{formatRupiah(order.feeAmount)}</span></div>}
            {order.description && <div className="flex justify-between px-4 py-3 text-xs"><span className="text-slate-400 font-medium">Ket</span><span className="font-semibold text-slate-300">{order.description}</span></div>}
          </div>

          {isActive && (
            <button onClick={handleCancel} disabled={cancelling} className="group relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3.5 text-xs font-extrabold text-rose-400 transition-all duration-300 hover:bg-rose-500/20 hover:border-rose-500/50 active:scale-95 disabled:pointer-events-none disabled:opacity-60">
              {cancelling ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  <span>Membatalkan...</span>
                </>
              ) : (
                <span>Batalkan Pembayaran</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
