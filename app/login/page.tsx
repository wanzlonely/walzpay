"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

type FieldState = "idle" | "error" | "valid";

function validateEmail(v: string): string | null {
  if (!v) return "Email wajib diisi";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Format email tidak valid";
  return null;
}
function validatePassword(v: string): string | null {
  if (!v) return "Password wajib diisi";
  if (v.length < 6) return "Password minimal 6 karakter";
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const emailTouched = useRef(false);
  const passTouched = useRef(false);

  const emailState: FieldState = !emailTouched.current ? "idle" : emailErr ? "error" : email ? "valid" : "idle";
  const passState: FieldState  = !passTouched.current  ? "idle" : passErr  ? "error" : password ? "valid" : "idle";

  const inputCls = (s: FieldState) =>
    `w-full rounded-2xl pl-11 py-3.5 text-sm font-medium text-slate-100 bg-slate-950/60 border backdrop-blur-xl transition-all duration-300 outline-none placeholder-slate-500 shadow-inner ${
      s === "error"
        ? "border-rose-500/60 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20 shadow-rose-500/5"
        : s === "valid"
        ? "border-emerald-500/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 shadow-emerald-500/5"
        : "border-slate-800/80 focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/15 hover:border-slate-700/80"
    }`;

  const handleLogin = async () => {
    emailTouched.current = true;
    passTouched.current = true;
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPassErr(pErr);
    if (eErr || pErr) return;

    setServerErr(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      saveSession(json.data.token, json.data.user);
      router.push("/");
    } catch (err: any) {
      const msg: string = err.message || "Gagal login";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("terdaftar") || msg.toLowerCase().includes("ditemukan")) {
        setEmailErr(msg);
      } else if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("salah") || msg.toLowerCase().includes("kata sandi")) {
        setPassErr(msg);
      } else {
        setServerErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] px-5 py-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] animate-float-slow" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[140px]" />

      <div className="relative z-10 w-full max-w-sm transition-all duration-500">
        <div className="mb-8 text-center">
          <div className="group relative mx-auto mb-4 inline-flex items-center justify-center">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-40 blur-lg transition duration-500 group-hover:opacity-70 animate-pulse-glow" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-slate-900/90 text-emerald-400 shadow-2xl backdrop-blur-xl">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
                <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="15" y="2" width="7" height="7" rx="1.5"/>
                <rect x="2" y="15" width="7" height="7" rx="1.5"/><path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2h-2z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            QRIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Pro</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-400">Masuk ke dashboard kamu</p>
        </div>

        <div className="glass-card glass-card-hover relative rounded-3xl p-8 shadow-2xl ring-1 ring-white/10 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailTouched.current) setEmailErr(validateEmail(e.target.value));
                }}
                onBlur={() => { emailTouched.current = true; setEmailErr(validateEmail(email)); }}
                onKeyDown={handleKeyDown}
                className={`${inputCls(emailState)} pr-10`}
                placeholder="email@contoh.com"
                autoComplete="email"
              />
              {emailState === "valid" && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold animate-in fade-in zoom-in duration-200">✓</span>
              )}
              {emailState === "error" && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 font-bold animate-in fade-in zoom-in duration-200">✕</span>
              )}
            </div>
            {emailErr && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400 animate-in fade-in slide-in-from-top-1 duration-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {emailErr}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passTouched.current) setPassErr(validatePassword(e.target.value));
                }}
                onBlur={() => { passTouched.current = true; setPassErr(validatePassword(password)); }}
                onKeyDown={handleKeyDown}
                className={`${inputCls(passState)} pr-28`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {passState === "valid" && (
                  <span className="text-emerald-400 font-bold animate-in fade-in zoom-in duration-200 mr-1">✓</span>
                )}
                {passState === "error" && (
                  <span className="text-rose-400 font-bold animate-in fade-in zoom-in duration-200 mr-1">✕</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="rounded-xl bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all active:scale-95 border border-slate-700/40"
                >
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>
            {passErr && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400 animate-in fade-in slide-in-from-top-1 duration-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {passErr}
              </p>
            )}
          </div>

          {serverErr && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              <span>{serverErr}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                </svg>
                <span className="relative z-10">Memverifikasi...</span>
              </>
            ) : (
              <span className="relative z-10">Masuk</span>
            )}
          </button>
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-slate-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
