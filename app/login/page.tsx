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
    `w-full rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-100 bg-slate-950/80 border backdrop-blur-md transition-all outline-none placeholder-slate-500 ${
      s === "error"
        ? "border-rose-500/50 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
        : s === "valid"
        ? "border-emerald-500/50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
        : "border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-700"
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#060911] px-5 py-8 font-sans">
      <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 shadow-xl shadow-emerald-500/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="15" y="2" width="7" height="7" rx="1.5"/>
              <rect x="2" y="15" width="7" height="7" rx="1.5"/><path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2h-2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            QRIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pro</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-400">Masuk ke dashboard kamu</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 space-y-5">

          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailTouched.current) setEmailErr(validateEmail(e.target.value));
                }}
                onBlur={() => { emailTouched.current = true; setEmailErr(validateEmail(email)); }}
                onKeyDown={handleKeyDown}
                className={inputCls(emailState)}
                placeholder="email@contoh.com"
                autoComplete="email"
              />
              {emailState === "valid" && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400">✓</span>
              )}
              {emailState === "error" && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400">✕</span>
              )}
            </div>
            {emailErr && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {emailErr}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passTouched.current) setPassErr(validatePassword(e.target.value));
                }}
                onBlur={() => { passTouched.current = true; setPassErr(validatePassword(password)); }}
                onKeyDown={handleKeyDown}
                className={`${inputCls(passState)} pr-24`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                {showPass ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            {passErr && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {passErr}
              </p>
            )}
          </div>

          {serverErr && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs font-semibold text-rose-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              {serverErr}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-emerald-500/30 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                </svg>
                Memverifikasi...
              </>
            ) : "Masuk"}
          </button>
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-slate-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-extrabold text-emerald-400 hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
