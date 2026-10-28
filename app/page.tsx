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
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 pb-32 font-sans overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] animate-ambient" />
        <div className="absolute top-2/3 -right-20 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto mt-6 flex max-w-lg items-center justify-between px-4 sm:px-6 animate-entrance">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-2">
            <img src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">WALZPAY GATEWAY</p>
            <h1 className="text-sm font-extrabold text-white heading-font">{user?.name || "Merchant Dashboard"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          Sistem Online
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 sm:px-6 pt-6">
        <div className="glass-card-premium rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-entrance">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Omset Sukses</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-3xl font-black tracking-tight text-white heading-font">
              {loading ? <span className="inline-block h-8 w-36 animate-pulse rounded-lg bg-slate-800" /> : formatRupiah(totalOmset)}
            </h2>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {paidOrders.length} Lunas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="glass-card-interactive rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Transaksi</p>
            <p className="mt-1 text-lg font-black text-white heading-font">{orders.length} Order</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Keseluruhan riwayat</p>
          </div>
          <div className="glass-card-interactive rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Menunggu Bayar</p>
            <p className="mt-1 text-lg font-black text-amber-400 heading-font">{pendingOrders.length} Pending</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Membutuhkan tindakan</p>
          </div>
        </div>

        <div className="glass-card-premium rounded-2xl p-3">
          <Link
            href="/qris?tab=generate"
            className="flex items-center justify-between rounded-xl gradient-button p-4 text-white shadow-xl transition-all duration-300 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Generate QRIS Dinamis</p>
                <p className="text-[11px] text-white/80 font-medium">Buat tagihan instan dengan nominal custom</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>

        <div className="glass-card-premium rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Transaksi Terakhir</h3>
            <Link href="/transaksi" className="text-[11px] font-bold text-sky-400 hover:underline">
              Lihat Semua →
            </Link>
          </div>

          <div>
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-slate-900/60" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-slate-500 space-y-2">
                <p className="text-xs font-semibold">Belum ada transaksi saat ini</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 5).map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/pay/${ord.code}`}
                    className="flex items-center justify-between rounded-2xl glass-card-interactive p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold border ${
                          ord.status === "paid"
                            ? "status-paid-bg status-paid-border status-paid-text"
                            : ord.status === "cancelled"
                            ? "status-cancelled-bg status-cancelled-border status-cancelled-text"
                            : ord.status === "expired"
                            ? "status-expired-bg status-expired-border status-expired-text"
                            : "status-pending-bg status-pending-border status-pending-text"
                        }`}
                      >
                        {ord.status === "paid" ? "✓" : ord.status === "cancelled" ? "✕" : "•"}
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold text-white">{ord.code}</p>
                        <p className="text-[10px] font-medium text-slate-400">{formatDate(ord.createdAt)}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-extrabold text-white">{formatRupiah(ord.totalAmount)}</p>
                      <span
                        className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          ord.status === "paid"
                            ? "status-paid-bg status-paid-border status-paid-text"
                            : ord.status === "cancelled"
                            ? "status-cancelled-bg status-cancelled-border status-cancelled-text"
                            : ord.status === "expired"
                            ? "status-expired-bg status-expired-border status-expired-text"
                            : "status-pending-bg status-pending-border status-pending-text"
                        }`}
                      >
                        {ord.status === "paid" ? "Lunas" : ord.status === "cancelled" ? "Batal" : ord.status === "expired" ? "Expired" : "Menunggu"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
