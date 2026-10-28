"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, authHeaders } from "@/lib/client-auth";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_MAP: Record<string, { label: string; text: string; bg: string; border: string }> = {
  paid: { label: "Lunas", text: "status-paid-text", bg: "status-paid-bg", border: "status-paid-border" },
  awaiting_confirmation: { label: "Konfirmasi", text: "status-pending-text", bg: "status-pending-bg", border: "status-pending-border" },
  expired: { label: "Expired", text: "status-expired-text", bg: "status-expired-bg", border: "status-expired-border" },
  awaiting_payment: { label: "Menunggu", text: "status-pending-text", bg: "status-pending-bg", border: "status-pending-border" },
  pending: { label: "Pending", text: "status-pending-text", bg: "status-pending-bg", border: "status-pending-border" },
  cancelled: { label: "Batal", text: "status-cancelled-text", bg: "status-cancelled-bg", border: "status-cancelled-border" },
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
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 pb-32 font-sans overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] animate-ambient" />
        <div className="absolute top-2/3 -right-20 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 pb-4 pt-6 backdrop-blur-xl">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white heading-font">Riwayat Transaksi</h1>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95"
            >
              Refresh
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode atau keterangan..."
            className="w-full glass-input-premium rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === f.key
                    ? "gradient-button text-white shadow-lg"
                    : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 sm:px-6 pt-5 animate-entrance">
        <div className="glass-card-premium rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Akumulasi Lunas</p>
            <p className="text-lg font-black text-emerald-400 heading-font">{formatRupiah(totalPaid)}</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{orders.filter(o => o.status === 'paid').length} Transaksi</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-slate-900/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card-premium rounded-3xl p-8 text-center text-slate-400 space-y-3">
            <p className="text-xs font-semibold">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => {
              const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
              return (
                <Link
                  key={order.id}
                  href={`/pay/${order.code}`}
                  className="glass-card-interactive rounded-2xl p-4 flex items-center justify-between block"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-xs ${s.bg} ${s.border} ${s.text}`}>
                      {order.status === "paid" ? "✓" : order.status === "cancelled" ? "✕" : "•"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{order.code}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {order.description || order.merchantName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-white">{formatRupiah(order.totalAmount)}</p>
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
