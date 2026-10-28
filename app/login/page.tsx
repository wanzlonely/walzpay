"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

function BrandMark() {
  return <div className="brand-mark"><div className="brand-mark-core">W</div></div>;
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
  const validateEmail = (value: string) => !value ? "Email wajib diisi" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Format email tidak valid" : null;
  const validatePassword = (value: string) => !value ? "Password wajib diisi" : value.length < 6 ? "Password minimal 6 karakter" : null;
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
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      saveSession(json.data.token, json.data.user);
      router.push("/");
    } catch (err: any) {
      const msg = err.message || "Gagal login";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("terdaftar") || msg.toLowerCase().includes("ditemukan")) setEmailErr(msg);
      else if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("salah") || msg.toLowerCase().includes("kata sandi")) setPassErr(msg);
      else setServerErr(msg);
    } finally { setLoading(false); }
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter") handleLogin();
  };
  const inputClass = "mt-2 w-full rounded-2xl border border-white/[.09] bg-white/[.06] px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[.09] focus:ring-4 focus:ring-blue-400/10";
  return <main className="auth-page"><div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/><section className="auth-wrap">
    <Link href="/" className="auth-brand"><BrandMark/><span>WALZ<span>PAY</span></span></Link>
    <div className="auth-card"><div className="eyebrow">SECURE ACCESS</div><h1>Masuk ke akun</h1><p className="auth-subtitle">Kelola pembayaran digitalmu dalam satu ruang yang lebih sederhana.</p>
      <div className="auth-form">
        <label>Alamat email<input type="email" value={email} onChange={e => { setEmail(e.target.value); if (emailTouched.current) setEmailErr(validateEmail(e.target.value)); }} onBlur={() => { emailTouched.current = true; setEmailErr(validateEmail(email)); }} onKeyDown={handleKeyDown} className={inputClass} placeholder="nama@email.com" autoComplete="email"/>{emailErr && <small className="field-error">{emailErr}</small>}</label>
        <label>Password<div className="relative"><input type={showPass ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); if (passTouched.current) setPassErr(validatePassword(e.target.value)); }} onBlur={() => { passTouched.current = true; setPassErr(validatePassword(password)); }} onKeyDown={handleKeyDown} className={inputClass} placeholder="••••••••" autoComplete="current-password"/><button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}>{showPass ? "◉" : "◌"}</button></div>{passErr && <small className="field-error">{passErr}</small>}</label>
        {serverErr && <div className="form-alert">{serverErr}</div>}
        <button onClick={handleLogin} disabled={loading} className="primary-action">{loading ? "Memverifikasi..." : "Masuk ke dashboard"}<span>↗</span></button>
      </div>
      <div className="auth-footer"><span>Belum punya akun?</span><Link href="/register">Buat akun baru</Link></div>
    </div><p className="auth-note"><span>●</span> Sistem aman dan terenkripsi</p>
  </section></main>;
}
