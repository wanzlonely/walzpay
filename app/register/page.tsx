"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputCls = "w-full rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-100 bg-slate-950/80 border border-slate-800 backdrop-blur-md transition-all outline-none placeholder-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-700";

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      saveSession(json.data.token, json.data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Gagal daftar");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#060911] px-5 py-8 font-sans">
      <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 shadow-xl shadow-emerald-500/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="7" height="7" rx="1.5" />
              <rect x="15" y="2" width="7" height="7" rx="1.5" />
              <rect x="2" y="15" width="7" height="7" rx="1.5" />
              <path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2h-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            QRIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pro</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-400">Buat akun baru</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 space-y-5">
          
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputCls}
              placeholder="Nama toko / kamu"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputCls}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputCls}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs font-semibold text-rose-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-emerald-500/30 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                </svg>
                Mendaftar...
              </>
            ) : (
              "Daftar"
            )}
          </button>
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-extrabold text-emerald-400 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
