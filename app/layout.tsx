import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "QRIS Pro",
  description: "Generate & kelola QRIS dinamis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="relative min-h-screen bg-[#f6f8fc] font-[Plus_Jakarta_Sans] antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[720px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-blue-200/30 blur-[110px]" />
          <div className="absolute top-[28%] -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-100/30 blur-[90px] animate-float" />
          <div className="absolute bottom-0 -right-40 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-violet-200/25 to-indigo-100/25 blur-[95px] animate-float-delayed" />
        </div>
        <div className="relative">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
