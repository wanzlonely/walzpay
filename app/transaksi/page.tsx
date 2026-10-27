"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, authHeaders } from "@/lib/client-auth";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_MAP: Record<string, { label: string; text: string; bg: string; border: string }> = {
  paid: { label: "Lunas", text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200" },
  awaiting_confirmation: { label: "Konfirmasi", text: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  expired: { label: "Expired", text: "text-red-700", bg: "bg-red-100", border: "border-red-200" },
  awaiting_payment: { label: "Menunggu", text: "text-indigo-700", bg: "bg-indigo-100", border: "border-indigo-200" },
  pending: { label: "Pending", text: "text-gray-700", bg: "bg-gray-100", border: "border-gray-200" },
  cancelled: { label: "Batal", text: "text-gray-700", bg: "bg-gray-100", border: "border-gray-200" },
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
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] font-sans pb-28">
      <div className="pointer-events-none absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-indigo-200/30 blur-[80px]"></div>
      <div className="pointer-events-none absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-blue-200/30 blur-[80px]"></div>

      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/60 px-4 pb-4 pt-8 backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900">Transaksi</h1>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, keterangan..."
              className="w-full rounded-[1.25rem] border border-gray-200/80 bg-white/60 py-3 pl-11 pr-4 text-sm font-medium text-gray-800 shadow-inner backdrop-blur-sm transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-400/10 placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${
                  filter === f.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-600"
                    : "bg-white/60 text-gray-500 border border-gray-200/80 hover:bg-white hover:text-gray-700"
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
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/80 mb-1">Total Diterima</p>
            <p className="text-xl font-black text-emerald-700">{formatRupiah(totalPaid)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-5 shadow-sm backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600/80 mb-1">Pending</p>
            <p className="text-xl font-black text-amber-700">{totalPending} Order</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-[1.5rem] bg-gray-200/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-white/60 bg-white/50 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-800">
              {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada transaksi"}
            </p>
            {!search && (
              <Link href="/qris?tab=generate" className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:underline">
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
                  className="flex items-center gap-4 rounded-[1.5rem] border border-white/60 bg-white/50 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] backdrop-blur-md transition-all hover:scale-[1.01] hover:bg-white hover:shadow-md"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${s.bg} ${s.border}`}>
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
                      <span className="font-mono text-xs font-bold text-indigo-600">{order.code}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.bg} ${s.text} ${s.border}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="truncate text-xs font-semibold text-gray-700">
                      {order.description || order.merchantName || "—"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-gray-900">{formatRupiah(order.totalAmount)}</p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto mt-1 text-gray-400">
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
