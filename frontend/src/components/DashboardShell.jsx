"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy, Medal, Clock, BarChart3, Shield, ClipboardList, Wrench,
  LayoutDashboard, Bell, LogOut, Menu, X, User, ChevronDown, ChevronRight,
  Calendar, Users, Zap, Flag,
} from "lucide-react";
import { getAccessibleModules, getUserRoles, childHref, groupHref } from "@/lib/modules";
import { clearAuthSession } from "@/lib/auth";
import { getCurrentUser } from "@/lib/soporteApi";
import ThemeToggle from "@/app/theme-toggle";

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

const ROLE_LABELS = {
  ADMIN: "Administrador",
  COMISARIO: "Comisariato",
  JUEZ_MESA: "Juez de mesa",
  STAFF_TECNICO: "Staff técnico",
  PILOTO: "Piloto",
};

function roleLabel(roles) {
  if (!Array.isArray(roles) || !roles.length) return "Staff MWT";
  return ROLE_LABELS[roles[0]] || roles[0];
}

const isActiveRoute = (pathname, href) => {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
};

const getChildActiveHref = (group, child) => childHref(group, child);

// Client-side initializers - only run on client
function getInitialModules() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("mwt_user");
    if (raw) return getAccessibleModules(JSON.parse(raw));
  } catch { /* ignore */ }
  return [];
}

function getInitialUserName() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("mwt_user");
    if (raw) return JSON.parse(raw)?.nombre || JSON.parse(raw)?.username || "";
  } catch { /* ignore */ }
  return "";
}

