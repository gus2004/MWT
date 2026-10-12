"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BADGE_STYLES = {
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  error: "bg-rose-500/10 text-rose-600",
  blue: "bg-blue-500/10 text-blue-600",
  cyan: "bg-cyan-500/10 text-cyan-600",
  indigo: "bg-indigo-500/10 text-indigo-600",
  gray: "bg-slate-500/10 text-slate-500",
};

export function Badge({ variant = "gray", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${BADGE_STYLES[variant] || BADGE_STYLES.gray} ${className}`}>
      {children}
    </span>
  );
}

export function Kpi({ label, value, sub, accent = "blue" }) {
  const accentMap = {
    blue: "bg-blue-600/10 text-blue-600",
    cyan: "bg-cyan-600/10 text-cyan-600",
    green: "bg-emerald-600/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-600/10 text-violet-600",
    rose: "bg-rose-500/10 text-rose-600",
  };
  return (
    <div className="bg-card border border-border rounded-[16px] p-5">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 mb-3">{label}</div>
      <div className={`text-2xl font-black tracking-tight ${accentMap[accent] || accentMap.blue} inline-block rounded-[10px] px-2.5 py-0.5`}>{value}</div>
      {sub ? <div className="text-[11px] text-slate-500 mt-1.5">{sub}</div> : null}
    </div>
  );
}

export function Card({ children, className = "", title, sub, actions }) {
  return (
    <section className={`bg-card border border-border rounded-[16px] p-5 ${className}`}>
      {(title || actions) ? (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title ? <h3 className="text-sm font-black uppercase tracking-[0.04em] text-foreground">{title}</h3> : null}
            {sub ? <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Modal({ open, onClose, title, sub, children, footer, size = "md" }) {
  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size] || "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-card border border-border rounded-[20px] shadow-2xl w-full ${width} max-h-[92vh] flex flex-col`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-black uppercase tracking-[0.04em] text-foreground">{title}</h2>
            {sub ? <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p> : null}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[10px] border border-border flex items-center justify-center text-slate-500 hover:text-foreground transition-colors" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1.5">{label}</span>
      {children}
      {error ? <span className="block text-[11px] text-rose-500 mt-1">{error}</span> : null}
      {hint ? <span className="block text-[11px] text-slate-400 mt-1">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "w-full rounded-[12px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all";

export const selectCls = inputCls + " appearance-none";

// Agrupa opciones bajo encabezados (ej. eventos por campeonato/serie).
// `groups = [{ label, options }]` y `options` son mutuamente alternativos;
// si se pasa `groups`, se renderizan con encabezados y el buscador filtra dentro.
export function SearchSelect({
  options = [],
  groups = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  keepOpenOnSelect = false,
  clearable = false,
  inputClassName = "",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(() => {
    for (const o of options) {
      if (String(o.value) === String(value)) return o;
    }
    for (const g of groups) {
      const found = g.options.find((o) => String(o.value) === String(value));
      if (found) return found;
    }
    return null;
  }, [options, groups, value]);

  // Lista plana con encabezados intercalados para render y navegación por teclado.
  // En modo agrupado, la búsqueda matchea también el label del grupo (nombre de la serie).
  const flatItems = useMemo(() => {
    const t = q.trim().toLowerCase();
    const match = (text) => !t || String(text || "").toLowerCase().includes(t);
    if (groups.length) {
      const items = [];
      groups.forEach((g) => {
        const groupHits = match(g.label);
        const opts = g.options.filter((o) => groupHits || match(o.label)).slice(0, 200);
        if (groupHits || opts.length) {
          items.push({ kind: "header", key: `h:${g.label}`, label: g.label });
          opts.forEach((o) => items.push({ kind: "opt", ...o }));
        }
      });
      return items;
    }
    const base = t ? options.filter((o) => match(o.label)) : options;
    return base.slice(0, 200).map((o) => ({ kind: "opt", ...o }));
  }, [options, groups, q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  const select = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setQ("");
    setActive(-1);
    setOpen(keepOpenOnSelect);
    if (keepOpenOnSelect) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const nextOpt = (from) => {
    for (let i = from + 1; i < flatItems.length; i++) {
      if (flatItems[i].kind === "opt") return i;
    }
    return flatItems.findIndex((it) => it.kind === "opt");
  };
  const prevOpt = (from) => {
    for (let i = from - 1; i >= 0; i--) {
      if (flatItems[i].kind === "opt") return i;
    }
    for (let i = flatItems.length - 1; i >= 0; i--) {
      if (flatItems[i].kind === "opt") return i;
    }
    return -1;
  };

  const onKey = (e) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); setOpen(true); setActive(-1); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => nextOpt(a)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => prevOpt(a)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const idx = active >= 0 ? active : flatItems.findIndex((it) => it.kind === "opt");
      const opt = idx >= 0 ? flatItems[idx] : null;
      if (opt && opt.kind === "opt") select(opt);
      return;
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        className={`${inputClassName || inputCls}${clearable && !disabled && value && !open ? " pr-9" : ""}`}
        value={open ? q : selected?.label || ""}
        placeholder={open ? searchPlaceholder : selected ? undefined : placeholder}
        disabled={disabled}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => { setOpen(true); setQ(""); setActive(-1); }}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {clearable && !disabled && value && !open ? (
        <button
          type="button"
          aria-label="Limpiar selección"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onChange?.(""); setQ(""); setActive(-1); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-foreground hover:bg-muted/60 transition-colors text-sm leading-none"
        >
          ✕
        </button>
      ) : null}
      {open ? (
        <div className="absolute z-40 mt-1 w-full max-h-64 overflow-y-auto rounded-[12px] border border-border bg-card shadow-xl p-1">
          {flatItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
          ) : (
            flatItems.map((it, i) =>
              it.kind === "header" ? (
                <div key={it.key} className="sticky top-0 z-10 bg-card px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {it.label}
                </div>
              ) : (
                <button
                  key={String(it.value)}
                  type="button"
                  disabled={it.disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(it)}
                  className={`w-full text-left px-3 py-2 rounded-[8px] text-xs font-bold transition-colors ${
                    it.disabled
                      ? "text-slate-400 cursor-not-allowed"
                      : i === active
                        ? "bg-blue-600 text-white"
                        : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  {it.label}
                </button>
              )
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, type = "button", className = "", sm, ...rest }) {
  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-600/40",
    gradient:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50",
    secondary:
      "border border-border bg-card hover:border-blue-400/40 text-foreground",
    danger: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20",
    ghost: "text-slate-500 hover:text-foreground hover:bg-muted",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-emerald-600/40",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[12px] font-black uppercase tracking-[0.08em] transition-all ${sm ? "text-[10px] px-3 py-2" : "text-[11px] px-4 py-2.5"} ${variants[variant] || variants.primary} disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] transition-colors border-b-2 -mb-px ${
            active === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title = "Sin datos", sub }) {
  return (
    <div className="rounded-[14px] border border-dashed border-border p-8 text-center">
      <div className="text-sm font-bold text-muted-foreground mb-1">{title}</div>
      {sub ? <div className="text-xs text-slate-400">{sub}</div> : null}
    </div>
  );
}

export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Paginator({ page, totalPages, onChange, total, shown }) {
  if (totalPages <= 1 && total === undefined) return null;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mt-4">
      <span className="text-[11px] text-slate-500">
        Mostrando {shown} de {total ?? 0} registros
      </span>
      <div className="flex items-center gap-1.5">
        <Btn variant="secondary" sm onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>←</Btn>
        <span className="text-[11px] font-bold text-foreground px-2">Página {page} de {totalPages}</span>
        <Btn variant="secondary" sm onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>→</Btn>
      </div>
    </div>
  );
}