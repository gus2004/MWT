"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Flag, ChevronLeft, ChevronRight } from "lucide-react";

function formatFecha(inicio, fin) {
  if (!inicio) return "Fecha por definir";
  const f1 = new Date(inicio).toLocaleDateString("es-ES", { day: "2-digit", month: "long" });
  if (!fin) return f1;
  const f2 = new Date(fin).toLocaleDateString("es-ES", { day: "2-digit", month: "long" });
  return `${f1} · ${f2}`;
}

function formatOrganizer(value) {
  if (!value) return "MWT Motorsport";
  return String(value).trim();
}

const STATUS_LABEL = {
  planificado: "Programado",
  publicado: "Publicado",
  en_curso: "En curso",
  finalizado: "Finalizado",
};

export default function EventCarousel({ eventos }) {
  const slides = useMemo(() => (Array.isArray(eventos) ? eventos : []), [eventos]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[activeIndex] || null;
  const organizer = formatOrganizer(current?.organizador).toLowerCase();
  const brand = organizer.includes("yamaha")
    ? { src: "/Yamaha-Logо.png", label: "Yamaha" }
    : organizer.includes("acmg")
      ? { src: "/LOGO-ACMG.png", label: "ACMG" }
      : { src: "/MWT - COLORS.png", label: "MWT Motorsport" };

  const goTo = (nextIndex) => {
    if (!slides.length) return;
    setActiveIndex((nextIndex + slides.length) % slides.length);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      {slides.length === 0 ? (
        <article className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center col-span-full">
          <strong className="block text-slate-700 mb-1">Aún no hay eventos públicos.</strong>
          <span className="text-sm text-slate-400">Cuando se publique una fecha, aparecerá aquí.</span>
        </article>
      ) : (
        <>
          {/* Card destacada */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Brand rack */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-16 bg-white/95 rounded-[14px] border border-white/20 px-4 flex items-center justify-center shadow-sm">
                <Image src={brand.src} alt={`Logo ${brand.label}`} width={140} height={64} className="w-auto h-12 object-contain" unoptimized />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 bg-white/15 px-2.5 py-1 rounded-full">Evento destacado</span>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80 bg-white/10 px-2.5 py-1 rounded-full">{activeIndex + 1} / {slides.length}</span>
            </div>

            <h3 className="text-2xl font-black text-white mb-4">{current.nombre}</h3>
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <Calendar size={13} /><span>{formatFecha(current.fechaInicio, current.fechaFin)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <MapPin size={13} /><span>{formatOrganizer(current.organizador)}</span>
              </div>
            </div>
            <div className="text-sm text-blue-100 mb-6">{`Organizado por ${formatOrganizer(current.organizador)}.`}</div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} aria-label={`Ir al evento ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "bg-white w-6" : "bg-white/30 w-1.5"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => goTo(activeIndex - 1)} aria-label="Evento anterior"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all"><ChevronLeft size={14} /></button>
                <button onClick={() => goTo(activeIndex + 1)} aria-label="Siguiente evento"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* Miniaturas */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] lg:max-h-none lg:overflow-visible">
            {slides.map((e, i) => (
              <button key={e.id} onClick={() => goTo(i)}
                className={`text-left p-4 rounded-[16px] border transition-all ${i === activeIndex ? "bg-white border-blue-300 shadow-md" : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${i === activeIndex ? "bg-blue-600" : "bg-slate-100"}`}>
                    <Flag size={13} className={i === activeIndex ? "text-white" : "text-slate-400"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-black truncate ${i === activeIndex ? "text-blue-700" : "text-slate-800"}`}>{e.nombre}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatFecha(e.fechaInicio, e.fechaFin)}</div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-[0.06em] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{formatOrganizer(e.organizador)}</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.06em] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{STATUS_LABEL[e.estado] || "Próximo"}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}