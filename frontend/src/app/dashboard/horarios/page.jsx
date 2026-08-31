"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, inputCls } from "@/components/kit";
import { listEventos } from "@/lib/adminApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const EST_BADGE = {
  BORRADOR: ["slate", "Borrador"],
  ABIERTO: ["success", "Abierto"],
  EN_CURSO: ["blue", "En curso"],
  FINALIZADO: ["warning", "Finalizado"],
  CANCELADO: ["error", "Cancelado"],
};

export default function HorariosPage() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [cron, setCron] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [nueva, setNueva] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listEventos().then((d) => {
      const items = Array.isArray(d) ? d : d?.items || [];
      setEventos(items);
      if (items.length) setEventoId(items[0].id);
    }).catch(() => setError("No se pudieron cargar los eventos.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!eventoId) { setCron([]); return; }
    setLoading(true);
    fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => setCron(d?.items || []))
      .catch((e) => setError(e?.message || "No se pudo cargar el cronograma."))
      .finally(() => setLoading(false));
  }, [eventoId]);

  const evento = eventos.find((e) => e.id === eventoId);

  const porDia = useMemo(() => {
    const map = {};
    for (const a of cron) {
      const d = new Date(a.hora_inicio).toLocaleDateString("es-GT");
      (map[d] ||= []).push(a);
    }
    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [cron]);

  const enviar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}`,
        },
        body: JSON.stringify({
          nombre: draft.nombre,
          hora_inicio: draft.hora_inicio,
          hora_fin: draft.hora_fin,
          descripcion: draft.descripcion || undefined,
          es_pista: draft.es_pista || false,
        }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => null))?.message) || `HTTP ${res.status}`);
      setNotice("Actividad agregada al cronograma.");
      setNueva(false);
      setDraft({});
      const d2 = await fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`).then((r) => r.json());
      setCron(d2?.items || []);
    } catch (err) {
      setError(err?.message || "No se pudo guardar la actividad.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Planificación del fin de semana</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">HORARIOS</h1>
          <p className="text-xs text-slate-500 mt-1">Cronograma oficial de actividades por evento.</p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
          {notice ? <p className="text-xs text-emerald-600 mt-2">{notice}</p> : null}
        </div>
        <Btn variant="gradient" disabled={!eventoId} onClick={() => setNueva(true)}>+ Nueva actividad</Btn>
      </div>

      <Card>
        <Field label="Evento">
          <select className={inputCls} value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            <option value="">Seleccionar evento</option>
            {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </Field>
      </Card>

      {evento ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black uppercase tracking-wide text-foreground">{evento.nombre}</span>
          {(() => { const [bv, bl] = EST_BADGE[evento.estado] || EST_BADGE.BORRADOR; return <Badge variant={bv}>{bl}</Badge>; })()}
          {evento.circuito?.nombre ? <Badge variant="indigo">{evento.circuito.nombre}</Badge> : null}
          {evento.campeonato?.nombre ? <Badge variant="cyan">{evento.campeonato.nombre}</Badge> : null}
          <span className="text-[11px] text-slate-400">
            {new Date(evento.fecha_inicio).toLocaleDateString("es-GT")} → {new Date(evento.fecha_fin).toLocaleDateString("es-GT")}
          </span>
        </div>
      ) : null}

      {loading ? <Empty title="Cargando cronograma..." /> : null}

      {!loading && porDia.length === 0 ? (
        <Empty
          title="Sin actividades"
          sub={eventoId ? "Agregá la primera actividad al cronograma oficial." : "Seleccioná un evento para ver su cronograma."}
        />
      ) : null}

      <div className="space-y-6">
        {porDia.map(([dia, acts]) => (
          <section key={dia}>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={14} className="text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-foreground">{dia}</h2>
              <span className="text-[10px] text-slate-400">{acts.length} actividad(es)</span>
            </div>
            <div className="relative border-l-2 border-blue-600/30 ml-2 pl-5 space-y-3">
              {acts.map((a) => {
                const ini = new Date(a.hora_inicio);
                const fin = new Date(a.hora_fin);
                const mins = Math.round((fin - ini) / 60000);
                return (
                  <div key={a.id} className="bg-card border border-border rounded-[14px] p-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-black uppercase tracking-wide text-foreground">{a.nombre}</div>
                      {a.es_pista ? <Badge variant="success">Pista</Badge> : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <Clock size={11} />
                      {ini.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })} – {fin.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })} · {mins} min
                    </div>
                    {a.descripcion ? <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{a.descripcion}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={nueva}
        onClose={() => setNueva(false)}
        title="Nueva actividad"
        sub="Se agrega al cronograma del evento seleccionado."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setNueva(false)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" form="crono-form" disabled={saving || !draft.nombre || !draft.hora_inicio || !draft.hora_fin}>
              {saving ? "Guardando..." : "Agregar"}
            </Btn>
          </>
        }
      >
        <form id="crono-form" onSubmit={enviar} className="space-y-3">
          <Field label="Nombre de la actividad">
            <input className={inputCls} value={draft.nombre || ""} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} placeholder="Ej. Entrenamiento libre · Clase M2" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <input type="datetime-local" className={inputCls} value={draft.hora_inicio || ""} onChange={(e) => setDraft({ ...draft, hora_inicio: e.target.value })} required />
            </Field>
            <Field label="Fin">
              <input type="datetime-local" className={inputCls} value={draft.hora_fin || ""} onChange={(e) => setDraft({ ...draft, hora_fin: e.target.value })} required />
            </Field>
          </div>
          <Field label="Descripción (opcional)">
            <textarea rows={2} className={inputCls} value={draft.descripcion || ""} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="Detalles de la actividad..." />
          </Field>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={draft.es_pista || false}
              onChange={(e) => setDraft({ ...draft, es_pista: e.target.checked })}
              className="accent-blue-600"
            />
            Es actividad en pista
          </label>
        </form>
      </Modal>
    </main>
  );
}