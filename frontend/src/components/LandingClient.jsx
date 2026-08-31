"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText, Users, Flag, Shield, BarChart2, Bell, Calendar, MapPin,
  Zap, Trophy, ChevronLeft, ChevronRight, X, Check,
} from "lucide-react";
import EventCarousel from "../app/EventCarousel";

function formatFecha(inicio, fin) {
  if (!inicio) return "Fecha por definir";
  const f1 = new Date(inicio).toLocaleDateString("es-ES", { day: "2-digit", month: "long" });
  if (!fin) return f1;
  const f2 = new Date(fin).toLocaleDateString("es-ES", { day: "2-digit", month: "long" });
  return `${f1} → ${f2}`;
}

function formatOrganizer(value) {
  if (!value) return "MWT Motorsport";
  return String(value).trim();
}

const AREAS = [
  { n: 1, icon: FileText, titulo: "Inscripciones y pagos", desc: "Registro en línea, carga de documentos, seguimiento de estado y gestión de pagos." },
  { n: 2, icon: Users, titulo: "Pilotos y motos", desc: "Perfiles, licencias, documentación técnica y homologación de motos." },
  { n: 3, icon: Flag, titulo: "Competencia en pista", desc: "Parrillas, cronometraje en vivo y clasificaciones actualizadas al instante." },
  { n: 4, icon: Shield, titulo: "Comisariato con IA", desc: "Gestión de infracciones, análisis inteligente y sanciones con trazabilidad total." },
  { n: 5, icon: BarChart2, titulo: "Reportes", desc: "Estadísticas, exportaciones PDF/Excel y análisis completos de temporada." },
  { n: 6, icon: Bell, titulo: "Notificaciones", desc: "Alertas automáticas por correo, WhatsApp y plataforma en tiempo real." },
];

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function MwtLogo({ className = "w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-600" }) {
  return (
    <div className={`${className} flex items-center justify-center shadow-md shrink-0`}>
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 3L22 21H2Z" opacity=".4" /><path d="M12 8L19 20H5Z" /></svg>
    </div>
  );
}

function EventStatusBadge({ estado }) {
  const map = { planificado: "Programado", publicado: "Publicado" };
  const label = map[estado] || "Próximo";
  return (
    <span className="text-[8px] font-black uppercase tracking-[0.06em] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
      {label}
    </span>
  );
}

