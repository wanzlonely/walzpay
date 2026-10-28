"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, getUser, authHeaders, clearSession } from "@/lib/client-auth";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { User, Order, SavedQris } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [qrisList, setQrisList] = useState<SavedQris[]>([]);
  const [loading, setLoading] = useState(true);

  const handle401 = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    if (!getToken()) { router.replace("/login"); return; }
    setLoading(true);
    try {
      const [uRes, oRes, qRes] = await Promise.all([
        fetch("/api/auth/me", { headers: authHeaders() }),
        fetch("/api/orders", { headers: authHeaders() }),
        fetch("/api/qris", { headers: authHeaders() }),
      ]);

      if (uRes.status === 401 || oRes.status === 401 || qRes.status === 401) {
        handle401();
        return;
      }

      const uJson = await uRes.json();
      const oJson = await oRes.json();
      const qJson = await qRes.json();

      if (uJson.success) setUser(uJson.data);
      if (oJson.success) setOrders(oJson.data || []);
      if (qJson.success) setQrisList(qJson.data || []);
    } finally {
      setLoading(false);
    }
  }, [router, handle401]);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    loadData();
  }, [router, loadData]);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const pendingOrders = orders.filter((o) => ["pending", "awaiting_payment"].includes(o.status));
  const totalOmset = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] font-sans pb-32 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[450px] w-[450px] rounded-full bg-blue-600/15 blur-[140px] animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[160px]" />

      <div className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/70 px-5 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-cyan-400">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-wider text-slate-100 uppercase">
                  WALZ<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SHOP</span>
                </h1>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">ONLINE</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Dashboard POS Premium</p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="group relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/50 hover:text-cyan-400 active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:rotate-180">
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-6 px-5 pt-6">
        <div className="glass-card glass-card-hover group relative overflow-hidden rounded-3xl p-6 shadow-2xl ring-1 ring-white/10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-125" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-gradient-to-tr from-emerald-500/20 to-transparent blur-3xl" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-400 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Sistem Terkoneksi
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-500">
                {user?.id ? `ID: ${user.id.slice(0, 8)}...` : "Terminal"}
              </span>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">👋 Selamat Datang Kembali</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-blue-400 transition-all duration-300">
                {user?.name || "TOKO WALZY"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400 leading-relaxed">
                Kelola transaksi QRIS dinamis & penerimaan pembayaran kasir toko kamu secara aktual.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card glass-card-hover relative overflow-hidden rounded-3xl p-5 shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:border-emerald-500/40">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Diterima</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm">
                <span className="text-sm">💰</span>
              </div>
            </div>
            <p className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {loading ? "..." : formatRupiah(totalOmset)}
            </p>
            <p className="mt-1 text-[11px] font-extrabold text-slate-400">{paidOrders.length} Transaksi Sukses</p>
          </div>

          <div className="glass-card glass-card-hover relative overflow-hidden rounded-3xl p-5 shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:border-amber-500/40">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Menunggu</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm">
                <span className="text-sm">⏱️</span>
              </div>
            </div>
            <p className="text-xl font-black tracking-tight text-amber-400">
              {loading ? "..." : `${pendingOrders.length} Order`}
            </p>
            <p className="mt-1 text-[11px] font-extrabold text-slate-400">Belum Dibayar</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover relative overflow-hidden rounded-3xl p-6 shadow-2xl ring-1 ring-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Aksi Cepat</p>
            <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">Instant QRIS</span>
          </div>

          <Link
            href="/qris?tab=generate"
            className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 p-4 text-white shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950/80 text-cyan-400 shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <span className="text-lg">📲</span>
              </div>
              <div>
                <p className="text-sm font-black text-white">Generate QRIS Dinamis</p>
                <p className="text-xs font-semibold text-slate-200/80">Buat QRIS pembayaran nominal bebas</p>
              </div>
            </div>
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white font-black transition-transform duration-300 group-hover:translate-x-1">
              →
            </div>
          </Link>
        </div>

        <div className="glass-card glass-card-hover relative overflow-hidden rounded-3xl p-6 shadow-2xl ring-1 ring-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Transaksi Terakhir</p>
            <Link href="/transaksi" className="text-xs font-extrabold text-cyan-400 hover:text-cyan-300 transition-colors hover:underline">
              Lihat Semua →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-slate-950/60 border border-slate-800/50" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-500">
                <span className="text-xl">🧾</span>
              </div>
              <p className="text-xs font-bold text-slate-400">Belum ada transaksi tercatat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((ord) => (
                <Link
                  key={ord.id}
                  href={`/pay/${ord.code}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold border ${
                      ord.status === "paid" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      {ord.status === "paid" ? "✓" : "⏱"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-extrabold text-cyan-400">{ord.code}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{formatDate(ord.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-100">{formatRupiah(ord.totalAmount)}</p>
                    <span className={`text-[10px] font-extrabold ${
                      ord.status === "paid" ? "text-emerald-400" : ord.status === "cancelled" ? "text-slate-500" : "text-amber-400"
                    }`}>
                      {ord.status === "paid" ? "Lunas" : ord.status === "cancelled" ? "Dibatalkan" : "Menunggu"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
