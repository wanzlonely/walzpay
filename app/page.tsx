"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, getUser, authHeaders, clearSession } from "@/lib/client-auth";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { User, Order } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const handle401 = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    if (!getToken()) { router.replace("/login"); return; }
    setLoading(true);
    try {
      const [uRes, oRes] = await Promise.all([
        fetch("/api/auth/me", { headers: authHeaders() }),
        fetch("/api/orders", { headers: authHeaders() }),
      ]);
      if (uRes.status === 401 || oRes.status === 401) { handle401(); return; }
      const uJson = await uRes.json();
      const oJson = await oRes.json();
      if (uJson.success) setUser(uJson.data);
      if (oJson.success) setOrders(oJson.data || []);
    } finally { setLoading(false); }
  }, [router, handle401]);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    loadData();
  }, [router, loadData]);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const pendingOrders = orders.filter((o) => ["pending", "awaiting_payment", "awaiting_confirmation"].includes(o.status));
  const totalOmset = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-slate-100 pb-36 font-sans overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 -left-20 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <header className="relative z-10 mx-auto max-w-xl pt-6 px-4 sm:px-6">
        <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full rounded-[15px] bg-slate-950 flex items-center justify-center p-2">
                <img src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">WALZPAY GATEWAY</p>
              <h1 className="text-sm font-extrabold text-white tracking-tight">
                {user?.name || "Merchant Dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            System Live
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-xl space-y-5 px-4 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 border border-white/10 p-6 sm:p-7 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-12 -right-12 h-40 w-40 bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cyan-400">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Total Omset Sukses
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {paidOrders.length} Transaksi Lunas
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              {loading ? (
                <span className="inline-block h-9 w-44 animate-pulse rounded-xl bg-slate-800" />
              ) : (
                formatRupiah(totalOmset)
              )}
            </h2>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Pembaruan realtime</span>
            <button onClick={loadData} className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="rounded-2xl bg-slate-900/50 border border-white/10 p-4 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Total Order</span>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-500">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <p className="text-xl font-black text-white font-mono">{orders.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Keseluruhan riwayat</p>
          </div>

          <div className="rounded-2xl bg-slate-900/50 border border-white/10 p-4 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Menunggu</span>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-amber-500">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <p className="text-xl font-black text-amber-400 font-mono">{pendingOrders.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Membutuhkan pembayaran</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/50 border border-white/10 p-2 backdrop-blur-xl shadow-lg">
          <Link
            href="/qris?tab=generate"
            className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-4 text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-white tracking-wide">Generate QRIS Dinamis</p>
                <p className="text-[11px] text-white/80 font-medium">Buat tagihan instan nominal custom</p>
              </div>
            </div>
            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        </div>

        <div className="rounded-3xl bg-slate-900/50 border border-white/10 p-5 backdrop-blur-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Transaksi Terakhir
            </h3>
            <Link href="/transaksi" className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              <span>Lihat Semua</span>
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-slate-950/50 border border-slate-800" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1.8" />
                    <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-400">Belum ada transaksi saat ini</p>
                <p className="text-[10px] text-slate-500">Transaksi baru akan otomatis muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 5).map((ord) => {
                  const isPaid = ord.status === "paid";
                  const isCancelled = ord.status === "cancelled";
                  const isExpired = ord.status === "expired";

                  return (
                    <Link
                      key={ord.id}
                      href={`/pay/${ord.code}`}
                      className="group flex items-center justify-between rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold border transition-colors ${
                            isPaid
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : isCancelled
                              ? "bg-slate-800/80 border-slate-700 text-slate-400"
                              : isExpired
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {isPaid ? (
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                              <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isCancelled || isExpired ? (
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {ord.code}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            {formatDate(ord.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-extrabold text-white font-mono">
                          {formatRupiah(ord.totalAmount)}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isPaid
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : isCancelled
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : isExpired
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}
                        >
                          {isPaid ? "Lunas" : isCancelled ? "Batal" : isExpired ? "Expired" : "Menunggu"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
