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
    <div className="relative min-h-screen w-full bg-[#060913] text-slate-100 pb-36 font-sans overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-gradient-to-b from-teal-500/15 via-blue-600/10 to-transparent rounded-full blur-[140px] animate-float" />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      <header className="relative z-10 mx-auto max-w-lg pt-6 px-4 sm:px-6">
        <div className="flex items-center justify-between p-3.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 p-[1.5px] shadow-md">
              <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center p-1.5 overflow-hidden">
                <img src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono-val">WALZPAY GATEWAY</p>
              <h1 className="text-xs font-bold text-white font-display flex items-center gap-1">
                <span>{user?.name || "Merchant Dashboard"}</span>
                <span>✨</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 sm:px-6 pt-5 animate-smooth">
        <div className="card-squircle rounded-[32px] p-6 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>💸</span>
              <span>Total Omset Sukses</span>
            </span>
            <button 
              onClick={loadData}
              className="h-8 w-8 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-400" : ""}`}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-white font-mono-val tracking-tight">
              {loading ? (
                <span className="inline-block h-9 w-44 animate-pulse rounded-full bg-slate-800" />
              ) : (
                formatRupiah(totalOmset)
              )}
            </h2>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Status Settlement</span>
            <span className="text-[11px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
              🎉 {paidOrders.length} Transaksi Lunas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="card-squircle rounded-[24px] p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono-val">Total Order</span>
              <span className="text-base">📦</span>
            </div>
            <p className="text-xl font-extrabold text-white font-mono-val">{orders.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Keseluruhan transaksi</p>
          </div>

          <div className="card-squircle rounded-[24px] p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono-val">Menunggu</span>
              <span className="text-base">⏳</span>
            </div>
            <p className="text-xl font-extrabold text-amber-400 font-mono-val">{pendingOrders.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Membutuhkan bayar</p>
          </div>
        </div>

        <div className="card-squircle rounded-[24px] p-2 border border-white/10 shadow-lg">
          <Link
            href="/qris?tab=generate"
            className="card-pill-button group relative flex items-center justify-between rounded-[20px] p-4 text-white shadow-xl active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white font-display">Generate QRIS Dinamis</p>
                <p className="text-[11px] text-white/80 font-medium">Buat tagihan instan nominal custom</p>
              </div>
            </div>
            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        </div>

        <div className="card-squircle rounded-[32px] p-5 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono-val flex items-center gap-1.5">
              <span>🧾</span> Transaksi Terakhir
            </h3>
            <Link href="/transaksi" className="text-[11px] font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
              <span>Lihat Semua</span>
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div>
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded-[20px] bg-slate-900/60" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">🍃</span>
                <p className="text-xs font-semibold">Belum ada transaksi saat ini</p>
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
                      className="group flex items-center justify-between rounded-[20px] bg-slate-950/40 border border-white/5 p-3.5 transition-all duration-200 hover:border-teal-500/30 hover:bg-slate-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border ${
                            isPaid
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : isCancelled
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : isExpired
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {isPaid ? "✅" : isCancelled ? "✕" : isExpired ? "⏰" : "⏳"}
                        </div>
                        <div>
                          <p className="font-mono-val text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                            {ord.code}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            {formatDate(ord.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-white font-mono-val">
                          {formatRupiah(ord.totalAmount)}
                        </p>
                        <span
                          className={`inline-block mt-0.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
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
