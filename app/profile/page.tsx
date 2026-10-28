"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession, authHeaders, saveSession } from "@/lib/client-auth";

function CopyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3.5 shadow-inner backdrop-blur-xl">
          <p className={`${mono ? "font-mono tracking-tight text-emerald-400" : "text-slate-200"} truncate text-sm font-semibold`}>
            {value}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={`copy-button shrink-0 rounded-2xl px-4 py-3.5 text-xs font-extrabold transition-all duration-300 active:scale-95 ${
            copied
              ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
              : "border border-slate-700/80 bg-slate-800/80 text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
          }`}
        >
          {copied ? "✓ Tersalin" : "Salin"}
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
      <div className="relative flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px] animate-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] animate-float-slow" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent shadow-lg shadow-emerald-500/20" />
      </div>
    );
  }

  const initials = user.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="app-page profile-page relative min-h-screen overflow-hidden bg-[#030712] px-5 pb-32 pt-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="pointer-events-none absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[120px]"></div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[140px]" />

      <div className="profile-shell relative z-10 mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-2xl font-black text-slate-950 shadow-xl shadow-emerald-500/20 ring-1 ring-white/20">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-100">{user.name}</h1>
            <p className="text-sm font-semibold text-slate-400">{user.email}</p>
            <div className="profile-meta mt-2 inline-flex items-center rounded-full border border-slate-800/80 bg-slate-900/60 px-3 py-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase backdrop-blur-md">
              Bergabung {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-1.5 shadow-lg backdrop-blur-2xl">
          {(["account", "api", "docs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-1 rounded-2xl py-3 text-xs font-extrabold transition-all duration-300 ${
                activeSection === tab
                  ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              {tab === "account" ? "Akun" : tab === "api" ? "API & Webhook" : "Docs API"}
            </button>
          ))}
        </div>

        {activeSection === "account" && (
          <div className="profile-panel space-y-5">
            <div className="glass-card glass-card-hover rounded-3xl p-7 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 space-y-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Informasi Akun</p>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Nama</p>
                  <p className="text-sm font-bold text-slate-100">{user.name}</p>
                </div>
                <div className="h-px w-full bg-slate-800/60" />
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Email</p>
                  <p className="text-sm font-semibold text-slate-300">{user.email}</p>
                </div>
                <div className="h-px w-full bg-slate-800/60" />
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">ID Akun</p>
                  <p className="truncate font-mono text-xs font-semibold text-slate-400">{user.id}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
              className="w-full rounded-3xl border border-rose-500/30 bg-rose-500/10 py-4 text-sm font-extrabold text-rose-400 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-rose-500/20 hover:border-rose-500/50 active:scale-95"
            >
              Keluar dari Akun
            </button>
          </div>
        )}

        {activeSection === "api" && (
          <div className="profile-panel space-y-5">
            <div className="glass-card glass-card-hover rounded-3xl p-7 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 space-y-6">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Autentikasi API</p>
              <CopyField label="Kunci API Kamu" value={user.apiKey || "—"} mono />
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-medium leading-relaxed text-emerald-300">
                  Gunakan header <code className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-400">X-API-Key: &lt;key&gt;</code> untuk semua request API dari sistem Anda.
                </p>
              </div>
            </div>

            <div className="glass-card glass-card-hover rounded-3xl p-7 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 space-y-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Webhook Notifikasi</p>
              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  URL Penerima (Endpoint)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://sistem-kamu.com/webhook"
                  className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3.5 text-sm font-medium text-slate-100 shadow-inner backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/80 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 placeholder:text-slate-500 hover:border-slate-700/80"
                />
              </div>
              <button
                onClick={saveWebhook}
                disabled={savingWh}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                {savingWh ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Webhook</span>
                )}
              </button>
              {whMsg && (
                <p className={`animate-in fade-in text-center text-xs font-extrabold ${whMsg.includes("Gagal") ? "text-rose-400" : "text-emerald-400"}`}>
                  {whMsg.includes("Gagal") ? "✕" : "✓"} {whMsg}
                </p>
              )}
              <p className="text-center text-[11px] font-medium leading-relaxed text-slate-500">
                Sistem akan mengirimkan POST request berupa JSON payload ke URL ini setiap kali ada status pembayaran yang berhasil (paid).
              </p>
            </div>
          </div>
        )}

        {activeSection === "docs" && (
          <div className="profile-panel">
            <div className="glass-card glass-card-hover rounded-3xl p-7 shadow-xl backdrop-blur-2xl ring-1 ring-white/10 space-y-6">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Referensi API</p>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-inner">
                  <div className="flex items-center gap-3 border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-[10px] font-black text-emerald-400">POST</span>
                    <span className="font-mono text-xs font-extrabold text-slate-300">/api/v1/orders</span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="mb-3 text-xs font-medium text-slate-400">Buat tagihan QRIS dinamis baru</p>
                    <pre className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-400 shadow-inner">
                      {`// Request Body
{ "amount": 50000, "description": "Order #1" }

// Headers
X-API-Key: ${(user.apiKey || "").slice(0, 14)}...

// Response Success
{
  "code": "ABCD1234",
  "qrisString": "000201...",
  "totalAmount": 50000
}`}
                    </pre>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-inner">
                  <div className="flex items-center gap-3 border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
                    <span className="rounded-md bg-cyan-500/20 px-2 py-1 font-mono text-[10px] font-black text-cyan-400">GET</span>
                    <span className="font-mono text-xs font-extrabold text-slate-300">/api/v1/orders/:code</span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="mb-3 text-xs font-medium text-slate-400">Cek status order spesifik</p>
                    <pre className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-400 shadow-inner">
                      {`// Response Success
{
  "status": "paid",
  "paidAt": "2026-10-26T10:30:00Z",
  "totalAmount": 50000
}`}
                    </pre>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-inner">
                  <div className="flex items-center gap-3 border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
                    <span className="rounded-md bg-amber-500/20 px-2 py-1 font-mono text-[10px] font-black text-amber-400">WH</span>
                    <span className="font-mono text-xs font-extrabold text-slate-300">Struktur Payload Webhook</span>
                  </div>
                  <div className="px-4 py-4">
                    <pre className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-400 shadow-inner">
                      {`{
  "event": "order.paid",
  "orderCode": "ABCD1234",
  "amount": 50000,
  "paidAt": "2026-10-26T10:30:00.000Z"
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