export default function LandingClient({ eventos }) {
  const [askOpen, setAskOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const nextEvents = useMemo(() => (Array.isArray(eventos) ? eventos.slice(0, 3) : []), [eventos]);
  const organizers = useMemo(
    () => Array.from(new Set(eventos.map((e) => formatOrganizer(e.organizador)))).filter(Boolean),
    [eventos]
  );

  const scrollTo = (id, label) => {
    setActiveSection(label || "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const monthOf = (fecha) => {
    if (!fecha) return "AGO";
    const m = new Date(fecha).getMonth();
    return MONTHS[m] || "AGO";
  };
  const dayOf = (fecha) => {
    if (!fecha) return "—";
    return String(new Date(fecha).getDate()).padStart(2, "0");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* ── Sticky Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between px-8 h-16">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <MwtLogo />
            <div>
              <div className="text-base font-black uppercase tracking-[0.2em] text-slate-900 leading-none">MWT</div>
              <div className="text-[7px] font-black uppercase tracking-[0.22em] text-blue-600 mt-0.5">MOTORSPORT</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[{ id: "quienes-somos", l: "Quiénes somos" }, { id: "calendario", l: "Calendario" }, { id: "sistema", l: "Áreas del sistema" }].map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id, s.l)}
                className={`text-sm font-bold uppercase tracking-[0.07em] transition-colors ${activeSection === s.l ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
              >
                {s.l}
              </button>
            ))}
            <Link href="/publico" className="text-sm font-bold uppercase tracking-[0.07em] text-blue-600 hover:text-blue-700 transition-colors">
              Estadísticas
            </Link>
          </nav>

          <button
            onClick={() => setAskOpen(true)}
            className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black uppercase tracking-[0.07em] hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all"
          >
            Ingresar
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-16 min-h-screen max-w-[1280px] mx-auto px-8 flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full py-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.15em] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Temporada 2026 en curso
            </div>
            <h1 className="text-5xl font-black uppercase tracking-[-0.02em] leading-[0.92] text-slate-900 mb-6">
              Calendario,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">inscripciones</span><br />
              y resultados<br />
              de la temporada
            </h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-md mb-8">
              La plataforma oficial del campeonato de motociclismo de Guatemala. Gestioná tu inscripción, seguí el calendario y revisá los resultados en tiempo real.
            </p>
            <div className="flex items-center gap-3 mb-12">
              <Link href="/register"
                className="px-6 py-3 rounded-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black uppercase tracking-[0.07em] hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all">
                Crear cuenta
              </Link>
              <Link href="/login"
                className="px-6 py-3 rounded-[10px] border-2 border-slate-200 text-slate-700 text-sm font-black uppercase tracking-[0.07em] hover:border-blue-300 hover:text-blue-600 transition-all">
                Iniciar sesión
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
              {[{ v: "2026", l: "Temporada" }, { v: String(eventos.length), l: "Eventos públicos" }, { v: organizers.length || "ACMG", l: "Organizadores" }].map((m) => (
                <div key={m.l}>
                  <div className="text-2xl font-black text-blue-600">{m.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-100/60 to-indigo-100/40 rounded-[32px] blur-2xl pointer-events-none" />
            <div className="absolute -top-4 -right-4 z-10 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white">● En vivo</div>
            </div>
            <div className="relative bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 mb-0.5">Próximos eventos</div>
                  <div className="text-base font-black text-white leading-tight">Temporada 2026</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20">
                    <Flag size={10} className="text-white" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.1em]">ACMG</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15">
                    <Zap size={10} className="text-yellow-300" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.08em]">Yamaha</span>
                  </span>
                </div>
              </div>

              <div className="px-6 py-2 divide-y divide-slate-100">
                {nextEvents.length === 0 && (
                  <div className="py-6 text-center text-sm text-slate-400">Cuando se publique una fecha, aparecerá aquí.</div>
                )}
                {nextEvents.map((e, i) => (
                  <div key={e.id} className="py-3.5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[10px] shrink-0 flex flex-col items-center justify-center ${i === 0 ? "bg-blue-600" : "bg-slate-100"}`}>
                      <span className={`text-[10px] font-black ${i === 0 ? "text-white" : "text-slate-500"}`}>{dayOf(e.fechaInicio)}</span>
                      <span className={`text-[8px] font-bold uppercase ${i === 0 ? "text-blue-200" : "text-slate-400"}`}>{monthOf(e.fechaInicio)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-black truncate ${i === 0 ? "text-blue-700" : "text-slate-800"}`}>{e.nombre}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={9} />{formatFecha(e.fechaInicio, e.fechaFin)}
                      </div>
                    </div>
                    <EventStatusBadge estado={e.estado} />
                  </div>
                ))}
              </div>

              <div className="px-6 pb-5">
                <Link href="/register"
                  className="w-full py-2.5 rounded-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black uppercase tracking-[0.07em] hover:from-blue-700 hover:to-indigo-700 shadow transition-all inline-flex items-center justify-center">
                  Inscribirse ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Áreas del sistema ── */}
      <section id="sistema" className="py-20 bg-slate-50">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-12">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Plataforma completa</div>
            <h2 className="text-3xl font-black uppercase tracking-[-0.01em] text-slate-900">Áreas del sistema</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {AREAS.map((a) => (
              <div key={a.titulo} className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <a.icon size={17} className="text-white" />
                  </div>
                  <span className="text-4xl font-black text-slate-100 group-hover:text-blue-100 transition-colors leading-none">{a.n}</span>
                </div>
                <div className="text-sm font-black text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">{a.titulo}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiénes somos ── */}
      <section id="quienes-somos" className="py-20">
        <div className="max-w-[1280px] mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Quiénes somos</div>
            <h2 className="text-3xl font-black uppercase tracking-[-0.01em] text-slate-900 mb-5">Most Wanted Team</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">Somos el equipo organizador del campeonato de motociclismo más dinámico de Guatemala. Desde 2019 impulsamos la disciplina, la seguridad y el espíritu competitivo en cada competencia.</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">Trabajamos junto a la ACMG y la FMG para establecer los más altos estándares de organización y seguridad en el deporte del motor.</p>
            <div className="grid grid-cols-3 gap-6">
              {[{ v: "7+", l: "Eventos/año" }, { v: "110+", l: "Pilotos activos" }, { v: "18", l: "Categorías" }].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-black text-blue-600 mb-1">{s.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { i: Trophy, l: "Campeonato oficial", d: "El MWT es el campeonato de motociclismo más dinámico de Guatemala, avalado por ACMG y FMG desde 2019.", c: "#2563EB" },
              { i: Calendar, l: "Información pública", d: "Calendario, resultados y clasificaciones disponibles sin necesidad de cuenta para toda la afición.", c: "#4F46E5" },
              { i: Shield, l: "Operación por rol", d: "Admin, Race Manager, Comisario, Staff Técnico y Piloto con accesos diferenciados y seguros.", c: "#16A34A" },
            ].map((c) => (
              <div key={c.l} className="flex items-start gap-4 bg-slate-50 rounded-[16px] border border-slate-200 p-5 hover:border-blue-200 hover:bg-blue-50/40 transition-all">
                <div className="w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center" style={{ background: `${c.c}18` }}>
                  <c.i size={16} style={{ color: c.c }} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 mb-1">{c.l}</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Próximos eventos carousel ── */}
      <section id="calendario" className="py-20 bg-slate-50">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Calendario</div>
            <h2 className="text-3xl font-black uppercase tracking-[-0.01em] text-slate-900">Próximos eventos</h2>
          </div>
          <EventCarousel eventos={eventos} />
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-[640px] mx-auto px-8 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-3">Plataforma oficial</div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.01em] text-white mb-5">Entrar al sistema</h2>
          <p className="text-sm text-blue-100 leading-relaxed mb-10">Gestioná tu inscripción, revisá el calendario de competencias y seguí la clasificación del campeonato en tiempo real.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login"
              className="px-8 py-3.5 rounded-[12px] bg-white text-blue-700 font-black uppercase tracking-[0.07em] hover:bg-blue-50 shadow-xl transition-all text-sm">
              Ingresar al sistema
            </Link>
            <Link href="/register"
              className="px-8 py-3.5 rounded-[12px] border-2 border-white/30 text-white font-black uppercase tracking-[0.07em] hover:bg-white/10 transition-all text-sm">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-100">
        <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-[0.12em]">© 2026 MWT Motorsport · ACMG · FMG · Guatemala</div>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Contacto"].map((l) => (
              <span key={l} className="text-[10px] text-slate-400 hover:text-blue-600 cursor-pointer transition-colors uppercase tracking-[0.1em] font-bold">{l}</span>
            ))}
            <Link href="/dashboard" className="text-[10px] text-blue-500 hover:text-blue-700 cursor-pointer transition-colors uppercase tracking-[0.1em] font-black border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-50">
              Sistema interno
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Modal ¿Cómo querés ingresar? ── */}
      {askOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={() => setAskOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-[20px] border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-black uppercase tracking-[0.08em] text-slate-900">¿Cómo querés ingresar?</h3>
              <button onClick={() => setAskOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={15} /></button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-3">
              <Link href="/login" className="text-left p-5 rounded-[14px] border-2 border-blue-600/25 bg-blue-50/60 hover:border-blue-600 hover:shadow-lg transition-all">
                <Shield size={26} className="text-blue-600 mb-3" />
                <div className="text-sm font-black uppercase tracking-[0.08em] text-slate-900 mb-1">Personal autorizado</div>
                <div className="text-xs text-slate-500 leading-relaxed">Administración, organización, comisariato y staff técnico. Ingresá con usuario y contraseña.</div>
              </Link>
              <Link href="/publico" className="text-left p-5 rounded-[14px] border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all">
                <Trophy size={26} className="text-amber-500 mb-3" />
                <div className="text-sm font-black uppercase tracking-[0.08em] text-slate-900 mb-1">Estadísticas públicas</div>
                <div className="text-xs text-slate-500 leading-relaxed">Para pilotos, fans y cualquier persona: resultados y estadísticas del campeonato. Sin registro ni información clasificada.</div>
              </Link>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setAskOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-[0.07em] hover:bg-slate-50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}