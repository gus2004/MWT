"use client";

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

export function Btn({ children, onClick, variant = "primary", disabled, type = "button", className = "", sm }) {
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