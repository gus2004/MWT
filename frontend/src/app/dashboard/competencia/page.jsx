"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Trophy, Medal, Clock, BarChart3, Users, Zap, Calendar, ClipboardList, Shield, ChevronRight, Target } from "lucide-react";
import { Btn, Card, Badge, Kpi } from "@/components/kit";
import { getCurrentUser } from "@/lib/soporteApi";

const SUBMODULES = [
  { key: "clasificaciones", label: "CLASIFICACIONES", icon: Medal, href: "/dashboard/clasificaciones", desc: "Ingreso de tiempos, parrilla y tabla oficial", color: "blue" },
  { key: "resultados", label: "RESULTADOS", icon: Trophy, href: "/dashboard/resultados", desc: "Posiciones, tiempos y puntos por categoría", color: "amber" },
];

const QUICK_STATS = [
  { label: "Eventos activos", value: "3", icon: Calendar, color: "blue", trend: "+12%" },
  { label: "Pilotos inscritos", value: "156", icon: Users, color: "cyan", trend: "+8%" },
  { label: "Mangas completadas", value: "24", icon: Flag, color: "amber", trend: "+5%" },
  { label: "Categorías", value: "6", icon: Target, color: "violet", trend: "—" },
];

const RECENT_ACTIVITY = [
  { type: "heat", label: "Manga 1 completada", detail: "125cc Stock - Evento ACMG 2024", time: "Hace 2 horas", color: "green" },
  { type: "classification", label: "Clasificación finalizada", detail: "Moto3 - Campeonato Nacional", time: "Hace 5 horas", color: "blue" },
  { type: "results", label: "Resultados publicados", detail: "Stock 600 - Fecha 3", time: "Ayer", color: "amber" },
  { type: "heat", label: "Manga 2 iniciada", detail: "Supersport - Fecha 2", time: "Ayer", color: "green" },
];

export default function CompetenciaPage() {
  const [stats] = useState({
    totalEvents: 3,
    totalPilots: 156,
    completedHeats: 24,
    activeCategories: 6,
  });
  getCurrentUser();

  const statCards = [
    { label: "Eventos del campeonato", value: stats.totalEvents, icon: Calendar, accent: "blue", sub: "2 en curso" },
    { label: "Pilotos inscritos", value: stats.totalPilots, icon: Users, accent: "cyan", sub: "12 nuevos esta semana" },
    { label: "Mangas completadas", value: stats.completedHeats, icon: Flag, accent: "amber", sub: "4 pendientes" },
    { label: "Categorías activas", value: stats.activeCategories, icon: Target, accent: "violet", sub: "Todas con inscritos" },
  ];

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Operación de carrera</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">COMPETENCIA</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cada categoría compite 2 mangas y clasifica 1 vez (qualy). La Manga 2 sale de las posiciones de la Manga 1.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Sistema online</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Kpi key={s.label} icon={<s.icon size={15} />} label={s.label} value={s.value} accent={s.accent} sub={s.sub} />
        ))}
      </div>

      <Card title="Módulos de Competencia" sub="Acceso rápido a las secciones operativas">
        <div className="grid md:grid-cols-2 gap-4">
          {SUBMODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.key} href={mod.href} className="group relative bg-card border border-border rounded-[16px] p-5 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-[12px] bg-${mod.color}-500/10 text-${mod.color}-600 flex items-center justify-center group-hover:bg-${mod.color}-500/20 transition-colors`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black uppercase tracking-[0.04em] text-foreground group-hover:text-primary transition-colors">{mod.label}</h3>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{mod.desc}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={mod.color === "blue" ? "blue" : "amber"}>Ir al módulo</Badge>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Resumen rápido" sub="Métricas clave del campeonato">
          <div className="space-y-3">
            {QUICK_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-[12px] bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`w-10 h-10 rounded-[10px] bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{stat.label}</div>
                    <div className="text-xl font-black text-foreground">{stat.value}</div>
                  </div>
                  <span className={`text-[10px] font-bold ${stat.trend.startsWith("+") ? "text-emerald-600" : "text-slate-400"}`}>{stat.trend}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Actividad reciente" sub="Últimas acciones en operación de carrera">
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-[8px] bg-${act.color}-500/10 text-${act.color}-600 flex items-center justify-center`}>
                  {act.type === "heat" && <Flag size={14} />}
                  {act.type === "classification" && <Medal size={14} />}
                  {act.type === "results" && <Trophy size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{act.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{act.detail}</div>
                </div>
                <span className="text-[9px] text-slate-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Accesos directos" sub="Navegación rápida a otras áreas del sistema">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Inscripciones", href: "/dashboard/inscripciones", icon: ClipboardList, color: "blue" },
            { label: "Pilotos", href: "/dashboard/pilotos", icon: Users, color: "cyan" },
            { label: "Motos", href: "/dashboard/motos", icon: Zap, color: "amber" },
            { label: "Eventos", href: "/dashboard/eventos", icon: Calendar, color: "violet" },
            { label: "Horarios", href: "/dashboard/horarios", icon: Clock, color: "indigo" },
            { label: "Comisariato", href: "/dashboard/comisario", icon: Shield, color: "rose" },
            { label: "Reportes", href: "/dashboard/reportes", icon: BarChart3, color: "green" },
            { label: "Mantenimiento", href: "/dashboard/mantenimiento", icon: Zap, color: "slate" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="group">
              <Btn variant="secondary" sm className="gap-2 justify-start">
                <item.icon size={13} className={`group-hover:text-${item.color}-600 transition-colors`} />
                <span>{item.label}</span>
              </Btn>
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}
