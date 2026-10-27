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
  awaiting_payment: { label: "Menunggu", text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  pending: { label: "Pending", text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  cancelled: { label: "Batal", text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "paid", label: "Lunas" },
  { key: "awaiting_payment", label: "Menunggu" },
  { key: "expired", label: "Expired" },
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
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    load();
  }, [router, load]);

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.code.toLowerCase().includes(q) ||
      (o.description || "").toLowerCase().includes(q) ||
      formatRupiah(o.totalAmount).includes(q);
    return matchFilter && matchSearch;
  });

  const totalPaid = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.totalAmount, 0);
  const totalPending = orders.filter((o) => ["awaiting_payment", "awaiting_confirmation", "pending"].includes(o.status)).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060812] font-sans pb-28 selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="pointer-events-none absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 px-4 pb-4 pt-8 backdrop-blur-2xl">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Transaksi</h1>
            <button
              onClick={load}
              className="group flex items-center gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-2 text-xs font-bold text-slate-300 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:rotate-180">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="relative mb-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, keterangan..."
              className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-medium text-slate-100 shadow-inner backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/80 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 placeholder:text-slate-500 hover:border-slate-700/80"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition-all duration-300 ${
                  filter === f.key
                    ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-5 px-4 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-lg backdrop-blur-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/80 mb-1">Total Diterima</p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{formatRupiah(totalPaid)}</p>
          </div>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-lg backdrop-blur-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400/80 mb-1">Pending</p>
            <p className="text-xl font-black text-amber-400">{totalPending} Order</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-3xl bg-slate-900/40 border border-slate-800/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 px-6 py-16 text-center shadow-xl backdrop-blur-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-200">
              {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada transaksi"}
            </p>
            {!search && (
              <Link href="/qris?tab=generate" className="mt-3 inline-block text-xs font-extrabold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                Generate QRIS pertama →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
              return (
                <Link
                  key={order.id}
                  href={`/pay/${order.code}`}
                  className="group flex items-center gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-slate-700 hover:bg-slate-800/60"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${s.bg} ${s.border}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.text}>
                      {order.status === "paid" ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : order.status === "expired" || order.status === "cancelled" ? (
                        <>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </>
                      ) : (
                        <>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </>
                      )}
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-emerald-400">{order.code}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${s.bg} ${s.text} ${s.border}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="truncate text-xs font-semibold text-slate-300">
                      {order.description || order.merchantName || "—"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-slate-100">{formatRupiah(order.totalAmount)}</p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto mt-1 text-slate-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-300">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
