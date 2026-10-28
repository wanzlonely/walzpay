"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
getToken,
getUser,
clearSession,
authHeaders,
saveSession,
} from "@/lib/client-auth";

type ProfileUser = {
id?: string;
name?: string;
email?: string;
apiKey?: string;
webhookUrl?: string;
createdAt?: string;
[key: string]: unknown;
};

type Tab = "account" | "api" | "docs";

function Icon({
name,
size = 20,
}: {
name: string;
size?: number;
}) {
const common = {
width: size,
height: size,
viewBox: "0 0 24 24",
fill: "none",
stroke: "currentColor",
strokeWidth: 1.7,
strokeLinecap: "round" as const,
strokeLinejoin: "round" as const,
"aria-hidden": true as const,
};

switch (name) {
case "user":
return (
<svg {...common}>
<circle cx="12" cy="8" r="4" />
<path d="M5 21v-2a7 7 0 0 1 14 0v2" />
</svg>
);
case "key":
return (
<svg {...common}>
<circle cx="8" cy="15" r="5" />
<path d="m11.5 11.5 8-8L22 6l-2 2 2 2-3 3-2-2-2 2" />
</svg>
);
case "book":
return (
<svg {...common}>
<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
<path d="M8 7h8M8 11h6" />
</svg>
);
case "shield":
return (
<svg {...common}>
<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
<path d="m9 12 2 2 4-4" />
</svg>
);
case "copy":
return (
<svg {...common}>
<rect x="8" y="8" width="13" height="13" rx="2" />
<path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
</svg>
);
case "check":
return (
<svg {...common}>
<path d="m5 12 4 4L19 6" />
</svg>
);
case "logout":
return (
<svg {...common}>
<path d="M10 17l5-5-5-5M15 12H3" />
<path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
</svg>
);
case "globe":
return (
<svg {...common}>
<circle cx="12" cy="12" r="10" />
<path d="M2 12h20" />
<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
</svg>
);
case "arrow":
return (
<svg {...common}>
<path d="M7 17 17 7M7 7h10v10" />
</svg>
);
case "webhook":
return (
<svg {...common}>
<circle cx="12" cy="5" r="3" />
<circle cx="5" cy="18" r="3" />
<circle cx="19" cy="18" r="3" />
<path d="m10.5 7.5-4 8M13.5 7.5l4 8M8 18h8" />
</svg>
);
default:
return null;
}
}

function CopyField({
label,
value,
mono = false,
}: {
label: string;
value: string;
mono?: boolean;
}) {
const [copied, setCopied] = useState(false);
const [copyError, setCopyError] = useState(false);

const copyValue = async () => {
if (!value || value === "—") return;

try {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand("copy");
    textarea.remove();

    if (!success) throw new Error("Copy failed");
  }

  setCopied(true);
  setCopyError(false);
  window.setTimeout(() => setCopied(false), 2000);
} catch {
  setCopyError(true);
  window.setTimeout(() => setCopyError(false), 2500);
}

};

return (
<div className="min-w-0">
<p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
{label}
</p>

  <div className="flex min-w-0 items-center gap-2">
    <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3.5">
      <p
        className={`truncate text-sm font-semibold ${
          mono
            ? "font-mono tracking-tight text-emerald-300"
            : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>

    <button
      type="button"
      onClick={copyValue}
      disabled={!value || value === "—"}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-3.5 py-3.5 text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
        copied
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-emerald-400/30 hover:text-emerald-300"
      }`}
    >
      <Icon name={copied ? "check" : "copy"} size={15} />
      <span>
        {copied ? "Tersalin" : copyError ? "Gagal" : "Salin"}
      </span>
    </button>
  </div>

  {copyError && (
    <p className="mt-2 text-xs text-rose-400">
      Gagal menyalin. Coba salin kembali.
    </p>
  )}
</div>

);
}

function SectionHeading({
eyebrow,
title,
description,
}: {
eyebrow: string;
title: string;
description: string;
}) {
return (
<div className="mb-6">
<p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">
{eyebrow}
</p>
<h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
{title}
</h2>
<p className="mt-2 text-sm leading-relaxed text-slate-400">
{description}
</p>
</div>
);
}

function CodeExample({
method,
endpoint,
description,
children,
}: {
method: string;
endpoint: string;
description: string;
children: string;
}) {
const methodClass =
method === "POST"
? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
: method === "GET"
? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
: "border-amber-400/20 bg-amber-400/10 text-amber-300";

return (
<div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080e19]/80">
<div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] bg-white/[0.025] px-4 py-3.5">
<span
className={"rounded-lg border px-2.5 py-1 font-mono text-[10px] font-black ${methodClass}"}
>
{method}
</span>
<code className="min-w-0 break-all text-xs font-bold text-slate-200">
{endpoint}
</code>
</div>

  <div className="p-4">
    <p className="mb-3 text-xs leading-relaxed text-slate-400">
      {description}
    </p>
    <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/30 p-4 font-mono text-[11px] leading-6 text-emerald-300">
      {children}
    </pre>
  </div>
