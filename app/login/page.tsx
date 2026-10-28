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
    <main className="relative min-h-screen w-full bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full p-8 rounded-3xl bg-slate-900/30 border border-white/10 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/20 to-transparent blur-2xl pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
                <div className="h-full w-full rounded-[15px] bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png"
                    alt="WALZPAY Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white uppercase font-mono">
                  WALZ<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">PAY</span>
                </span>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Enterprise Gateway
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Kelola Transaksi Bisnis Tanpa Hambatan
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform pembayaran generasi berikutnya dengan infrastruktur aman, pemrosesan instan, dan analisis real-time.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-8">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/40 border border-white/5 backdrop-blur-md">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Keamanan Enkripsi End-to-End</p>
                <p className="text-[10px] text-slate-400">Standar Protokol PCI-DSS Level 1</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/40 border border-white/5 backdrop-blur-md">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Settlement QRIS Real-Time</p>
                <p className="text-[10px] text-slate-400">Penyelesaian transaksi serba cepat</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-md bg-slate-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
            <div className="flex lg:hidden flex-col items-center text-center space-y-3 pb-2">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
                <div className="h-full w-full rounded-[15px] bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png"
                    alt="WALZPAY Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white uppercase font-mono">
                  WALZ<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">PAY</span>
                </h1>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Next-Gen Payment Gateway
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Selamat Datang Kembali</h2>
                <p className="text-xs text-slate-400">Masuk untuk mengakses portal merchant</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  Email Merchant
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
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
                    className={`w-full bg-slate-950/60 border text-white placeholder-slate-500 text-xs rounded-xl pl-10 pr-4 py-3.5 transition-all duration-200 focus:outline-none ${
                      emailErr
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                        : "border-slate-800 focus:border-cyan-400/80 focus:ring-4 focus:ring-cyan-500/10"
                    }`}
                    placeholder="nama@perusahaan.com"
                    autoComplete="email"
                  />
                </div>
                {emailErr && <p className="text-[11px] text-rose-400 font-medium pl-1 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {emailErr}
                </p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
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
                    className={`w-full bg-slate-950/60 border text-white placeholder-slate-500 text-xs rounded-xl pl-10 pr-10 py-3.5 transition-all duration-200 focus:outline-none ${
                      passErr
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                        : "border-slate-800 focus:border-cyan-400/80 focus:ring-4 focus:ring-cyan-500/10"
                    }`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {passErr && <p className="text-[11px] text-rose-400 font-medium pl-1 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {passErr}
                </p>}
              </div>

              {serverErr && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{serverErr}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className={`w-full relative group overflow-hidden rounded-xl py-3.5 px-4 text-xs font-bold text-white transition-all duration-300 ${
                  formReady && !loading
                    ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 active:scale-[0.99]"
                    : "bg-slate-800 text-slate-400 opacity-65 cursor-not-allowed"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
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
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-1">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Belum memiliki akun merchant?{" "}
                <Link href="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-slate-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>Enkripsi Bank-Grade SSL 256-Bit</span>
          </div>
        </div>
      </div>
    </main>
  );
}
