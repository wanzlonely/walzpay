"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, authHeaders } from "@/lib/client-auth";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_MAP: Record<string, { label: string; text: string; bg: string; border: string }> = {
  paid: { label: "Lunas", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  awaiting_confirmation: { label: "Konfirmasi", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  expired: { label: "Expired", text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  awaiting_payment: { label: "Menunggu", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  pending: { label: "Pending", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  cancelled: { label: "Batal", text: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" },
};

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "paid", label: "Lunas" },
  { key: "pending", label: "Menunggu" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Dibatalkan" },
];

export default function TransaksiPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!getToken()) { router.replace("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    load();
    const refreshTimer = window.setInterval(load, 5000);
    return () => window.clearInterval(refreshTimer);
  }, [router, load]);

  const filtered = orders.filter((o) => {
    const pendingStatuses = ["pending", "awaiting_payment", "awaiting_confirmation"];
    const matchFilter = filter === "all" || (filter === "pending" ? pendingStatuses.includes(o.status) : o.status === filter);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.code.toLowerCase().includes(q) ||
      (o.description || "").toLowerCase().includes(q) ||
      formatRupiah(o.totalAmount).includes(q);
    return matchFilter && matchSearch;
  });

  const totalPaid = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="relative min-h-screen w-full bg-[#060913] text-slate-100 pb-36 font-sans overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-gradient-to-b from-teal-500/15 via-blue-600/10 to-transparent rounded-full blur-[140px] animate-float" />
        <div className="absolute top-2/3 -right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#060913]/80 px-4 sm:px-6 pb-4 pt-6 backdrop-blur-2xl">
        <div className="mx-auto max-w-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-white font-display">Riwayat Transaksi</h1>
            </div>
            <button
              onClick={load}
              className="h-8 w-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${loading ? "animate-spin text-teal-400" : ""}`}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau keterangan transaksi..."
              className="w-full soft-input rounded-[20px] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  filter === f.key
                    ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-slate-900/60 border border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 sm:px-6 pt-5 animate-smooth">
        <div className="card-squircle rounded-[28px] p-5 border border-white/10 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono-val flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-teal-400">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Total Akumulasi Lunas
            </span>
            <p className="text-xl font-extrabold text-teal-400 font-mono-val">{formatRupiah(totalPaid)}</p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-slate-900/80 border border-white/10 px-3 py-1 rounded-full">
            {orders.filter(o => o.status === 'paid').length} Transaksi
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-[20px] bg-slate-900/60 border border-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-squircle rounded-[32px] p-10 text-center text-slate-400 space-y-3 border border-white/10">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-300">Tidak ada transaksi ditemukan</p>
            <p className="text-[10px] text-slate-500">Coba ubah kata kunci pencarian atau filter status Anda</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => {
              const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
              const isPaid = order.status === "paid";
              const isCancelled = order.status === "cancelled";
              const isExpired = order.status === "expired";

              return (
                <Link
                  key={order.id}
                  href={`/pay/${order.code}`}
                  className="group card-squircle rounded-[20px] p-4 flex items-center justify-between border border-white/5 transition-all duration-200 hover:border-teal-500/30 hover:bg-slate-900/60 block"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full border flex items-center justify-center font-bold text-xs ${s.bg} ${s.border} ${s.text}`}>
                      {isPaid ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : isCancelled || isExpired ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-val text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                          {order.code}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[170px] mt-0.5 font-medium">
                        {order.description || order.merchantName || "Tagihan QRIS"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-white font-mono-val">{formatRupiah(order.totalAmount)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