</div>

);
}

export default function ProfilePage() {
const router = useRouter();

const [user, setUser] = useState<ProfileUser | null>(null);
const [webhookUrl, setWebhookUrl] = useState("");
const [savingWh, setSavingWh] = useState(false);
const [whMsg, setWhMsg] = useState("");
const [activeSection, setActive] = useState<Tab>("account");
const [confirmLogout, setConfirmLogout] = useState(false);

useEffect(() => {
const currentUser = getUser();

if (!currentUser || !getToken()) {
  router.replace("/login");
  return;
}

setUser(currentUser as ProfileUser);
setWebhookUrl(currentUser.webhookUrl || "");

}, [router]);

const saveWebhook = async () => {
if (savingWh) return;

setSavingWh(true);
setWhMsg("");

try {
  const normalizedUrl = webhookUrl.trim();

  if (normalizedUrl) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      throw new Error("Format URL webhook tidak valid.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("URL harus menggunakan HTTP atau HTTPS.");
    }

    if (parsedUrl.username || parsedUrl.password) {
      throw new Error("URL tidak boleh berisi username atau password.");
    }
  }

  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ webhookUrl: normalizedUrl }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.error ||
        result?.message ||
        `Gagal menyimpan webhook (${response.status}).`
    );
  }

  const token = getToken();

  if (!token) {
    throw new Error("Sesi login berakhir. Silakan login kembali.");
  }

  const updatedUser: ProfileUser = {
    ...user,
    webhookUrl: normalizedUrl,
  };

  saveSession(token, updatedUser);
  setUser(updatedUser);
  setWebhookUrl(normalizedUrl);
  setWhMsg("Webhook berhasil disimpan.");

  window.setTimeout(() => setWhMsg(""), 3500);
} catch (error) {
  setWhMsg(
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan saat menyimpan webhook."
  );
} finally {
  setSavingWh(false);
}

};

const handleLogout = () => {
clearSession();
router.replace("/login");
};

if (!user) {
return (
<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14]">
<div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
<div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
      <p className="text-xs font-semibold tracking-wide text-slate-400">
        Memuat profil WALZPAY...
      </p>
    </div>
  </main>
);

}

const displayName = user.name?.trim() || "Pengguna WALZPAY";
const displayEmail = user.email || "Email tidak tersedia";

const initials =
displayName
.split(/\s+/)
.map((word) => word[0])
.join("")
.slice(0, 2)
.toUpperCase() || "W";

const joinedDate = user.createdAt
? new Date(user.createdAt).toLocaleDateString("id-ID", {
day: "numeric",
month: "long",
year: "numeric",
})
: "—";

const tabs: { id: Tab; label: string; icon: string }[] = [
{ id: "account", label: "Akun", icon: "user" },
{ id: "api", label: "API & Webhook", icon: "key" },
{ id: "docs", label: "Docs API", icon: "book" },
];

