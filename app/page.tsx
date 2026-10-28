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
      if (uRes.status === 401 || oRes.status === 401 || qRes.status === 401) { handle401(); return; }
      const uJson = await uRes.json();
      const oJson = await oRes.json();
      const qJson = await qRes.json();
      if (uJson.success) setUser(uJson.data);
      if (oJson.success) setOrders(oJson.data || []);
      if (qJson.success) setQrisList(qJson.data || []);
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
    <div className="dashboard-page relative min-h-screen overflow-hidden bg-[#070b14] pb-32 selection:bg-indigo-500/20">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 right-[-15%] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-300/30 via-violet-300/20 to-blue-300/20 blur-[80px] animate-float" />
        <div className="absolute left-[-20%] top-[35%] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/20 blur-[70px] animate-float-delayed" />
      </div>

      <main className="relative z-10 mx-auto max-w-[640px] space-y-5 px-5 pt-6">
        <div className="animate-slideUp">
          <div className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-[1px] shadow-[0_16px_40px_-16px_rgba(79,70,229,0.6)]">
            <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-br from-indigo-600 via-[#4f46e5] to-[#4338ca] px-6 py-6">
              <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-white/15 to-white/5" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-gradient-to-br from-violet-400/20 to-transparent blur-[12px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.12] px-3 py-1.5 backdrop-blur-xl">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </span>
                    <span className="text-[11px] font-bold tracking-wide text-white/90">Live Monitoring</span>
                  </div>
                  <h2 className="mt-4 max-w-[18ch] text-[26px] font-extrabold leading-[0.95] tracking-[-0.03em] text-white">Halo, {user?.name || "TOKO WALZY"} 👋</h2>
                  <p className="mt-3 max-w-[30ch] text-[13px] font-medium leading-relaxed text-slate-600">Pantau semua pembayaran, buat tagihan, dan jaga arus kas tetap bergerak.</p>
                </div>
                <div className="hidden h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 backdrop-blur-xl sm:flex">
                  <div className="h-12 w-12 rounded-[12px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] p-1.5">
                    <div className="grid h-full w-full grid-cols-3 gap-[2px]">
                      <div className="rounded-[2px] bg-slate-900" />
                      <div className="rounded-[2px] bg-slate-900/20" />
                      <div className="rounded-[2px] bg-slate-900" />
                      <div className="rounded-[2px] bg-slate-900/20" />
                      <div className="rounded-[2px] bg-slate-900" />
                      <div className="rounded-[2px] bg-slate-900/60" />
                      <div className="rounded-[2px] bg-slate-900" />
                      <div className="rounded-[2px] bg-slate-900/40" />
                      <div className="rounded-[2px] bg-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="animate-slideUp group relative overflow-hidden rounded-[22px] border border-white bg-white/80 p-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]" style={{ animationDelay: "80ms" }}>
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-100/60 blur-[12px] transition-all duration-500 group-hover:bg-emerald-100" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_6px_16px_rgba(16,185,129,0.3)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700">+ LIVE</span>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Diterima</p>
              <p className="mt-1.5 truncate text-[18px] font-extrabold tracking-[-0.02em] text-slate-900">{loading ? <span className="inline-block h-5 w-24 animate-pulse rounded-full bg-slate-200" /> : formatRupiah(totalOmset)}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{paidOrders.length} transaksi sukses</p>
            </div>
          </div>
          <div className="animate-slideUp group relative overflow-hidden rounded-[22px] border border-white bg-white/80 p-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]" style={{ animationDelay: "140ms" }}>
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-100/70 blur-[12px] transition-all duration-500 group-hover:bg-amber-100" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_6px_16px_rgba(245,158,11,0.3)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-700">PENDING</span>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Menunggu Bayar</p>
              <p className="mt-1.5 text-[18px] font-extrabold tracking-[-0.02em] text-slate-900">{loading ? <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-slate-200" /> : `${pendingOrders.length} Order`}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Perlu tindak lanjut</p>
            </div>
          </div>
        </div>
        <div className="animate-slideUp rounded-[24px] border border-white bg-slate-900/70 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl" style={{ animationDelay: "200ms" }}>
          <div className="mb-2 flex items-center justify-between px-3 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Aksi Cepat</p>
            <div className="h-1 w-8 rounded-full bg-slate-200" />
          </div>
          <Link href="/qris?tab=generate" className="group relative flex items-center justify-between overflow-hidden rounded-[18px] bg-slate-900 p-[1px] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.18)] active:scale-[0.98]">
            <div className="flex w-full items-center justify-between rounded-[17px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 py-4 transition-all duration-300 group-hover:from-indigo-600 group-hover:via-indigo-600 group-hover:to-violet-700">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/10 text-white ring-1 ring-white/10 backdrop-blur-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-indigo-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold tracking-[-0.01em] text-white">Generate QRIS Dinamis</p>
                  <p className="mt-0.5 text-[12px] font-medium text-white/60 group-hover:text-white/80">Nominal custom • Expired otomatis</p>
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-slate-900">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </div>
          </Link>
        </div>
        <div className="animate-slideUp rounded-[26px] border border-white bg-slate-900/75 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)] backdrop-blur-xl" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-1 rounded-full bg-slate-900" />
              <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-slate-900">Transaksi Terakhir</p>
            </div>
            <Link href="/transaksi" className="group flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">Lihat Semua<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5"><path d="M9 18l6-6-6-6" /></svg></Link>
          </div>
          <div className="mt-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative overflow-hidden rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 animate-pulse rounded-[12px] bg-slate-200" />
                      <div className="space-y-2">
                        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    </div>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <p className="mt-4 text-[13px] font-bold text-slate-700">Belum ada transaksi</p>
                <p className="mt-1 max-w-[22ch] text-[12px] font-medium leading-relaxed text-slate-400">Transaksi QRIS kamu akan muncul di sini setelah ada pembayaran.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 5).map((ord, idx) => (
                  <Link key={ord.id} href={`/pay/${ord.code}`} className="group flex items-center justify-between rounded-[18px] border border-slate-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-[1px] hover:border-indigo-200/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:scale-[0.98] animate-slideUp" style={{ animationDelay: `${320 + idx * 60}ms` }}>
<div className="flex items-center gap-3.5">
                      <div className={`relative flex h-11 w-11 items-center justify-center rounded-[13px] text-[13px] font-bold ring-1 transition-all duration-300 ${ord.status === "paid" ? "bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600" : ord.status === "cancelled" ? "bg-slate-50 text-slate-500 ring-slate-200" : ord.status === "expired" ? "bg-rose-50 text-rose-500 ring-rose-100" : "bg-amber-50 text-amber-600 ring-amber-100 group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500"}`}>
                        <span className="dashboard-status-icon relative z-10">{ord.status === "paid" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Lunas"><path d="m5 12 4 4L19 6" /></svg> : ord.status === "cancelled" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-label="Dibatalkan"><path d="M6 6l12 12M18 6 6 18" /></svg> : ord.status === "expired" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Expired"><circle cx="12" cy="12" r="8" /><path d="m12 8 0 4 3 2" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Menunggu"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></svg>}</span>
                      </div>
                      <div>
                        <p className="font-mono text-[12.5px] font-bold tracking-tight text-slate-900">{ord.code}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{formatDate(ord.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-extrabold tracking-tight text-slate-900">{formatRupiah(ord.totalAmount)}</p>
                      <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${ord.status === "paid" ? "bg-emerald-50 text-emerald-700" : ord.status === "cancelled" ? "bg-slate-100 text-slate-600" : ord.status === "expired" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{ord.status === "paid" ? "Lunas" : ord.status === "cancelled" ? "Dibatalkan" : ord.status === "expired" ? "Expired" : "Menunggu"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="h-6" />
      </main>
    </div>
  );
}
