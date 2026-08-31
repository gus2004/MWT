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

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [roleText, setRoleText] = useState("");
  const [unread, setUnread] = useState(0);
  const [userName, setUserName] = useState("");
  const [modules, setModules] = useState(() => {
    let u = null;
    try {
      if (typeof window !== "undefined") u = JSON.parse(window.localStorage.getItem("mwt_user") || "null");
    } catch {
      u = null;
    }
    return getAccessibleModules(u);
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mwt_user");
      if (raw) setUserName(JSON.parse(raw)?.nombre || JSON.parse(raw)?.username || "");
    } catch {
      setUserName("");
    }
  }, []);

  useEffect(() => {
    try {
      const user = getCurrentUser();
      const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : getUserRoles(user);
      if (!roles.length) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/me`, {
          headers: { Authorization: `Bearer ${decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "")}` },
        }).then(async (r) => (r.ok ? r.json() : null)).then((d) => {
          if (d) {
            const withRoles = { ...(d.usuario || d), roles: d.roles || d?.usuario?.roles };
            try {
              window.localStorage.setItem("mwt_user", JSON.stringify(withRoles));
            } catch { /* ignore */ }
            setRoleText(roleLabel(withRoles.roles));
            setModules(getAccessibleModules(withRoles));
          } else {
            setRoleText("Staff MWT");
          }
        }).catch(() => setRoleText("Staff MWT"));
        return;
      }
      setRoleText(roleLabel(roles));
      setModules(getAccessibleModules(user));
    } catch {
      setRoleText("Staff MWT");
    }
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/soporte/notificaciones`, {
      headers: { Authorization: `Bearer ${decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "")}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUnread((d?.items || []).filter((n) => !n.leida).length))
      .catch(() => setUnread(0));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("mwt_sidebar_open") || "[]");
      if (Array.isArray(saved)) setExpandedGroups(saved);
    } catch {
      setExpandedGroups([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mwt_sidebar_open", JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const onLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const sidebar = (
    <aside className="w-[268px] h-full shrink-0 bg-sidebar border-r border-border flex flex-col">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 3L22 21H2Z" opacity=".4" /><path d="M12 8L19 20H5Z" /></svg>
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-sidebar-text leading-none">MWT</div>
              <div className="text-[10px] text-slate-500 mt-1">Centro de control</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-[10px] px-3.5 py-[9px] text-[11px] font-bold uppercase tracking-[0.04em] transition-colors ${
            isActive("/dashboard") ? "bg-sidebar-accent text-white" : "text-sidebar-text hover:bg-sidebar-accent/60"
          }`}
        >
          <LayoutDashboard size={15} />
          Página principal
        </Link>

        <div className="px-3.5 pt-4 pb-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">Módulos</div>

        {modules.map((group) => {
          const Icon = MODULE_ICONS[group.key] || LayoutDashboard;
          const href = groupHref(group);
          const active = isActive(href);
          const childActive = group.children.some((c) => isActive(`/dashboard/${c.key}`));
          const hasChildren = group.children.length > 0;
          const expanded = hasChildren && (expandedGroups.includes(group.key) || childActive);

          return (
            <div key={group.key}>
              <div className={`flex items-center rounded-[10px] transition-colors ${active || childActive ? "bg-sidebar-accent text-white" : "text-sidebar-text hover:bg-sidebar-accent/60"}`}>
                <Link href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 flex-1 min-w-0 px-3.5 py-[9px] text-[11px] font-bold uppercase tracking-[0.04em]">
                  <Icon size={15} />
                  <span className="flex-1 truncate">{group.label}</span>
                </Link>
                {hasChildren ? (
                  <button
                    aria-label={`${expanded ? "Contraer" : "Expandir"} ${group.label}`}
                    onClick={() => toggleGroup(group.key)}
                    className="pr-3 pl-1 py-3 shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <ChevronRight size={12} className="pr-3 opacity-40 mr-0.5" />
                )}
              </div>

              {hasChildren ? (
                <div className={`pl-[19px] ml-3 border-l border-border/60 mt-0.5 mb-1 overflow-hidden transition-all ${expanded ? "max-h-[340px] opacity-100" : "max-h-0 opacity-0"}`}>
                  {group.children.map((child) => {
                    const ch = childHref(group, child);
                    const cActive = isActive(ch);
                    return (
                      <Link
                        key={child.key}
                        href={ch}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2 rounded-[8px] mt-0.5 px-3 py-[7px] text-[10px] font-bold uppercase tracking-[0.04em] transition-colors ${
                          cActive ? "bg-sidebar-accent/20 text-sidebar-text" : "text-sidebar-text/60 hover:bg-sidebar-accent/20 hover:text-sidebar-text"
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full shrink-0 ${cActive ? "bg-sidebar-accent" : "bg-slate-600"}`} />
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

      <div className="px-6 py-5 border-t border-border space-y-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 mb-2">Sesión activa</div>
          <Link
            href="/dashboard/perfil"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-sidebar-text hover:bg-sidebar-accent/60 transition-colors"
          >
            <User size={15} />
            Mi perfil
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 mb-2">Redes sociales</div>
          <div className="flex gap-2">
            {["IG", "FB", "WA"].map((s) => (
              <span key={s} className="w-9 h-9 rounded-full bg-sidebar-accent/40 text-sidebar-text text-[9px] font-black flex items-center justify-center">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="hidden lg:block h-full">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setOpen(true)} className="lg:hidden text-foreground/70 hover:text-foreground">
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Sistema interno</div>
              <div className="text-sm font-black uppercase tracking-[0.05em] text-foreground truncate">Panel de control</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-500 bg-emerald-500/10 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistema online
            </div>
            <ThemeToggle className="flex items-center" labelClassName="hidden" buttonClassName="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/70 hover:text-foreground bg-muted rounded-full px-3 py-1.5 transition-colors" />
            <button
              onClick={() => { router.push("/dashboard/notificaciones"); setOpen(false); }}
              className="relative w-9 h-9 rounded-[10px] border border-border flex items-center justify-center text-foreground/70 hover:text-foreground"
              aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
            >
              <Bell size={14} />
              {unread > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-black text-foreground leading-tight">{userName || "Operador"}</div>
                <div className="text-[10px] text-slate-500">{roleText}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}