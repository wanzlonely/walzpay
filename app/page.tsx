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
    <div className="relative min-h-screen bg-[#f8fafc] font-sans pb-28">
      
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/60 px-4 pb-4 pt-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 font-black text-white shadow-md shadow-indigo-500/20">
              Q
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-gray-900">QRIS Pro</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dashboard Store</p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white/60 text-gray-600 shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-6 px-4 pt-5">
        
        {/* Card Banner Welcome Pill Modern */}
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 p-6 shadow-xl shadow-indigo-500/20 text-white">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-blue-400/20 blur-2xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-bold text-indigo-100 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Selamat Datang kembali
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {user?.name || "TOKO WALZY"}
              </h2>
              <p className="mt-1 text-xs font-medium text-indigo-100/80">
                Kelola transaksi QRIS dinamis toko kamu secara aktual.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Quick Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[1.75rem] border border-white/60 bg-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Diterima</span>
            <p className="mt-1.5 text-xl font-black tracking-tight text-emerald-600">
              {loading ? "..." : formatRupiah(totalOmset)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-gray-400">{paidOrders.length} Transaksi Sukses</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/60 bg-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Menunggu</span>
            <p className="mt-1.5 text-xl font-black tracking-tight text-amber-500">
              {loading ? "..." : `${pendingOrders.length} Order`}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-gray-400">Belum dibayar</p>
          </div>
        </div>

        {/* Action Button Quick Link */}
        <div className="rounded-[2rem] border border-white/60 bg-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Aksi Cepat</p>
          <Link
            href="/qris?tab=generate"
            className="flex items-center justify-between rounded-[1.25rem] bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.01] active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">Generate QRIS Dinamis</p>
                <p className="text-xs text-indigo-100/80">Buat QRIS pembayaran dengan nominal</p>
              </div>
            </div>
            <span className="text-lg">→</span>
          </Link>
        </div>

        {/* Recent Transactions List */}
        <div className="rounded-[2rem] border border-white/60 bg-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Transaksi Terakhir</p>
            <Link href="/transaksi" className="text-xs font-bold text-indigo-600 hover:underline">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-gray-200/50" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-gray-400">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((ord) => (
                <Link
                  key={ord.id}
                  href={`/pay/${ord.code}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/80 p-3.5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                      ord.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                    }`}>
                      {ord.status === "paid" ? "✓" : "⏱"}
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-900">{ord.code}</p>
                      <p className="text-[11px] font-semibold text-gray-400">{formatDate(ord.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-900">{formatRupiah(ord.totalAmount)}</p>
                    <span className={`text-[10px] font-bold ${
                      ord.status === "paid" ? "text-emerald-600" : ord.status === "cancelled" ? "text-gray-400" : "text-amber-500"
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
