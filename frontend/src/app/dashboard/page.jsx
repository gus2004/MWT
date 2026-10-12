"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, Clock, BarChart3, Shield, ClipboardList, Wrench, ArrowUpRight, Users, Flag, Wallet, Bell, Calendar, Zap } from "lucide-react";
import { Kpi } from "@/components/kit";
import { soporteApi } from "@/lib/soporteApi";
import { getAccessibleModules, groupHref, childHref } from "@/lib/modules";

const MODULE_ICONS = {
  resultados: Trophy,
  clasificaciones: Medal,
  horarios: Clock,
  reportes: BarChart3,
  comisario: Shield,
  inscripciones: ClipboardList,
  mantenimiento: Wrench,
  eventos: Calendar,
  pilotos: Users,
  motos: Zap,
  competencia: Flag,
  notificaciones: Bell,
};

export default function DashboardPage() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [modGroups, setModGroups] = useState(() => {
    // Initialize from localStorage on client side to avoid hydration mismatch
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("mwt_user");
      if (raw) return getAccessibleModules(JSON.parse(raw));
    } catch { /* ignore */ }
    return [];
  });
  const kpis = resumen?.kpis;

  useEffect(() => {
    const token = typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const user = { ...(d.usuario || d), roles: d.roles || d?.usuario?.roles };
        try {
          window.localStorage.setItem("mwt_user", JSON.stringify(user));
        } catch { /* ignore */ }
        setModGroups(getAccessibleModules(user));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    soporteApi.getResumenReportes().then(setResumen).catch((e) => setError(e?.message || "No se pudo cargar el resumen."));
  }, []);

  if (modGroups.length === 0 && !resumen) {
    return (
      <main className="p-6 lg:p-8 space-y-9">
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi icon={<Users size={15} />} label="Participantes" value="..." note="Pilotos registrados" accent="blue" />
          <Kpi icon={<Flag size={15} />} label="Eventos" value="..." note="..." accent="violet" />
          <Kpi icon={<Wallet size={15} />} label="Ingresos (Q)" value="..." note="Pagos confirmados" accent="green" />
          <Kpi icon={<Bell size={15} />} label="Sanciones" value="..." note="Registradas en comisariato" accent="amber" />
        </section>
        <section>
          <div className="mb-5">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Accesos rápidos</div>
            <h2 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">Módulos del sistema</h2>
            <p className="text-xs text-slate-500 mt-1">Los módulos principales con sus subsecciones dependientes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-[16px] p-5 animate-pulse space-y-3">
              <div className="h-5 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
            <div className="bg-card border border-border rounded-[16px] p-5 animate-pulse space-y-3">
              <div className="h-5 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8 space-y-9">
      {error ? <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-[10px] px-3 py-2">{error}</p> : null}

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={<Users size={15} />} label="Participantes" value={kpis ? String(kpis.participantes) : "..."} note="Pilotos registrados" accent="blue" />
        <Kpi icon={<Flag size={15} />} label="Eventos" value={kpis ? String(kpis.eventos) : "..."} note={`${kpis?.proximos ?? "?"} próximos`} accent="violet" />
        <Kpi icon={<Wallet size={15} />} label="Ingresos (Q)" value={kpis ? `Q${(kpis.ingresos || 0).toLocaleString("es-GT", { maximumFractionDigits: 0 })}` : "..."} note="Pagos confirmados" accent="green" />
        <Kpi icon={<Bell size={15} />} label="Sanciones" value={kpis ? String(kpis.sanciones) : "..."} note="Registradas en comisariato" accent="amber" />
      </section>

      <section>
        <div className="mb-5">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Accesos rápidos</div>
          <h2 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">Módulos del sistema</h2>
          <p className="text-xs text-slate-500 mt-1">Los módulos principales con sus subsecciones dependientes.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {modGroups.map((group, index) => {
            const Icon = MODULE_ICONS[group.key] || Trophy;
            const href = groupHref(group);
            return (
              <div key={group.key} className="bg-card border border-border rounded-[16px] p-5 hover:border-blue-400/40 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-blue-600/10 text-blue-600 flex items-center justify-center">
                      <Icon size={17} />
                    </div>
                    <span className="text-[10px] font-black text-slate-300">0{index + 1}</span>
                  </div>
                  <Link
                    href={href}
                    className="group/link inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.1em] text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Abrir <ArrowUpRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <Link href={href}>
                  <h3 className="text-sm font-black uppercase tracking-[0.04em] text-foreground mb-1.5 hover:text-blue-600 transition-colors">{group.label}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{group.description}</p>
                </Link>
                {group.children.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.children.map((child) => (
                      <Link
                        key={child.key}
                        href={childHref(group, child)}
                        className="rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] hover:bg-blue-600/10 hover:text-blue-600 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[20px] p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200 mb-2">Acceso rápido</div>
          <h3 className="text-base font-black uppercase tracking-[0.04em] text-white mb-1">Saltar directo al módulo principal</h3>
          <p className="text-xs text-blue-100">{modGroups[0] ? modGroups[0].description : "Módulos disponibles según tu rol."}</p>
        </div>
        {modGroups[0] ? (
          <Link
            href={`/dashboard/${modGroups[0].key}`}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-[12px] bg-white text-blue-700 text-xs font-black uppercase tracking-[0.12em] px-6 py-3.5 hover:bg-blue-50 transition-all"
          >
            Abrir módulo
            <ArrowUpRight size={14} />
          </Link>
        ) : null}
      </section>
    </main>
  );
}
