"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, List, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, Tabs, inputCls, selectCls } from "@/components/kit";
import { listEventos, publishEvento, saveDraftEvento, deleteEvento } from "@/lib/adminApi";
import { getCurrentUser } from "@/lib/soporteApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const ESTADO_BADGE = {
  BORRADOR: ["gray", "Borrador"],
  ABIERTO: ["cyan", "Inscripciones abiertas"],
  EN_CURSO: ["success", "En curso"],
  FINALIZADO: ["gray", "Finalizado"],
  CANCELADO: ["error", "Cancelado"],
};

const CICLO = ["BORRADOR", "ABIERTO", "EN_CURSO", "FINALIZADO", "CANCELADO"];

function fmtFecha(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("lista");
  const [calendar, setCalendar] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });
  const [modal, setModal] = useState(null); // {tipo:'crear'|'editar', evento}
  const [cronogramaDe, setCronogramaDe] = useState(null);
  const [cronograma, setCronograma] = useState([]);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listEventos();
      setEventos(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cambiarEstado = async (evento, estado) => {
    const usuario = getCurrentUser();
    try {
      const res = await fetch(`${API_URL}/api/eventos/${evento.id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}`,
        },
        body: JSON.stringify({ estado_nuevo: estado, usuario_id: usuario?.id || "" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      setEventos((cur) => cur.map((e) => (e.id === evento.id ? { ...e, estado } : e)));
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado.");
    }
  };

  const abrirCronograma = async (evento) => {
    setCronogramaDe(evento);
    setCronograma([]);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${evento.id}/cronograma`);
      if (res.ok) {
        const data = await res.json();
        setCronograma(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      setCronograma([]);
    }
  };

  const guardarEvento = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nombre: draft.nombre,
        fecha_inicio: draft.fecha_inicio,
        fecha_fin: draft.fecha_fin || draft.fecha_inicio,
        campeonato_id: draft.campeonato_id || undefined,
        costo_base: draft.costo_base ? Number(draft.costo_base) : undefined,
        id: modal?.tipo === "editar" ? modal.evento.id : undefined,
      };
      if (modal?.tipo === "editar") {
        await saveDraftEvento(payload);
      } else if (draft.estado === "ABIERTO") {
        await publishEvento(payload);
      } else {
        await saveDraftEvento(payload);
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (evento) => {
    if (!confirm(`¿Eliminar el evento "${evento.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteEvento(evento.id);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el evento.");
    }
  };

  // ── Calendario ──────────────────────────────
  const daysInMonth = new Date(calendar.y, calendar.m + 1, 0).getDate();
  const firstDay = new Date(calendar.y, calendar.m, 1).getDay();
  const eventsByDay = useMemo(() => {
    const map = {};
    eventos.forEach((ev) => {
      const d = new Date(ev.fecha_inicio);
      if (d.getFullYear() === calendar.y && d.getMonth() === calendar.m) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        if (map[day].length < 2) map[day].push(ev);
      }
    });
    return map;
  }, [eventos, calendar]);

  const mesLabel = new Date(calendar.y, calendar.m, 1).toLocaleDateString("es-GT", { month: "long", year: "numeric" });

  const cicloIdx = (estado) => CICLO.indexOf(estado);

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Calendario</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">EVENTOS</h1>
          <p className="text-xs text-slate-500 mt-1">{eventos.length} evento(s) registrados en el sistema.</p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[12px] border border-border overflow-hidden">
            <button onClick={() => setMode("lista")} className={`px-3.5 py-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${mode === "lista" ? "bg-blue-600 text-white" : "text-slate-500"}`}>
              <List size={12} /> Lista
            </button>
            <button onClick={() => setMode("calendario")} className={`px-3.5 py-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${mode === "calendario" ? "bg-blue-600 text-white" : "text-slate-500"}`}>
              <Calendar size={12} /> Calendario
            </button>
          </div>
          <Btn variant="gradient" onClick={() => { setModal({ tipo: "crear", evento: null }); setDraft({ estado: "BORRADOR" }); }}>
            <Plus size={13} /> Nuevo evento
          </Btn>
        </div>
      </div>

      {loading ? <Empty title="Cargando eventos..." /> : eventos.length === 0 ? (
        <Empty title="No hay eventos" sub="Creá el primer evento del campeonato." />
      ) : mode === "lista" ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {eventos.map((ev) => {
            const [bv, bl] = ESTADO_BADGE[ev.estado] || ESTADO_BADGE.BORRADOR;
            return (
              <Card key={ev.id} title={ev.nombre} actions={<Badge variant={bv}>{bl}</Badge>}>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                  <Calendar size={12} /> {fmtFecha(ev.fecha_inicio)} → {fmtFecha(ev.fecha_fin)}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3">
                  <span>🏁</span> {ev.circuito?.nombre || "Circuito sin asignar"} · {ev.campeonato?.nombre || "Campeonato Nacional"}
                </div>

                {/* Ciclo de vida */}
                <div className="flex items-center gap-1 mb-4">
                  {CICLO.map((c, i) => {
                    const estadoActual = cicloIdx(ev.estado) >= i;
                    const esActivo = ev.estado === c;
                    return (
                      <div key={c} className="flex items-center gap-1 flex-1 last:flex-none">
                        <button
                          onClick={() => c !== ev.estado && c !== "CANCELADO" && cambiarEstado(ev, c)}
                          disabled={c === ev.estado || c === "CANCELADO" || i > cicloIdx(ev.estado) + 1}
                          title={`Pasar a ${c}`}
                          className={`h-1.5 rounded-full transition-all flex-1 ${esActivo ? "bg-blue-600" : estadoActual ? "bg-blue-300" : "bg-muted"}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="blue">{ev.estado === "ABIERTO" ? "Inscripciones abiertas" : ev.estado === "BORRADOR" ? "En borrador" : ev.estado}</Badge>
                    {ev.visible_portada ? <Badge variant="cyan">Visible en portada</Badge> : null}
                  </div>
                  <div className="flex gap-1.5">
                    <Btn variant="secondary" sm onClick={() => abrirCronograma(ev)}><Clock size={11} /> Cronograma</Btn>
                    <Btn variant="secondary" sm onClick={() => { setModal({ tipo: "editar", evento: ev }); setDraft({ ...ev, fecha_inicio: ev.fecha_inicio?.slice(0, 10), fecha_fin: ev.fecha_fin?.slice(0, 10) || ev.fecha_inicio?.slice(0, 10) }); }}>
                      <Pencil size={11} /> Editar
                    </Btn>
                    <Btn variant="danger" sm onClick={() => eliminar(ev)}><Trash2 size={11} /></Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card
          title={`${mesLabel.charAt(0).toUpperCase()}${mesLabel.slice(1)}`}
          actions={
            <div className="flex gap-1.5">
              <Btn variant="secondary" sm onClick={() => setCalendar((c) => ({ ...c, m: c.m === 0 ? 11 : c.m - 1, y: c.m === 0 ? c.y - 1 : c.y }))}>←</Btn>
              <Btn variant="secondary" sm onClick={() => setCalendar((c) => ({ ...c, m: c.m === 11 ? 0 : c.m + 1, y: c.m === 11 ? c.y + 1 : c.y }))}>→</Btn>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
              <div key={i} className="text-[9px] font-black uppercase tracking-widest text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const evs = eventsByDay[day] || [];
              const hoy = new Date();
              const esHoy = hoy.getDate() === day && hoy.getMonth() === calendar.m && hoy.getFullYear() === calendar.y;
              return (
                <div key={day} className={`min-h-[64px] rounded-[10px] border p-1.5 ${esHoy ? "border-blue-500 bg-blue-500/5" : "border-transparent bg-muted/30"}`}>
                  <div className={`text-[10px] font-bold ${esHoy ? "text-blue-600" : "text-slate-500"}`}>{day}</div>
                  {evs.map((ev) => {
                    const [, bl] = ESTADO_BADGE[ev.estado] || ESTADO_BADGE.BORRADOR;
                    return (
                      <div key={ev.id} title={ev.nombre} className="mt-1 rounded-[6px] bg-blue-600/10 text-blue-700 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 truncate">
                        {bl}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal crear/editar */}
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.tipo === "editar" ? "Editar evento" : "Nuevo evento"}
        sub="Los eventos en borrador no se muestran al público."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" form="evForm" disabled={saving}>
              {saving ? "Guardando..." : "Guardar evento"}
            </Btn>
          </>
        }
      >
        <form id="evForm" onSubmit={guardarEvento} className="space-y-3.5">
          <Field label="Nombre del evento" error={error}>
            <input className={inputCls} value={draft.nombre || ""} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} required placeholder="Ej. GP Capital 2026" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicio">
              <input type="date" className={inputCls} value={draft.fecha_inicio || ""} onChange={(e) => setDraft({ ...draft, fecha_inicio: e.target.value })} required />
            </Field>
            <Field label="Fecha fin">
              <input type="date" className={inputCls} value={draft.fecha_fin || ""} onChange={(e) => setDraft({ ...draft, fecha_fin: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Costo base (Q)">
              <input type="number" className={inputCls} value={draft.costo_base ?? ""} onChange={(e) => setDraft({ ...draft, costo_base: e.target.value })} placeholder="950" />
            </Field>
            <Field label="Estado">
              <select className={selectCls} value={draft.estado || "BORRADOR"} onChange={(e) => setDraft({ ...draft, estado: e.target.value })}>
                <option value="BORRADOR">Borrador</option>
                <option value="ABIERTO">Inscripciones abiertas</option>
              </select>
            </Field>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            El circuito y campeonato se asignan automáticamente (Autódromo Los Volcanes · Campeonato Nacional MWT) si no existen.
          </p>
        </form>
      </Modal>

      {/* Modal cronograma */}
      <Modal
        open={Boolean(cronogramaDe)}
        onClose={() => setCronogramaDe(null)}
        title="Cronograma"
        sub={cronogramaDe?.nombre}
      >
        {cronograma.length === 0 ? (
          <Empty title="Sin actividades" sub="Aún no hay cronograma para este evento." />
        ) : (
          <div className="space-y-2">
            {cronograma.map((act) => (
              <div key={act.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border p-3">
                <div>
                  <div className="text-sm font-bold text-foreground">{act.nombre}</div>
                  {act.descripcion ? <div className="text-[11px] text-slate-500">{act.descripcion}</div> : null}
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-blue-600">{act.hora_inicio?.slice(0, 5)}{act.hora_fin ? ` – ${act.hora_fin.slice(0, 5)}` : ""}</div>
                  {act.es_pista ? <Badge variant="cyan" className="mt-1">Pista</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </main>
  );
}