"use client";

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
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white"><path d="M12 3L22 21H2Z" opacity=".4" /><path d="M12 8L19 20H5Z" /></svg>
          </div>
          <span className="text-sm sm:text-base font-black uppercase tracking-[0.15em] text-white">MWT</span>
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