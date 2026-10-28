"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const nameTouched = useRef(false);
  const emailTouched = useRef(false);
  const passTouched = useRef(false);

  const validateName = (val: string) =>
    !val
      ? "Nama lengkap wajib diisi"
      : val.length < 3
        ? "Nama minimal 3 karakter"
        : null;

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

  const formReady = Boolean(name && email && password);

  const handleRegister = async () => {
    nameTouched.current = true;
    emailTouched.current = true;
    passTouched.current = true;

    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setNameErr(nErr);
    setEmailErr(eErr);
    setPassErr(pErr);

    if (nErr || eErr || pErr) return;

    setServerErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Gagal membuat akun");

      if (json.data?.token && json.data?.user) {
        saveSession(json.data.token, json.data.user);
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada server";

      if (
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("terdaftar") ||
        msg.toLowerCase().includes("digunakan")
      ) {
        setEmailErr(msg);
      } else if (msg.toLowerCase().includes("nama")) {
        setNameErr(msg);
      } else {
        setServerErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter") handleRegister();
  };

  return (
    <main className="relative min-h-screen w-full bg-[#060913] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[550px] bg-gradient-to-b from-blue-500/20 via-purple-600/10 to-transparent rounded-full blur-[140px] animate-float" />
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-smooth">
        <div className="card-squircle rounded-[36px] p-7 sm:p-9 space-y-6 border border-white/10 shadow-2xl">
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 opacity-50 blur-md animate-pulse" />
              <div className="relative h-16 w-16 rounded-[24px] bg-slate-950/80 p-2.5 border border-white/15 shadow-xl flex items-center justify-center">
                <img
                  src="https://cdn.phototourl.com/member/2026-10-28-caf129d3-a92e-4789-9273-6d4c8a50e3b8.jpg"
                  alt="WALZPAY Logo"
                  className="h-full w-full object-contain rounded-xl"
                />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold mb-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-blue-400">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Merchant Onboarding</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">
                Buat Akun Baru
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Mulai terima pembayaran QRIS instan sekarang
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama Lengkap / Usaha</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameTouched.current) setNameErr(validateName(e.target.value));
                  }}
                  onBlur={() => {
                    nameTouched.current = true;
                    setNameErr(validateName(name));
                  }}
                  onKeyDown={handleKeyDown}
                  className={`w-full soft-input text-white placeholder-slate-500 text-xs rounded-[20px] pl-11 pr-4 py-3.5 focus:outline-none ${
                    nameErr ? "!border-rose-500/80 ring-2 ring-rose-500/20" : ""
                  }`}
                  placeholder="Toko Walzy Official"
                  autoComplete="name"
                />
              </div>
              {nameErr && (
                <p className="text-[11px] text-rose-400 font-medium pl-2 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-rose-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{nameErr}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Utama</label>
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
                  placeholder="merchant@walzpay.com"
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
                  placeholder="Min. 6 Karakter"
                  autoComplete="new-password"
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
              onClick={handleRegister}
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
                    <span>Memproses Registrasi...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Merchant</span>
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
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-bold text-teal-400 hover:text-teal-300 transition-colors">
                Masuk Saja
              </Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