return (
<main className="profile-page relative min-h-screen overflow-hidden bg-[#070b14] px-4 pb-28 pt-7 font-sans text-slate-100 selection:bg-emerald-400 selection:text-slate-950 sm:px-6 sm:pt-10">
<div className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.09] blur-[130px]" />
<div className="pointer-events-none absolute -right-32 top-[38%] h-[400px] w-[400px] rounded-full bg-cyan-500/[0.08] blur-[130px]" />
<div className="pointer-events-none absolute bottom-0 left-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.06] blur-[130px]" />

  <div className="profile-shell relative z-10 mx-auto w-full max-w-3xl space-y-6 sm:space-y-7">
    <header className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-br from-[#152438]/95 via-[#0e1929]/95 to-[#0a111e]/95 p-5 shadow-2xl shadow-black/20 sm:rounded-[32px] sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-emerald-400/[0.09] blur-[70px]" />
      <div className="pointer-events-none absolute bottom-0 right-[25%] h-32 w-32 rounded-full bg-cyan-400/[0.06] blur-[60px]" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[23px] bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-400 text-xl font-black text-[#07111b] shadow-lg shadow-emerald-500/15 ring-1 ring-white/20 sm:h-[82px] sm:w-[82px] sm:rounded-[27px] sm:text-2xl">
            {initials}
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-[#101b2b] bg-emerald-400 text-[#05251b]">
              <Icon name="check" size={11} />
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">
                WALZPAY ACCOUNT
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                AKUN AKTIF
              </span>
            </div>

            <h1 className="break-words text-xl font-black tracking-tight text-white sm:text-2xl">
              {displayName}
            </h1>

            <p className="mt-1 break-all text-xs font-medium text-slate-400 sm:text-sm">
              {displayEmail}
            </p>

            <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Bergabung {joinedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/15 px-4 py-3 sm:min-w-[145px] sm:flex-col sm:items-start sm:gap-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300 sm:mb-1">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Akses Aman</p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Area akun pribadi
            </p>
          </div>
        </div>
      </div>
    </header>

    <nav
      aria-label="Navigasi profil"
      className="grid grid-cols-3 gap-1.5 rounded-[22px] border border-white/[0.08] bg-[#0b111d]/90 p-1.5 shadow-xl shadow-black/10 backdrop-blur-2xl sm:gap-2 sm:rounded-2xl sm:p-2"
    >
      {tabs.map((tab) => {
        const selected = activeSection === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-current={selected ? "page" : undefined}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-[15px] px-1.5 py-3 text-[10px] font-extrabold transition-all duration-300 sm:gap-2 sm:px-3 sm:text-xs ${
              selected
                ? "bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-[#07111b] shadow-lg shadow-emerald-500/10"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <Icon name={tab.icon} size={15} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>

    {activeSection === "account" && (
      <section className="profile-panel space-y-5">
        <div className="glass-card glass-card-hover rounded-[26px] border border-white/[0.08] bg-[#101827]/90 p-5 shadow-xl sm:rounded-[30px] sm:p-7">
          <SectionHeading
            eyebrow="Account overview"
            title="Informasi Akun"
            description="Detail identitas yang terhubung dengan akun WALZPAY kamu."
          />

          <div className="space-y-0">
            <div className="flex items-start gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
                <Icon name="user" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-medium text-slate-500">
                  Nama lengkap
                </p>
                <p className="break-words text-sm font-bold text-slate-100">
                  {displayName}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <div className="flex items-start gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300">
                <Icon name="globe" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-medium text-slate-500">
                  Alamat email
                </p>
                <p className="break-all text-sm font-semibold text-slate-200">
                  {displayEmail}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <div className="flex items-start gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-violet-300">
                <Icon name="shield" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-medium text-slate-500">
                  ID Akun
                </p>
                <p className="break-all font-mono text-xs font-semibold text-slate-300">
                  {user.id || "—"}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <div className="flex items-start gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.07] text-amber-300">
                <Icon name="book" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-medium text-slate-500">
                  Tanggal bergabung
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {joinedDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-emerald-400/15 bg-gradient-to-r from-emerald-400/[0.07] to-cyan-400/[0.04] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <Icon name="shield" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Jaga keamanan akun
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Jangan membagikan kredensial login atau kunci API kepada
                orang lain yang tidak kamu percaya.
              </p>
            </div>
          </div>
        </div>

        {!confirmLogout ? (
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-5 py-4 text-sm font-bold text-rose-300 transition-all duration-300 hover:border-rose-400/35 hover:bg-rose-400/[0.11] active:scale-[0.99]"
          >
            <Icon name="logout" size={18} />
            Keluar dari Akun
          </button>
        ) : (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-5">
            <p className="text-sm font-bold text-slate-100">
              Keluar dari akun?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Kamu perlu login kembali untuk mengakses akun ini.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/[0.08]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs font-bold text-rose-300 hover:bg-rose-400/15"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        )}
      </section>
    )}

    {activeSection === "api" && (
      <section className="profile-panel space-y-5">
        <div className="glass-card glass-card-hover rounded-[26px] border border-white/[0.08] bg-[#101827]/90 p-5 shadow-xl sm:rounded-[30px] sm:p-7">
          <SectionHeading
            eyebrow="Developer access"
            title="Autentikasi API"
            description="Gunakan kunci API untuk mengautentikasi request dari aplikasi atau sistem kamu."
          />

          <CopyField
            label="Kunci API kamu"
            value={user.apiKey || "—"}
            mono
          />

          <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
            <div className="flex items-start gap-3">
              <Icon name="shield" size={18} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-200">
                  Header autentikasi
                </p>
                <p className="mt-2 break-words text-xs leading-relaxed text-slate-400">
                  Sertakan header berikut pada request API:
                </p>
                <code className="mt-2 block break-all rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 font-mono text-[11px] text-emerald-300">
                  X-API-Key: &lt;key&gt;
                </code>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Simpan kunci API di sisi server dan hindari menaruhnya dalam
            kode frontend publik.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-[26px] border border-white/[0.08] bg-[#101827]/90 p-5 shadow-xl sm:rounded-[30px] sm:p-7">
          <SectionHeading
            eyebrow="Event notification"
            title="Webhook Notifikasi"
            description="Atur endpoint yang akan menerima notifikasi status pembayaran."
          />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveWebhook();
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="webhook-url"
                className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400"
              >
                URL Penerima
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="globe" size={17} />
                </span>

                <input
                  id="webhook-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://domain-kamu.com/webhook"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-11 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.08]"
                />
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Kosongkan kolom jika ingin menghapus URL webhook, apabila
                endpoint server mendukung perilaku tersebut.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingWh}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 px-5 py-4 text-sm font-extrabold text-[#07111b] shadow-lg shadow-emerald-500/[0.12] transition-all duration-300 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingWh ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/25 border-t-slate-900" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon name="check" size={17} />
                  Simpan Webhook
                </>
              )}
            </button>
          </form>

          {whMsg && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
                whMsg.toLowerCase().includes("gagal") ||
                whMsg.toLowerCase().includes("tidak valid") ||
                whMsg.toLowerCase().includes("harus menggunakan") ||
                whMsg.toLowerCase().includes("tidak boleh") ||
                whMsg.toLowerCase().includes("berakhir")
                  ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-300"
                  : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
              }`}
            >
              <Icon
                name={
                  whMsg.toLowerCase().includes("gagal") ||
                  whMsg.toLowerCase().includes("tidak valid") ||
                  whMsg.toLowerCase().includes("harus menggunakan") ||
                  whMsg.toLowerCase().includes("tidak boleh") ||
                  whMsg.toLowerCase().includes("berakhir")
                    ? "shield"
                    : "check"
                }
                size={16}
              />
              <span className="break-words">{whMsg}</span>
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mt-0.5 shrink-0 text-cyan-300">
              <Icon name="webhook" size={18} />
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Pastikan endpoint webhook dapat menerima request POST dan
              memvalidasi notifikasi yang masuk. Pengiriman notifikasi
              aktual bergantung pada implementasi backend WALZPAY.
            </p>
          </div>
        </div>
      </section>
    )}

    {activeSection === "docs" && (
      <section className="profile-panel space-y-5">
        <div className="glass-card glass-card-hover rounded-[26px] border border-white/[0.08] bg-[#101827]/90 p-5 shadow-xl sm:rounded-[30px] sm:p-7">
          <SectionHeading
            eyebrow="Developer resources"
            title="Referensi API"
            description="Contoh endpoint dan struktur data untuk integrasi API WALZPAY."
          />

          <div className="space-y-4">
            <CodeExample
              method="POST"
              endpoint="/api/v1/orders"
              description="Contoh request untuk membuat tagihan QRIS dinamis."
            >
              {`// Request Body

{
"amount": 50000,
"description": "Order #1"
}

// Headers
X-API-Key: ${(user.apiKey || "").slice(0, 14)}...

// Response Success
{
"code": "ABCD1234",
"qrisString": "000201...",
"totalAmount": 50000
}`}
</CodeExample>

            <CodeExample
              method="GET"
              endpoint="/api/v1/orders/:code"
              description="Contoh respons untuk memeriksa status pesanan berdasarkan kode order."
            >
              {`// Response Success

{
"status": "paid",
"paidAt": "2026-10-26T10:30:00Z",
"totalAmount": 50000
}`}
</CodeExample>

            <CodeExample
              method="WH"
              endpoint="Webhook payload"
              description="Contoh payload notifikasi ketika pembayaran berhasil."
            >
              {`{

"event": "order.paid",
"orderCode": "ABCD1234",
"amount": 50000,
"paidAt": "2026-10-26T10:30:00.000Z"
}`}
</CodeExample>
</div>

          <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4">
            <p className="text-xs font-bold text-amber-200">
              Catatan integrasi
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Contoh di atas mengikuti struktur dokumentasi yang ditampilkan
              pada halaman profil. Pastikan nama field, format respons,
              autentikasi, dan endpoint sesuai dengan implementasi backend
              yang benar-benar aktif.
            </p>
          </div>
        </div>
      </section>
    )}

    <footer className="pb-2 pt-1 text-center">
      <div className="mb-2 inline-flex items-center justify-center gap-2 text-[10px] font-extrabold tracking-[0.2em] text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        WALZPAY
      </div>
      <p className="text-[10px] text-slate-600">
        Area pengaturan akun dan integrasi pembayaran.
      </p>
    </footer>
  </div>
</main>

);
}