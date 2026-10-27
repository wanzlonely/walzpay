"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Menu", icon: (a: boolean) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href: "/transaksi", label: "Transaksi", icon: (a: boolean) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: "/qris", label: "QRIS", icon: (a: boolean) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="15" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="15" width="7" height="7" rx="1.5"/><path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2h-2z"/></svg> },
  { href: "/profile", label: "Profil", icon: (a: boolean) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/pay") || pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
      <div className="mx-auto max-w-md pointer-events-auto">
        <div className="flex items-center rounded-3xl border border-white/80 bg-white/70 p-2 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-all">
                {active && <span className="absolute inset-0 rounded-2xl bg-indigo-50 border border-indigo-100" />}
                <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-all ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-300" : "text-slate-400"}`}>
                  {tab.icon(!!active)}
                </span>
                <span className={`relative z-10 text-[10px] ${active ? "font-bold text-indigo-900" : "font-semibold text-slate-400"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
