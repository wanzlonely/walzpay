"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession, authHeaders, saveSession } from "@/lib/client-auth";

function CopyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200/60 bg-gray-50/50 px-4 py-3 shadow-inner">
          <p className={`${mono ? "font-mono tracking-tight" : ""} truncate text-sm ${mono ? "font-semibold text-indigo-600" : "text-gray-700"}`}>
            {value}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={`shrink-0 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
            copied
              ? "bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200"
              : "bg-white text-gray-600 shadow-sm border border-gray-200/80 hover:bg-gray-50"
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
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-indigo-600" />
      </div>
    );
  }

  const initials = user.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] px-4 pb-28 pt-8 font-sans">
      
      <div className="pointer-events-none absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-indigo-200/30 blur-[80px]"></div>
      <div className="pointer-events-none absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-blue-200/30 blur-[80px]"></div>

      <div className="relative z-10 mx-auto max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-5">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-blue-600 text-2xl font-black text-white shadow-lg shadow-indigo-500/30 border border-white/20">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{user.name}</h1>
            <p className="text-sm font-medium text-gray-500">{user.email}</p>
            <div className="mt-2 inline-flex items-center rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase backdrop-blur-md">
              Bergabung {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 rounded-[1.25rem] border border-white/60 bg-white/40 p-1.5 shadow-sm backdrop-blur-md">
          {(["account", "api", "docs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all duration-300 ${
                activeSection === tab
                  ? "bg-white text-indigo-600 shadow-md shadow-gray-200/50 border border-white"
                  : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
              }`}
            >
              {tab === "account" ? "Akun" : tab === "api" ? "API & Webhook" : "Docs API"}
            </button>
          ))}
        </div>

        {activeSection === "account" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <div className="rounded-[2rem] border border-white/60 bg-white/50 p-7 shadow-[0_8px_40px_rgb(0,0,0,0.03)] backdrop-blur-xl">
              <p className="mb-6 text-xs font-bold uppercase tracking-wider text-gray-400">Informasi Akun</p>
              <div className="space-y-5">
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-400">Nama</p>
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                </div>
                <div className="h-px w-full bg-gray-100"></div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-400">Email</p>
                  <p className="text-sm font-semibold text-gray-700">{user.email}</p>
                </div>
                <div className="h-px w-full bg-gray-100"></div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-400">ID Akun</p>
                  <p className="truncate font-mono text-xs font-semibold text-gray-500">{user.id}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
              className="w-full rounded-[1.5rem] border border-red-200 bg-white/60 py-4 text-sm font-bold text-red-600 shadow-sm backdrop-blur-md transition-all hover:bg-red-50 hover:border-red-300 hover:shadow-md active:scale-[0.98]"
            >
              Keluar dari Akun
            </button>
          </div>
        )}

        {activeSection === "api" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <div className="rounded-[2rem] border border-white/60 bg-white/50 p-7 shadow-[0_8px_40px_rgb(0,0,0,0.03)] backdrop-blur-xl space-y-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Autentikasi API</p>
              <CopyField label="Kunci API Kamu" value={user.apiKey || "—"} mono />
              <div className="rounded-[1.25rem] border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-xs font-medium leading-relaxed text-indigo-900/80">
                  Gunakan header <code className="rounded-md bg-indigo-100/80 px-1.5 py-0.5 font-mono text-xs font-bold text-indigo-700">X-API-Key: &lt;key&gt;</code> untuk semua request API dari sistem Anda.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/60 bg-white/50 p-7 shadow-[0_8px_40px_rgb(0,0,0,0.03)] backdrop-blur-xl space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Webhook Notifikasi</p>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  URL Penerima (Endpoint)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://sistem-kamu.com/webhook"
                  className="w-full rounded-[1.25rem] border border-gray-200/80 bg-white/60 px-4 py-3.5 text-sm font-medium text-gray-800 shadow-inner backdrop-blur-sm transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-400/10"
                />
              </div>
              <button
                onClick={saveWebhook}
                disabled={savingWh}
                className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                {savingWh ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Webhook"
                )}
              </button>
              {whMsg && (
                <p className={`animate-in fade-in text-center text-xs font-bold ${whMsg.includes("Gagal") ? "text-red-500" : "text-emerald-500"}`}>
                  {whMsg.includes("Gagal") ? "✕" : "✓"} {whMsg}
                </p>
              )}
              <p className="text-center text-[11px] font-medium leading-relaxed text-gray-400">
                Sistem akan mengirimkan POST request berupa JSON payload ke URL ini setiap kali ada status pembayaran yang berhasil (paid).
              </p>
            </div>
          </div>
        )}

        {activeSection === "docs" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-[2rem] border border-white/60 bg-white/50 p-7 shadow-[0_8px_40px_rgb(0,0,0,0.03)] backdrop-blur-xl">
              <p className="mb-6 text-xs font-bold uppercase tracking-wider text-gray-400">Referensi API</p>

              <div className="space-y-5">
                
                <div className="overflow-hidden rounded-[1.25rem] border border-gray-200 bg-white/60 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-indigo-50/50 px-4 py-3">
                    <span className="rounded-md bg-indigo-100 px-2 py-1 font-mono text-[10px] font-black text-indigo-700">POST</span>
                    <span className="font-mono text-xs font-bold text-gray-700">/api/v1/orders</span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="mb-3 text-xs font-medium text-gray-500">Buat tagihan QRIS dinamis baru</p>
                    <pre className="overflow-x-auto rounded-xl bg-gray-50/80 p-3 font-mono text-[11px] leading-loose text-gray-600 shadow-inner">
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

                <div className="overflow-hidden rounded-[1.25rem] border border-gray-200 bg-white/60 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-emerald-50/50 px-4 py-3">
                    <span className="rounded-md bg-emerald-100 px-2 py-1 font-mono text-[10px] font-black text-emerald-700">GET</span>
                    <span className="font-mono text-xs font-bold text-gray-700">/api/v1/orders/:code</span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="mb-3 text-xs font-medium text-gray-500">Cek status order spesifik</p>
                    <pre className="overflow-x-auto rounded-xl bg-gray-50/80 p-3 font-mono text-[11px] leading-loose text-gray-600 shadow-inner">
                      {`// Response Success
{
  "status": "paid",
  "paidAt": "2026-10-26T10:30:00Z",
  "totalAmount": 50000
}`}
                    </pre>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.25rem] border border-gray-200 bg-white/60 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-amber-50/50 px-4 py-3">
                    <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-[10px] font-black text-amber-700">WH</span>
                    <span className="font-mono text-xs font-bold text-gray-700">Struktur Payload Webhook</span>
                  </div>
                  <div className="px-4 py-4">
                    <pre className="overflow-x-auto rounded-xl bg-gray-50/80 p-3 font-mono text-[11px] leading-loose text-gray-600 shadow-inner">
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
