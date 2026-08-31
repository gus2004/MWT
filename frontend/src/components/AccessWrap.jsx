"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AccessWrap({ children, title, sub, onBack }) {
  return (
    <div className="min-h-screen bg-[#08111F] flex flex-col" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={14} />
          <span className="text-xs font-black uppercase tracking-[0.1em]">Volver</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M12 3L22 21H2Z" opacity=".4" /><path d="M12 8L19 20H5Z" /></svg>
          </div>
          <span className="text-sm font-black uppercase tracking-[0.15em] text-white">MWT</span>
        </div>
        <div className="w-16" />
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            <h1 className="text-xl font-black uppercase tracking-[0.05em] text-white mb-1">{title}</h1>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}