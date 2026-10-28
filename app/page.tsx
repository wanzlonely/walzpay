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
    <div className="relative min-h-screen overflow-hidden bg-[#030712] font-sans pb-32 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[140px] animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[160px]" />

      <div className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/70 px-5 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-emerald-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="15" y="2" width="7" height="7" rx="1.5"/>
                  <rect x="2" y="15" width="7" height="7" rx="1.5"/><path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2h-2z"/>
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-slate-100">QRIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pro</span></h1>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/20">v2.0</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Live POS Dashboard</p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="group relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/40 hover:text-emerald-400 active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:rotate-180">
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-6 px-5 pt-6">
        <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-500 hover:border-slate-700/80">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-125" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-gradient-to-tr from-cyan-500/20 to-transparent blur-3xl" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-400 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Sistem Aktif
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-500">
                {user?.id ? `ID: ${user.id.slice(0, 8)}...` : "Terminal"}
              </span>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Selamat Datang Kembali</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all duration-300">
                {user?.name || "TOKO WALZY"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400 leading-relaxed">
                Pantau performa penjualan dan kasir QRIS dinamis toko kamu secara real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/80 hover:-translate-y-1">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Diterima</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {loading ? "..." : formatRupiah(totalOmset)}
            </p>
            <p className="mt-1 text-[11px] font-extrabold text-slate-400">{paidOrders.length} Transaksi Sukses</p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-300 hover:border-amber-500/40 hover:bg-slate-900/80 hover:-translate-y-1">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Menunggu</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black tracking-tight text-amber-400">
              {loading ? "..." : `${pendingOrders.length} Order`}
            </p>
            <p className="mt-1 text-[11px] font-extrabold text-slate-400">Belum Dibayar</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Aksi Cepat</p>
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Instant Pay</span>
          </div>

          <Link
            href="/qris?tab=generate"
            className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 p-4 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/35 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950/90 text-emerald-400 shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Generate QRIS Dinamis</p>
                <p className="text-xs font-bold text-slate-800/80">Buat QRIS pembayaran dengan nominal</p>
              </div>
            </div>
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/10 text-slate-950 font-black transition-transform duration-300 group-hover:translate-x-1">
              →
            </div>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Transaksi Terakhir</p>
            <Link href="/transaksi" className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-400">Belum ada transaksi tercatat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((ord) => (
                <Link
                  key={ord.id}
                  href={`/pay/${ord.code}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold border ${
                      ord.status === "paid" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {ord.status === "paid" ? "✓" : "⏱"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-extrabold text-emerald-400">{ord.code}</p>
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
