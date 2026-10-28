"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession, authHeaders, saveSession } from "@/lib/client-auth";

function CopyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-300">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/70 px-4 py-3">
          <p className={`${mono ? "font-mono-val tracking-tight text-teal-400" : "text-slate-200"} truncate text-xs font-semibold`}>
            {value}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={`shrink-0 rounded-[14px] px-4 py-3 text-xs font-bold transition-all flex items-center gap-1.5 ${
            copied
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700"
          }`}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-emerald-400">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Tersalin</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-slate-400">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWh, setSavingWh] = useState(false);
  const [whMsg, setWhMsg] = useState("");
  const [activeSection, setActive] = useState<"account" | "api" | "docs">("account");

  useEffect(() => {
    const u = getUser();
    if (!u || !getToken()) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setWebhookUrl(u.webhookUrl || "");
  }, [router]);

  const saveWebhook = async () => {
    setSavingWh(true);
    setWhMsg("");
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ webhookUrl }),
      });
      const updated = { ...user, webhookUrl };
      saveSession(getToken()!, updated);
      setUser(updated);
      setWhMsg("Webhook tersimpan");
      setTimeout(() => setWhMsg(""), 3000);
    } catch {
      setWhMsg("Gagal menyimpan");
    } finally {
      setSavingWh(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060913]">
        <svg className="h-8 w-8 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#060913] text-slate-100 pb-36 font-sans overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-gradient-to-b from-teal-500/15 via-blue-600/10 to-transparent rounded-full blur-[140px] animate-float" />
        <div className="absolute top-2/3 -right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-5 px-4 sm:px-6 pt-8 animate-smooth">
        <div className="card-squircle rounded-[32px] p-6 border border-white/10 shadow-2xl flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-[24px] bg-slate-950 p-1 border border-white/15 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="https://cdn.phototourl.com/member/2026-10-28-caf129d3-a92e-4789-9273-6d4c8a50e3b8.jpg"
              alt="Avatar Merchant"
              className="h-full w-full object-contain rounded-[18px]"
            />
          </div>
          <div className="overflow-hidden space-y-1">
            <h1 className="text-lg font-extrabold text-white font-display truncate">{user.name}</h1>
            <p className="text-xs font-medium text-slate-400 truncate">{user.email}</p>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[10px] font-mono-val text-teal-400">
              <span>Bergabung:</span>
              <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 rounded-[22px] border border-white/10 bg-slate-900/60 p-1.5 backdrop-blur-2xl shadow-lg">
          {(["account", "api", "docs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-1 rounded-[16px] py-2.5 text-xs font-bold transition-all duration-300 ${
                activeSection === tab
                  ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "account" ? "Akun" : tab === "api" ? "API & Webhook" : "Docs API"}
            </button>
          ))}
        </div>

        {activeSection === "account" && (
          <div className="space-y-4 animate-smooth">
            <div className="card-squircle rounded-[32px] p-6 border border-white/10 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-val flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-teal-400">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Informasi Akun</span>
              </span>

              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-medium">Nama Usaha / Merchant</p>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                </div>
                <div className="h-px w-full bg-white/5" />
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-medium">Email Terdaftar</p>
                  <p className="text-sm font-semibold text-slate-300">{user.email}</p>
                </div>
                <div className="h-px w-full bg-white/5" />
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-medium">ID Merchant Unik</p>
                  <p className="truncate font-mono-val text-xs text-teal-400">{user.id}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
              className="w-full rounded-[24px] border border-rose-500/30 bg-rose-500/10 py-3.5 text-xs font-bold text-rose-400 shadow-sm backdrop-blur-md transition-all hover:bg-rose-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Keluar Sesi Akun</span>
            </button>
          </div>
        )}

        {activeSection === "api" && (
          <div className="space-y-4 animate-smooth">
            <div className="card-squircle rounded-[32px] p-6 border border-white/10 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-val flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-teal-400">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>Autentikasi API</span>
              </span>
              <CopyField label="Kunci API Merchant" value={user.apiKey || "—"} mono />
              <div className="rounded-[20px] border border-teal-500/20 bg-teal-500/10 p-4">
                <p className="text-xs text-teal-200/80 leading-relaxed font-medium">
                  Sertakan header <code className="rounded-md bg-teal-500/20 px-1.5 py-0.5 font-mono-val text-xs font-bold text-teal-300">X-API-Key: &lt;key&gt;</code> untuk setiap permintaan API server-to-server.
                </p>
              </div>
            </div>

            <div className="card-squircle rounded-[32px] p-6 border border-white/10 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-val flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-teal-400">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Webhook Notifikasi</span>
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">URL Endpoint Penerima</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://sistem-anda.com/api/webhook"
                  className="w-full soft-input rounded-[20px] px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                onClick={saveWebhook}
                disabled={savingWh}
                className="w-full card-pill-button rounded-[20px] py-3.5 px-4 text-xs font-bold text-white font-display shadow-lg active:scale-[0.98] disabled:opacity-60"
              >
                <div className="flex items-center justify-center gap-2">
                  {savingWh ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyimpan Webhook...</span>
                    </>
                  ) : (
                    <span>Simpan Konfigurasi Webhook</span>
                  )}
                </div>
              </button>

              {whMsg && (
                <p className={`text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${whMsg.includes("Gagal") ? "text-rose-400" : "text-emerald-400"}`}>
                  <span>{whMsg.includes("Gagal") ? "✕" : "✓"}</span>
                  <span>{whMsg}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {activeSection === "docs" && (
          <div className="space-y-4 animate-smooth">
            <div className="card-squircle rounded-[32px] p-6 border border-white/10 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-val flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-teal-400">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Dokumentasi Integrasi API</span>
              </span>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/80">
                  <div className="flex items-center gap-2.5 border-b border-white/5 bg-slate-900/60 px-4 py-3">
                    <span className="rounded-md bg-blue-500/20 px-2 py-0.5 font-mono-val text-[10px] font-extrabold text-blue-400 border border-blue-500/30">POST</span>
                    <span className="font-mono-val text-xs font-bold text-slate-200">/api/v1/orders</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Buat transaksi QRIS dinamis baru</p>
                    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono-val text-[11px] leading-relaxed text-teal-300 border border-white/5">
                      {`// Payload Request JSON
{ "amount": 50000, "description": "Order #123" }

// Response Sukses
{
  "code": "WALZ-88912",
  "qrisString": "00020101021226680016ID...",
  "totalAmount": 50000
}`}
                    </pre>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/80">
                  <div className="flex items-center gap-2.5 border-b border-white/5 bg-slate-900/60 px-4 py-3">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono-val text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">GET</span>
                    <span className="font-mono-val text-xs font-bold text-slate-200">/api/v1/orders/:code</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Periksa status pembayaran spesifik</p>
                    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono-val text-[11px] leading-relaxed text-emerald-300 border border-white/5">
                      {`// Response Sukses Status
{
  "status": "paid",
  "paidAt": "2026-10-28T10:30:00Z",
  "totalAmount": 50000
}`}
                    </pre>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/80">
                  <div className="flex items-center gap-2.5 border-b border-white/5 bg-slate-900/60 px-4 py-3">
                    <span className="rounded-md bg-purple-500/20 px-2 py-0.5 font-mono-val text-[10px] font-extrabold text-purple-400 border border-purple-500/30">WEBHOOK</span>
                    <span className="font-mono-val text-xs font-bold text-slate-200">Structure Event Body</span>
                  </div>
                  <div className="p-4">
                    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono-val text-[11px] leading-relaxed text-purple-300 border border-white/5">
                      {`{
  "event": "order.paid",
  "orderCode": "WALZ-88912",
  "amount": 50000,
  "paidAt": "2026-10-28T10:30:00.000Z"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
