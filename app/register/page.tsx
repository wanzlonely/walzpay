"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

function BrandMark() { return <div className="brand-mark"><img src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png" alt="WALZPAY" /></div>; }

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formReady = Boolean(name && email && password);
  const handleRegister = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      saveSession(json.data.token, json.data.user); router.push("/");
    } catch (err: any) { setError(err.message || "Gagal daftar"); } finally { setLoading(false); }
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter") handleRegister();
  };
  const inputClass = "mt-2 w-full rounded-2xl border border-white/[.09] bg-white/[.06] px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[.09] focus:ring-4 focus:ring-blue-400/10";
  return <main className="auth-page"><div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/><section className="auth-wrap">
    <Link href="/" className="auth-brand"><BrandMark/><span>WALZ<span>PAY</span></span></Link>
    <div className="auth-card"><div className="eyebrow">START YOUR JOURNEY</div><h1>Buat akun baru</h1><p className="auth-subtitle">Mulai menerima pembayaran QRIS dengan cara yang lebih modern.</p>
      <div className="auth-form">
        <label>Nama bisnis<input value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} className={inputClass} placeholder="Nama toko atau bisnismu" autoComplete="name"/></label>
        <label>Alamat email<input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} className={inputClass} placeholder="nama@email.com" autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} className={inputClass} placeholder="Minimal 6 karakter" autoComplete="new-password"/></label>
        {error && <div className="form-alert">{error}</div>}
        <button onClick={handleRegister} disabled={loading} className={`primary-action ${formReady ? "ready" : ""}`}>{loading ? "Membuat akun..." : "Buat akun sekarang"}<span>↗</span></button>
      </div>
      <div className="auth-footer"><span>Sudah punya akun?</span><Link href="/login">Masuk ke akun</Link></div>
    </div><p className="auth-note"><span>●</span> Gratis untuk mulai digunakan</p>
  </section></main>;
}
