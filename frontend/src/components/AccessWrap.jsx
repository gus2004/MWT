"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";

export default function AccessWrap({ children, title, sub, onBack }) {
  return (
    <div className="min-h-screen bg-[#08111F] flex flex-col overflow-hidden relative" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Decorative glows */}
      <div aria-hidden className="pointer-events-none absolute -top-48 -left-40 w-[560px] h-[560px] rounded-full bg-blue-600/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-56 -right-40 w-[640px] h-[640px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-sky-500/10 blur-3xl" />

      <nav className="relative flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/[0.08] shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ChevronLeft size={15} />
          <span className="text-xs sm:text-sm font-black uppercase tracking-[0.1em]">Volver</span>
        </button>
        <div className="flex items-center gap-2">
          <Image src="/MWT - BLANCO.png" alt="MWT Motorsport" width={128} height={50} className="w-24 sm:w-32 h-auto object-contain" unoptimized />
        </div>
        <div className="w-16 sm:w-20" />
      </nav>

      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] sm:max-w-[500px]">
          <div className="rounded-[20px] sm:rounded-[24px] bg-white shadow-2xl shadow-black/50 border border-white/10 p-6 sm:p-9">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-[26px] sm:text-3xl font-black uppercase tracking-[0.04em] text-slate-900 mb-2">{title}</h1>
              <p className="text-sm sm:text-[15px] text-slate-500">{sub}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}