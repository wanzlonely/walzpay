"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

function BrandHeader() {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 opacity-60 blur-lg animate-pulse" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 p-3 ring-1 ring-white/15 shadow-2xl">
          <img
            src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png"
            alt="WALZPAY"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase heading-font">
          WALZ<span className="gradient-text">PAY</span>
        </h1>
        <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
          Registrasi Merchant Baru
        </p>
      </div>
    </div>
  );
}

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
    <main className="relative min-h-screen w-full bg-[#020617] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] animate-ambient" />
        <div className="absolute bottom-10 -left-20 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-6 animate-entrance">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-sky-400 text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
          Aktivasi Cepat Tanpa Ribet
        </div>

        <BrandHeader />

        <div className="w-full glass-card-premium rounded-3xl p-6 sm:p-7 space-y-4 animate-border-pulse shadow-2xl">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-white">Buat Akun Baru</h2>
            <p className="text-xs text-slate-400">Mulai terima pembayaran QRIS instan</p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nama Lengkap / Usaha</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
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
                  className={`w-full glass-input-premium text-white placeholder-slate-500 rounded-2xl pl-10 pr-4 py-3 text-xs transition-all focus:outline-none ${
                    nameErr ? "!border-rose-500/80" : ""
                  }`}
                  placeholder="Toko Walzy Official"
                  autoComplete="name"
                />
              </div>
              {nameErr && <span className="text-[10px] text-rose-400 pl-1">{nameErr}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Email Utama</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" />
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" />
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
                  className={`w-full glass-input-premium text-white placeholder-slate-500 rounded-2xl pl-10 pr-4 py-3 text-xs transition-all focus:outline-none ${
                    emailErr ? "!border-rose-500/80" : ""
                  }`}
                  placeholder="merchant@walzpay.com"
                  autoComplete="email"
                />
              </div>
              {emailErr && <span className="text-[10px] text-rose-400 pl-1">{emailErr}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Kata Sandi</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" />
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
                  className={`w-full glass-input-premium text-white placeholder-slate-500 rounded-2xl pl-10 pr-10 py-3 text-xs transition-all focus:outline-none ${
                    passErr ? "!border-rose-500/80" : ""
                  }`}
                  placeholder="Min. 6 Karakter"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
              {passErr && <span className="text-[10px] text-rose-400 pl-1">{passErr}</span>}
            </div>

            {serverErr && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center">
                {serverErr}
              </div>
            )}

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className={`w-full rounded-2xl py-3.5 px-4 text-xs font-bold text-white gradient-button transition-all duration-300 ${
                !formReady ? "opacity-75" : ""
              } disabled:opacity-50 active:scale-[0.98]`}
            >
              {loading ? "Memproses Registrasi..." : "Daftar Akun Merchant"}
            </button>
          </div>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-bold text-sky-400 hover:underline">
                Masuk Saja
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
