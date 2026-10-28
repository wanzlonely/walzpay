"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

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

  const validateEmail = (val: string) =>
    !val
      ? "Alamat email wajib diisi"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        ? "Format email tidak valid"
        : null;

  const validatePassword = (val: string) =>
    !val
      ? "Kata sandi wajib diisi"
      : val.length < 6
        ? "Kata sandi minimal 6 karakter"
        : null;

  const formReady = Boolean(email && password);

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Gagal melakukan autentikasi");

      saveSession(json.data.token, json.data.user);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada server";

      if (
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("terdaftar") ||
        msg.toLowerCase().includes("ditemukan")
      ) {
        setEmailErr(msg);
      } else if (
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("salah") ||
        msg.toLowerCase().includes("kata sandi")
      ) {
        setPassErr(msg);
      } else {
        setServerErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter") handleLogin();
  };

  return (
    <main className="relative min-h-screen w-full bg-[#060913] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[550px] bg-gradient-to-b from-teal-500/20 via-blue-600/10 to-transparent rounded-full blur-[140px] animate-float" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-smooth">
        <div className="card-squircle rounded-[36px] p-7 sm:p-9 space-y-7 border border-white/10 shadow-2xl">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-teal-400 via-blue-500 to-indigo-600 opacity-50 blur-2xl animate-pulse" />
              <div className="absolute -inset-3 rounded-full border border-teal-400/30 animate-ring-rotate" />
              
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-[32px] bg-slate-950/90 p-3.5 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden animate-logo-cinematic">
                <img
                  src="https://cdn.phototourl.com/member/2026-10-28-caf129d3-a92e-4789-9273-6d4c8a50e3b8.jpg"
                  alt="WALZPAY Logo"
                  className="h-full w-full object-contain rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer-sweep pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-semibold mb-1">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-teal-400">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Gateway Infrastructure</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                WALZ<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-purple-400">PAY</span>
              </h1>
              <p className="text-xs text-slate-400">
                Masuk untuk mengelola transaksi merchant Anda
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Merchant</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
                    <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailTouched.current) setEmailErr(validateEmail(e.target.value));
                  }}
                  onBlur={() => {
                    emailTouched.current = true;
                    setEmailErr(validateEmail(email));
                  }}
                  onKeyDown={handleKeyDown}
                  className={`w-full soft-input text-white placeholder-slate-500 text-xs rounded-[20px] pl-11 pr-4 py-3.5 focus:outline-none ${
                    emailErr ? "!border-rose-500/80 ring-2 ring-rose-500/20" : ""
                  }`}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                />
              </div>
              {emailErr && (
                <p className="text-[11px] text-rose-400 font-medium pl-2 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-rose-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{emailErr}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
                    <rect x="3" y="11" width="18" height="11" rx="4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passTouched.current) setPassErr(validatePassword(e.target.value));
                  }}
                  onBlur={() => {
                    passTouched.current = true;
                    setPassErr(validatePassword(password));
                  }}
                  onKeyDown={handleKeyDown}
                  className={`w-full soft-input text-white placeholder-slate-500 text-xs rounded-[20px] pl-11 pr-11 py-3.5 focus:outline-none ${
                    passErr ? "!border-rose-500/80 ring-2 ring-rose-500/20" : ""
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
              {passErr && (
                <p className="text-[11px] text-rose-400 font-medium pl-2 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-rose-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{passErr}</span>
                </p>
              )}
            </div>

            {serverErr && (
              <div className="p-3.5 rounded-[18px] bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-rose-400 flex-shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>{serverErr}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className={`w-full card-pill-button rounded-[22px] py-3.5 px-5 text-xs font-bold text-white font-display tracking-wide ${
                !formReady || loading ? "opacity-60 cursor-not-allowed" : "active:scale-[0.98]"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </div>

          <div className="pt-2 text-center border-t border-white/5">
            <p className="text-xs text-slate-400">
              Belum punya akun merchant?{" "}
              <Link href="/register" className="font-bold text-teal-400 hover:text-teal-300 transition-colors">
                Daftar Merchant Baru
              </Link>
            </p>
          </div>

        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-slate-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Enkripsi Keamanan Standard SSL 256-Bit</span>
        </div>
      </div>
    </main>
  );
}
