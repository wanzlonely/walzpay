"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken, getUser, authHeaders, clearSession } from "@/lib/client-auth";
import { parseQris, ISSUER_NAMES } from "@/lib/qris";
import { formatRupiah, getRemainingSeconds, formatDate } from "@/lib/utils";
import type { SavedQris, QrisInfo, Order } from "@/types";
import QRCode from "qrcode";

declare const jsQR: any;

function useJsQR() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).jsQR) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

async function extractQrisFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const result = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (result?.data) resolve(result.data);
      else reject(new Error("QR Code tidak terdeteksi. Coba foto lebih jelas."));
    };
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = url;
  });
}

function QrisInfoRow({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/60 py-3 last:border-0">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {badge ? (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-400">
          {value}
        </span>
      ) : (
        <span className="text-xs font-extrabold text-slate-200">{value}</span>
      )}
    </div>
  );
}

function QrisInfoPanel({ info }: { info: QrisInfo }) {
  const issuerName = ISSUER_NAMES[info.issuer] ?? info.issuer;
  const methodLabel = info.method === "dynamic" ? "Dinamis" : "Statis";
  return (
    <div className="animate-in fade-in overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-xl backdrop-blur-xl duration-300">
      <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-emerald-400">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
        <span className="text-xs font-extrabold text-emerald-400">Informasi QRIS</span>
      </div>
      <div className="px-5">
        <QrisInfoRow label="Merchant" value={info.merchantName} />
        <QrisInfoRow label="Kota" value={info.city} />
        {info.postalCode && <QrisInfoRow label="Kode Pos" value={info.postalCode} />}
        <QrisInfoRow label="Issuer" value={issuerName} />
        <QrisInfoRow label="Metode" value={methodLabel} badge />
        {info.category && <QrisInfoRow label="Kategori" value={info.category} />}
        <QrisInfoRow label="Mata Uang" value="IDR (Rupiah)" />
      </div>
      <div className="bg-slate-950/40 px-5 py-3">
        <p className="text-[11px] font-medium leading-relaxed text-slate-400">
          ✓ QRIS valid · Pembayaran langsung masuk ke rekening merchant di atas
        </p>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; text: string; bg: string; border: string }> = {
  paid: { label: "Lunas ✓", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  expired: { label: "Kadaluarsa", text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  pending: { label: "Menunggu", text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  awaiting_payment: { label: "Menunggu", text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  cancelled: { label: "Dibatalkan", text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

const LS_KEY = "qris_last_order";

function PaymentSuccessOverlay({ order, onClose }: { order: Order; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-in zoom-in-95 rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-2xl duration-300 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <p className="mb-2 text-2xl font-black text-emerald-400">Pembayaran Masuk!</p>
        <p className="mb-2 text-3xl font-black tracking-tight text-slate-100">
          {formatRupiah(order.totalAmount)}
        </p>
        <p className="mb-5 text-sm font-semibold text-slate-400">
          {order.merchantName} · <span className="font-mono text-emerald-400">{order.code}</span>
        </p>
        {order.paidAt && (
          <div className="mb-6 inline-flex rounded-full bg-slate-950/80 border border-slate-800/80 px-4 py-1.5 text-xs font-bold text-slate-400">
            {new Date(order.paidAt).toLocaleString("id-ID", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            })}
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

function GenerateTab({ list, defaultQrisId }: { list: SavedQris[]; defaultQrisId: string | null }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedId, setSelectedId] = useState<string>(defaultQrisId || "");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (defaultQrisId && !selectedId) setSelectedId(defaultQrisId);
  }, [defaultQrisId, selectedId]);

  useEffect(() => {
    const savedCode = localStorage.getItem(LS_KEY);
    if (!savedCode) {
      setRestoring(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/orders/${savedCode}`);
        const json = await res.json();
        if (!json.success) {
          localStorage.removeItem(LS_KEY);
          setRestoring(false);
          return;
        }

        const saved: Order = json.data;
        const terminalStatuses = ["expired", "cancelled"];
        const rem = getRemainingSeconds(saved.expiresAt);

        if (saved.status === "paid" || (!terminalStatuses.includes(saved.status) && rem > 0)) {
          const url = await QRCode.toDataURL(saved.qrisString, {
            width: 260, margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
          setQrDataUrl(url);
          setOrder(saved);
          setRemaining(rem > 0 ? rem : 0);
        } else {
          localStorage.removeItem(LS_KEY);
        }
      } catch {
        localStorage.removeItem(LS_KEY);
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!order || ["paid", "expired", "cancelled"].includes(order.status)) return;
    const t = setInterval(() => {
      const sec = getRemainingSeconds(order.expiresAt);
      setRemaining(sec);
      if (sec <= 0) {
        setOrder((prev) => (prev ? { ...prev, status: "expired" } : null));
        localStorage.removeItem(LS_KEY);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [order]);

  useEffect(() => {
    if (!order || ["paid", "expired", "cancelled"].includes(order.status)) return;
    const token = getToken();
    if (!token) return;

    let es: EventSource | null = null;
    let fallbackPoll: ReturnType<typeof setInterval> | null = null;

    const onPaid = (updatedOrder: Partial<Order>) => {
      setOrder((prev) => (prev ? { ...prev, ...updatedOrder, status: "paid" } : null));
      setShowSuccess(true);
      localStorage.removeItem(LS_KEY);
    };

    try {
      es = new EventSource(`/api/sse?code=${order.code}&token=${encodeURIComponent(token)}`);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "status_change") {
            if (data.data?.status === "paid") {
              onPaid(data.data);
              es?.close();
            } else if (["expired", "cancelled"].includes(data.data?.status)) {
              setOrder((prev) => (prev ? { ...prev, status: data.data.status } : null));
              localStorage.removeItem(LS_KEY);
              es?.close();
            }
          }
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        fallbackPoll = setInterval(async () => {
          try {
            const res = await fetch(`/api/orders/${order.code}`);
            const json = await res.json();
            if (json.success && json.data.status !== order.status) {
              if (json.data.status === "paid") onPaid(json.data);
              else setOrder(json.data);
            }
          } catch {}
        }, 3000);
      };
    } catch {
      fallbackPoll = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${order.code}`);
          const json = await res.json();
          if (json.success && json.data.status !== order.status) {
            if (json.data.status === "paid") onPaid(json.data);
            else setOrder(json.data);
          }
        } catch {}
      }, 3000);
    }
    return () => {
      es?.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, [order?.code, order?.status]);

  const formatAmt = (v: string) => {
    const n = v.replace(/\D/g, "");
    return n ? parseInt(n).toLocaleString("id-ID") : "";
  };

  const handleGenerate = async () => {
    setError("");
    const num = parseInt(amount.replace(/\D/g, ""), 10);
    if (!num || num < 1000) {
      setError("Nominal minimal Rp 1.000");
      return;
    }
    if (!selectedId) {
      setError("Pilih QRIS terlebih dahulu");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ amount: num, description: desc || undefined, qrisId: selectedId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const newOrder: Order = json.data;

      const url = await QRCode.toDataURL(newOrder.qrisString, {
        width: 260, margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });

      setQrDataUrl(url);
      setOrder(newOrder);
      setRemaining(getRemainingSeconds(newOrder.expiresAt));
      localStorage.setItem(LS_KEY, newOrder.code);
    } catch (e: any) {
      setError(e.message || "Gagal membuat QRIS");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Apakah Anda yakin ingin membatalkan pembayaran ini?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.code}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      }
    } catch {
      setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
    } finally {
      localStorage.removeItem(LS_KEY);
      setCancelling(false);
    }
  };

  const reset = () => {
    setOrder(null);
    setQrDataUrl("");
    setAmount("");
    setDesc("");
    setError("");
    setRemaining(0);
    setShowSuccess(false);
    localStorage.removeItem(LS_KEY);
  };

  const noQris = list.length === 0;
  const st = order ? STATUS_LABEL[order.status] ?? STATUS_LABEL.pending : null;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isActive = order && !["paid", "expired", "cancelled"].includes(order.status);
  const timerPct = order ? Math.min(100, (remaining / 300) * 100) : 0;

  if (restoring) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent shadow-lg shadow-emerald-500/20" />
      </div>
    );
  }

  if (noQris) {
    return (
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 px-6 py-16 text-center shadow-xl backdrop-blur-2xl ring-1 ring-white/10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 3l8.22 14H3.78L12 5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
          </svg>
        </div>
        <p className="text-lg font-extrabold text-slate-100">Belum ada QRIS</p>
        <p className="mt-2 text-sm font-medium text-slate-400">
          Upload QRIS statis di tab <strong className="text-emerald-400">QRIS Saya</strong> terlebih dahulu.
        </p>
      </div>
    );
  }

  if (order) {
    return (
      <>
        {showSuccess && order.status === "paid" && (
          <PaymentSuccessOverlay order={order} onClose={() => setShowSuccess(false)} />
        )}
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
          <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 shadow-xl backdrop-blur-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 px-6 py-4">
              <span className="max-w-[60%] truncate text-sm font-extrabold text-slate-200">{order.merchantName}</span>
              {st && (
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold ${st.bg} ${st.text} ${st.border}`}>
                  {st.label}
                </span>
              )}
            </div>

            <div className="px-6 pb-2 pt-6 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Bayar</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">{formatRupiah(order.totalAmount)}</p>
              <p className="mt-1 font-mono text-xs font-bold text-slate-400">{order.code}</p>
            </div>

            {order.status !== "paid" && order.status !== "cancelled" && qrDataUrl && (
              <div className="flex flex-col items-center gap-4 px-6 py-6">
                <div className="group relative rounded-2xl bg-white p-4 shadow-2xl ring-4 ring-emerald-500/20 transition-all duration-300 hover:scale-[1.02]">
                  <img src={qrDataUrl} alt="QRIS" width={220} height={220} className="block rounded-lg" />
                  {isActive && (
                    <div className="absolute -right-2 -top-2">
                      <span className="relative flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-400">
                  Scan dengan DANA · ShopeePay · GoPay · OVO · semua bank
                </p>
              </div>
            )}

            {isActive && remaining > 0 && (
              <div className="px-6 pb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Sisa Waktu</span>
                  <span className={`font-mono text-sm font-extrabold ${remaining <= 60 ? "text-rose-400" : "text-emerald-400"}`}>
                    {mins}:{secs.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/80 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${timerPct > 40 ? "bg-emerald-400" : timerPct > 20 ? "bg-amber-400" : "bg-rose-400"}`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
                <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
                  Memantau pembayaran secara otomatis...
                </p>
              </div>
            )}

            {order.status === "paid" && (
              <div className="mx-6 mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-5 text-center shadow-inner">
                <p className="text-base font-extrabold text-emerald-400">Pembayaran Berhasil!</p>
              </div>
            )}

            {order.status === "expired" && (
              <div className="mx-6 mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-center">
                <p className="text-sm font-extrabold text-rose-400">QR sudah kadaluarsa · 5 menit telah berlalu</p>
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="mx-6 mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-4 text-center">
                <p className="text-sm font-extrabold text-slate-400">Transaksi Dibatalkan</p>
              </div>
            )}
          </div>

          {isActive && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3.5 text-xs font-extrabold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {cancelling ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-rose-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  <span>Membatalkan...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Batalkan Pembayaran</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 py-3.5 text-sm font-extrabold text-slate-200 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-800 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Buat QRIS Baru
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 duration-500">
      <div>
        <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
          QRIS Yang Digunakan
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3.5 text-sm font-extrabold text-slate-100 shadow-inner backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/80 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 hover:border-slate-700/80"
        >
          {list.map((q) => (
            <option key={q.id} value={q.id} className="bg-slate-900 text-slate-100">
              {q.merchantName} — {ISSUER_NAMES[q.issuer] ?? q.issuer}{q.isDefault ? " (Default)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Nominal</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatAmt(e.target.value))}
            placeholder="50.000"
            className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/60 py-4 pl-12 pr-4 text-base font-black text-slate-100 shadow-inner backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/80 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 placeholder:font-medium placeholder:text-slate-600 hover:border-slate-700/80"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Keterangan <span className="font-medium text-slate-500">(Opsional)</span>
        </label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Nama pelanggan, order..."
          className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3.5 text-sm font-medium text-slate-100 shadow-inner backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/80 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 placeholder:text-slate-600 hover:border-slate-700/80"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-extrabold text-rose-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !amount}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin text-slate-950" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
            <span>Membuat QRIS...</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="7" height="7" rx="1.5" />
              <rect x="15" y="2" width="7" height="7" rx="1.5" />
              <rect x="2" y="15" width="7" height="7" rx="1.5" />
              <path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2h-2z" />
            </svg>
            <span>Generate QRIS</span>
          </>
        )}
      </button>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="mt-1 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        </div>
        <p className="text-[11px] font-medium leading-relaxed text-emerald-300">
          Setelah QR dibuat, pembayaran <strong className="font-extrabold text-emerald-400">terpantau otomatis</strong>.
          QR berlaku <strong className="font-extrabold text-emerald-400">5 menit</strong> · Dana langsung ke rekening merchant.
        </p>
      </div>
    </div>
  );
}

function QrisPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jsQRReady = useJsQR();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"list" | "generate">(
    searchParams.get("tab") === "generate" ? "generate" : "list"
  );
  const [list, setList] = useState<SavedQris[]>([]);
  const [qrisString, setQrisString] = useState("");
  const [qrisInfo, setQrisInfo] = useState<QrisInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const trimmed = qrisString.trim();
    if (trimmed.startsWith("000201") && trimmed.length > 50) {
      try { setQrisInfo(parseQris(trimmed)); } catch { setQrisInfo(null); }
    } else {
      setQrisInfo(null);
    }
  }, [qrisString]);

  const handle401 = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const load = useCallback(async () => {
    if (!getToken()) { router.replace("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/qris", { headers: authHeaders() });
      if (res.status === 401) { handle401(); return; }
      const json = await res.json();
      if (json.success) setList(json.data || []);
    } finally {
      setLoading(false);
    }
  }, [router, handle401]);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    load();
  }, [router, load]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setDetectMsg("File harus berupa gambar (JPG/PNG/WebP)"); return; }
    if (!jsQRReady) { setDetectMsg("Library QR belum siap, tunggu sebentar..."); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setQrisString("");
    setDetectMsg(null);
    setDetecting(true);
    try {
      const str = await extractQrisFromImage(file);
      if (!str.startsWith("000201")) {
        setDetectMsg("QR terdeteksi tapi bukan format QRIS. Pastikan upload gambar QRIS yang valid.");
        setQrisString(str);
      } else {
        setQrisString(str);
        setDetectMsg("✓ QRIS berhasil dideteksi! Periksa dan simpan.");
      }
    } catch (e: any) {
      setDetectMsg(e.message);
    } finally {
      setDetecting(false);
    }
  }, [jsQRReady]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async () => {
    if (!qrisString.trim()) { setError("String QRIS kosong"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/qris", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          qrisString: qrisString.trim(),
          label: qrisInfo?.merchantName || "",
          isDefault: list.length === 0,
        }),
      });
      if (res.status === 401) { handle401(); return; }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setQrisString("");
      setQrisInfo(null);
      setPreviewUrl(null);
      setDetectMsg(null);
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus QRIS ini?")) return;
    const res = await fetch(`/api/qris?id=${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.status === 401) { handle401(); return; }
    load();
  };

  const handleSetDefault = async (id: string) => {
    const res = await fetch("/api/qris", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "setDefault", id }),
    });
    if (res.status === 401) { handle401(); return; }
    load();
  };

  const issuerColor: Record<string, string> = {
    "ID.DANA.WWW": "text-sky-400 bg-sky-500/10 border-sky-500/30",
    "ID.CO.SHOPEE.WWW": "text-orange-400 bg-orange-500/10 border-orange-500/30",
    "COM.GO-JEK.WWW": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "ID.CO.QRIS.WWW": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    "ID.CO.OVO.WWW": "text-violet-400 bg-violet-500/10 border-violet-500/30",
    "ID.CO.LINKAJA.WWW": "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };

  const defaultQrisId = list.find((q) => q.isDefault)?.id ?? list[0]?.id ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060812] font-sans pb-28 selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="pointer-events-none absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 px-4 pb-4 pt-8 backdrop-blur-2xl">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-100">QRIS</h1>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {activeTab === "list" ? "Upload & kelola QRIS statis kamu" : "Generate QRIS dinamis dengan nominal"}
              </p>
            </div>
            {activeTab === "list" && (
              <button
                onClick={() => { setShowForm(!showForm); setError(""); setDetectMsg(null); setQrisInfo(null); }}
                className={`rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all duration-300 active:scale-95 ${
                  showForm 
                  ? "bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800" 
                  : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                }`}
              >
                {showForm ? "✕ Batal" : "+ Upload QRIS"}
              </button>
            )}
          </div>

          <div className="flex gap-1.5 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-1.5 shadow-lg backdrop-blur-2xl">
            {(["list", "generate"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-extrabold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {tab === "list" ? "QRIS Saya" : "Generate"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-5 px-4 pt-6">
        {activeTab === "generate" && <GenerateTab list={list} defaultQrisId={defaultQrisId} />}

        {activeTab === "list" && (
          <>
            {showForm && (
              <div className="animate-in fade-in slide-in-from-top-4 space-y-6 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 duration-500">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Upload Gambar QRIS</h3>
                <div
                  ref={dropRef}
                  className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
                    dragging ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60"
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-xl">
                        <img src={previewUrl} alt="preview" className="h-28 w-28 rounded-lg object-contain" />
                        {detecting && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                            <svg className="h-8 w-8 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-extrabold text-emerald-400">Klik untuk ganti gambar</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-extrabold text-slate-200">
                        {dragging ? "Lepas gambar di sini" : "Drag & drop gambar QRIS"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">atau klik untuk pilih file</p>
                    </>
                  )}
                </div>

                {detectMsg && (
                  <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
                    detectMsg.startsWith("✓") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}>
                    {detectMsg}
                  </div>
                )}

                {qrisInfo && <QrisInfoPanel info={qrisInfo} />}

                {qrisString && (
                  <div>
                    <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">String QRIS Terdeteksi</label>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner">
                      <p className="break-all font-mono text-[10px] leading-relaxed text-emerald-400">
                        {qrisString.slice(0, 120)}{qrisString.length > 120 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Edit Manual
                  </label>
                  <textarea
                    value={qrisString}
                    onChange={(e) => setQrisString(e.target.value)}
                    rows={3}
                    placeholder="String otomatis muncul, atau paste manual..."
                    className="w-full resize-none rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-4 font-mono text-xs text-slate-200 shadow-inner backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/80 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 hover:border-slate-700/80 placeholder:text-slate-600"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-extrabold text-rose-400">
                    {error}
                  </div>
                )}

                <button onClick={handleSave} disabled={saving || !qrisString.trim()}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60">
                  {saving ? "Menyimpan..." : "Simpan QRIS"}
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-slate-900/40 border border-slate-800/50" />)}
              </div>
            ) : list.length === 0 && !showForm ? (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 px-6 py-16 text-center shadow-xl backdrop-blur-2xl ring-1 ring-white/10">
                <p className="text-lg font-extrabold text-slate-100">Belum ada QRIS</p>
                <button onClick={() => setShowForm(true)}
                  className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-8 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95">
                  Upload QRIS Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {list.map((item) => {
                  const theme = issuerColor[item.issuer] ?? "text-slate-400 bg-slate-500/10 border-slate-500/30";
                  const name = ISSUER_NAMES[item.issuer] ?? item.issuer;
                  return (
                    <div key={item.id} className="group rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-300 hover:border-slate-700">
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${theme}`}>
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-black text-slate-100">{item.merchantName}</p>
                              {item.isDefault && (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-400">{name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {!item.isDefault && (
                          <button onClick={() => handleSetDefault(item.id)}
                            className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-extrabold text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95">
                            Jadikan Default
                          </button>
                        )}
                        <button onClick={() => handleDelete(item.id)}
                          className="flex-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-extrabold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-95">
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function QrisPage() {
  return (
    <Suspense fallback={null}>
      <QrisPageInner />
    </Suspense>
  );
}