function getInitialExpandedGroups() {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem("mwt_sidebar_open") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { /* ignore */ }
  return [];
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(getInitialExpandedGroups);
  const [roleText, setRoleText] = useState("");
  const [unread, setUnread] = useState(0);
  const [userName, setUserName] = useState(getInitialUserName);
  const [modules, setModules] = useState(getInitialModules);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem("mwt_user");
      if (raw) setModules(getAccessibleModules(JSON.parse(raw)));
    } catch { /* ignore */ }
    try {
      const raw = window.localStorage.getItem("mwt_user");
      if (raw) setUserName(JSON.parse(raw)?.nombre || JSON.parse(raw)?.username || "");
    } catch { /* ignore */ }
    try {
      const saved = JSON.parse(window.localStorage.getItem("mwt_sidebar_open") || "[]");
      if (Array.isArray(saved)) setExpandedGroups(saved);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const token = (document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/me`, {
      headers: { Authorization: `Bearer ${decodeURIComponent(token)}` },
    })
      .then(async (r) => { if (!r.ok) throw { status: r.status }; return r.json(); })
      .then((d) => {
        if (d && d.esta_activo === false) { clearAuthSession(); router.replace("/login"); return; }
        const withRoles = { ...(d.usuario || d), roles: d.roles || d?.usuario?.roles || getUserRoles(d) };
        try { window.localStorage.setItem("mwt_user", JSON.stringify(withRoles)); } catch { }
        setRoleText(roleLabel(withRoles.roles));
        setModules(getAccessibleModules(withRoles));
        setUserName(withRoles.nombre || withRoles.username || "");
      })
      .catch(() => { if (getCurrentUser()) { clearAuthSession(); router.replace("/login"); } });
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/soporte/notificaciones`, {
      headers: { Authorization: `Bearer ${decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "")}` },
    }).then((r) => (r.ok ? r.json() : null)).then((d) => setUnread((d?.items || []).filter((n) => !n.leida).length)).catch(() => setUnread(0));
  }, []);

  useEffect(() => {
    if (mounted) window.localStorage.setItem("mwt_sidebar_open", JSON.stringify(expandedGroups));
  }, [expandedGroups, mounted]);

  const onLogout = () => { clearAuthSession(); router.replace("/login"); };

  // Render skeleton on server (mounted === false) to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-screen flex overflow-hidden bg-background text-foreground" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <aside className="w-[360px] h-full shrink-0 bg-sidebar border-r border-border" />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 shrink-0 bg-card border-b border-border" />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  const sidebar = (
    <aside className="w-[360px] h-full shrink-0 bg-sidebar border-r border-border flex flex-col">
      {/* Brand Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 3L22 21H2Z" opacity=".4" /><path d="M12 8L19 20H5Z" /></svg>
          </div>
          <div>
            <div className="text-base font-black uppercase tracking-[0.18em] text-sidebar-text leading-none">MWT</div>
            <div className="text-[10px] text-sidebar-text/70 mt-0.5 font-medium">Centro de control</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden mt-3 w-full text-sidebar-text hover:text-sidebar-accent text-left py-1.5 text-sm"><X size={18} /> Cerrar menú</button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className={`flex flex-col items-center gap-1.5 rounded-[10px] px-3 py-2.5 text-center transition-all ${isActiveRoute(pathname, "/dashboard") ? "bg-sidebar-accent/15 text-sidebar-accent shadow-lg shadow-sidebar-accent/20" : "text-sidebar-text hover:bg-sidebar-accent/10"}`}
        >
          <div className="w-9 h-9 rounded-[8px] bg-sidebar-accent/15 text-sidebar-accent flex items-center justify-center">
            <LayoutDashboard size={20} />
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.05em]">Página principal</span>
        </Link>

        <div className="px-2 pt-3 pb-1 text-[8px] font-black uppercase tracking-[0.2em] text-sidebar-text/50 text-center">Módulos</div>

        {modules.map((group) => {
          const Icon = MODULE_ICONS[group.key] || LayoutDashboard;
          const href = groupHref(group);
          const active = isActiveRoute(pathname, href);
          const childActive = group.children.some((c) => isActiveRoute(pathname, getChildActiveHref(group, c)));
          const hasChildren = group.children.length > 0;
          const expanded = hasChildren && expandedGroups.includes(group.key);

          // Handle click: navigate AND toggle expansion
          const handleModuleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(href);
            setOpen(false);
            if (hasChildren) {
              setExpandedGroups((prev) => {
                if (prev.includes(group.key)) {
                  return prev.filter((k) => k !== group.key);
                }
                return [group.key];
              });
            }
          };

          return (
            <div key={group.key}>
              <div
                className={`flex flex-col items-center gap-1.5 rounded-[10px] transition-all duration-200 cursor-pointer px-3 py-2.5 ${active || childActive ? "bg-sidebar-accent/15 text-sidebar-accent shadow-lg shadow-sidebar-accent/20" : "text-sidebar-text hover:bg-sidebar-accent/10"}`}
                onClick={handleModuleClick}
              >
                <div className="flex flex-col items-center gap-1.5 pointer-events-none w-full">
                  <div className="w-9 h-9 rounded-[8px] bg-sidebar-accent/15 text-sidebar-accent flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-center leading-tight">{group.label}</span>
                </div>

                {hasChildren ? (
                  <span className="pr-1.5 py-0.5 shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
                    <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                  </span>
                ) : null}
              </div>

              {hasChildren ? (
                <div className={`mt-0.5 ml-1.5 border-l border-border/30 overflow-hidden transition-all duration-300 ${expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  {group.children.map((child) => {
                    const ch = childHref(group, child);
                    const cActive = isActiveRoute(pathname, ch);
                    return (
                      <Link
                        key={child.key}
                        href={ch}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-1.5 rounded-[8px] mt-0.5 px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.05em] transition-all ${cActive ? "bg-sidebar-accent/15 text-sidebar-accent" : "text-sidebar-text/70 hover:bg-sidebar-accent/10 hover:text-sidebar-text"}`}
                      >
                        <span className={`w-1 h-1 rounded-full shrink-0 ${cActive ? "bg-sidebar-accent" : "bg-sidebar-text/40"}`} />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* Compact Footer - User Session */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center justify-center gap-4 px-2 py-2">
          <Link
            href="/dashboard/perfil"
            onClick={() => setOpen(false)}
            className="flex flex-col items-center gap-1 rounded-[8px] px-3 py-2 text-center transition-all text-sidebar-text/70 hover:text-sidebar-text hover:bg-sidebar-accent/10"
            title="Mi perfil"
          >
            <div className="w-8 h-8 rounded-[8px] bg-sidebar-accent/15 text-sidebar-accent flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-[8px] font-semibold uppercase tracking-[0.05em]">Perfil</span>
          </Link>
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 rounded-[8px] px-3 py-2 text-center transition-all text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
            title="Cerrar sesión"
          >
            <div className="w-8 h-8 rounded-[8px] bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <LogOut size={16} />
            </div>
            <span className="text-[8px] font-semibold uppercase tracking-[0.05em]">Salir</span>
          </button>
        </div>
        <div className="flex justify-center gap-1.5 pt-2">
          {["IG", "FB", "WA"].map((s) => (
            <button
              key={s}
              className="w-7 h-7 rounded-[6px] bg-sidebar-accent/10 text-sidebar-text/60 text-[7px] font-black flex items-center justify-center hover:bg-sidebar-accent/20 hover:text-sidebar-text transition-all"
              aria-label={s}
              title={s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="hidden lg:block h-full">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setOpen(true)} className="lg:hidden text-foreground/70 hover:text-foreground p-2 rounded-[10px] hover:bg-muted"><Menu size={20} /></button>
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Sistema interno MWT</div>
              <div className="text-sm font-black uppercase tracking-[0.04em] text-foreground truncate">Panel de control</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-500 bg-emerald-500/10 rounded-full px-3 py-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sistema online</div>
            <ThemeToggle className="flex items-center" labelClassName="hidden" buttonClassName="text-[10px] font-bold uppercase tracking-[0.08em] text-foreground/70 hover:text-foreground bg-muted rounded-full px-3 py-1.5 transition-colors" />
            <button
              onClick={() => { router.push("/dashboard/notificaciones"); setOpen(false); }}
              className="relative w-9 h-9 rounded-[10px] border border-border flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
              aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
            >
              <Bell size={16} />
              {unread > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-black text-foreground leading-tight">{userName || "Operador"}</div>
                <div className="text-[10px] text-muted-foreground">{roleText}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
