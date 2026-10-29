"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Download, Play, FileText } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, SearchSelect, inputCls } from "@/components/kit";
import { listEventos } from "@/lib/adminApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders() {
  let token = "";
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(^| )mwt_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[2]);
  }
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

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
  const [exportando, setExportando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [configurandoGen, setConfigurandoGen] = useState(false);
  const [configGen, setConfigGen] = useState({ fechaEvento: "", mangas: 2, horaInicio: "08:00", duracion: 30, vueltas: 5, vueltasPorCategoria: {} });
  const [categoriasGen, setCategoriasGen] = useState([]);
  const [arrastrando, setArrastrando] = useState(null);
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
    fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => setCron(d?.items || []))
      .catch((e) => setError(e?.message || "No se pudo cargar el cronograma."))
      .finally(() => setLoading(false));
  }, [eventoId]);

  const evento = eventos.find((e) => e.id === eventoId);

  useEffect(() => {
    if (!eventoId || !evento) {
      setCategoriasGen([]);
      return;
    }
    const fechaInicial = new Date(evento.fecha_inicio);
    const fechaMinima = new Date(fechaInicial.getFullYear(), fechaInicial.getMonth(), fechaInicial.getDate());
    setConfigGen((actual) => ({
      ...actual,
      fechaEvento: `${fechaMinima.getFullYear()}-${String(fechaMinima.getMonth() + 1).padStart(2, "0")}-${String(fechaMinima.getDate()).padStart(2, "0")}`,
      vueltasPorCategoria: {},
    }));
    fetch(`${API_URL}/api/eventos/${eventoId}/categorias`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        setCategoriasGen(items);
        setConfigGen((actual) => ({
          ...actual,
          vueltasPorCategoria: Object.fromEntries(items.map((categoria) => [categoria.id, 5])),
        }));
      })
      .catch(() => setCategoriasGen([]));
  }, [eventoId, evento]);

  const eventoGroups = useMemo(() => {
    const map = {};
    eventos.forEach((ev) => {
      const key = ev.campeonato?.nombre || "Sin campeonato";
      (map[key] = map[key] || []).push(ev);
    });
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({
        label,
        options: map[label]
          .slice()
          .sort((a, b) => {
            const ta = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : Infinity;
            const tb = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : Infinity;
            return ta - tb;
          })
          .map((ev) => ({
            value: String(ev.id),
            label: ev.fecha_inicio
              ? `${ev.nombre} · ${new Date(ev.fecha_inicio).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })}`
              : ev.nombre,
          })),
      }));
  }, [eventos]);

  const porDia = useMemo(() => {
    const map = {};
    for (const a of cron) {
      const d = new Date(a.hora_inicio).toLocaleDateString("es-GT");
      (map[d] ||= []).push(a);
    }
    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [cron]);

  // Validar que una hora esté dentro del rango del evento
  const horaDentroDelEvento = (horaStr) => {
    if (!evento || !horaStr) return false;
    const h = new Date(horaStr);
    const ini = new Date(evento.fecha_inicio);
    const fin = new Date(evento.fecha_fin);
    return h >= ini && h <= fin;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Validar coherencia de horas con el evento
      if (!horaDentroDelEvento(draft.hora_inicio)) {
        throw new Error("La hora de inicio debe estar dentro del rango del evento (" + new Date(evento.fecha_inicio).toLocaleDateString("es-GT") + " a " + new Date(evento.fecha_fin).toLocaleDateString("es-GT") + ").");
      }
      if (!horaDentroDelEvento(draft.hora_fin)) {
        throw new Error("La hora de fin debe estar dentro del rango del evento (" + new Date(evento.fecha_inicio).toLocaleDateString("es-GT") + " a " + new Date(evento.fecha_fin).toLocaleDateString("es-GT") + ").");
      }
      if (new Date(draft.hora_fin) <= new Date(draft.hora_inicio)) {
        throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
      }

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
      const d2 = await fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`, { headers: authHeaders() }).then((r) => r.json());
      setCron(d2?.items || []);
    } catch (err) {
      setError(err?.message || "No se pudo guardar la actividad.");
    } finally {
      setSaving(false);
    }
  };

  const exportarHorario = async (formato) => {
    if (!eventoId) return;
    setExportando(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/eventos/${eventoId}/panel/horario/export/${formato}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          message = j?.message || message;
        } catch { /* respuesta binaria */ }
        throw new Error(message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      const extension = formato === "excel" ? "xlsx" : formato;
      a.download = `Horario-Evento-${eventoId}-${fecha}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice(`Horario exportado correctamente (${formato === "excel" ? "EXCEL" : formato.toUpperCase()}).`);
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err?.message || `No se pudo exportar el horario (${formato}).`);
    } finally {
      setExportando(false);
    }
  };

  const generarHorarioAuto = async () => {
    if (!eventoId) return;
    setGenerando(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/eventos/${eventoId}/panel/horario/generar`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          vueltas: configGen.vueltas,
          fecha_evento: configGen.fechaEvento,
          hora_inicio: configGen.horaInicio,
          mangas: configGen.mangas,
          vueltas_por_categoria: configGen.vueltasPorCategoria,
          duracion_por_heat: configGen.duracion,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setNotice(`Horario generado: ${data.creadas} actividad(es) · ${data.resumen.sesionesPorCategoria} manga(s) · ${data.resumen.duracionPorHeat} min/heat · ${data.resumen.tiempoUtilizado} min totales.`);
      setConfigurandoGen(false);
      setTimeout(() => setNotice(""), 6000);
      const d2 = await fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`, { headers: authHeaders() }).then((r) => r.json());
      setCron(d2?.items || []);
    } catch (err) {
      setError(err?.message || "No se pudo generar el horario automáticamente.");
    } finally {
      setGenerando(false);
    }
  };

  const moverActividad = async (dia, actividadId) => {
    const grupo = porDia.find(([nombre]) => nombre === dia)?.[1] || [];
    const indice = grupo.findIndex((a) => a.id === actividadId);
    if (indice < 0 || arrastrando === null || arrastrando === indice) return;

    const orden = [...grupo];
    const [movida] = orden.splice(arrastrando, 1);
    orden.splice(indice, 0, movida);
    const posiciones = grupo.map((a) => ({
      inicio: new Date(a.hora_inicio),
      fin: new Date(a.hora_fin),
    }));

    const actividadesActualizadas = orden.map((actividad, posicion) => {
      const duracion = new Date(actividad.hora_fin).getTime() - new Date(actividad.hora_inicio).getTime();
      const inicio = posiciones[posicion].inicio;
      const fin = new Date(inicio.getTime() + duracion);
      return { ...actividad, hora_inicio: inicio.toISOString(), hora_fin: fin.toISOString() };
    });
    setCron((actual) => {
      const ids = new Set(grupo.map((actividad) => actividad.id));
      const primeraPosicion = actual.findIndex((actividad) => ids.has(actividad.id));
      const restante = actual.filter((actividad) => !ids.has(actividad.id));
      restante.splice(Math.max(0, primeraPosicion), 0, ...actividadesActualizadas);
      return restante;
    });

    try {
      await Promise.all(actividadesActualizadas.map((actividad, posicion) => {
        const duracion = new Date(actividad.hora_fin).getTime() - new Date(actividad.hora_inicio).getTime();
        const inicio = posiciones[posicion].inicio;
        const fin = new Date(inicio.getTime() + duracion);
        return fetch(`${API_URL}/api/eventos/${eventoId}/cronograma/${actividad.id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ hora_inicio: inicio.toISOString(), hora_fin: fin.toISOString() }),
        }).then(async (res) => {
          if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
        });
      }));
      setNotice("Orden del cronograma actualizado.");
    } catch (err) {
      setError(err?.message || "No se pudo guardar el nuevo orden.");
      const d2 = await fetch(`${API_URL}/api/eventos/${eventoId}/cronograma`, { headers: authHeaders() }).then((r) => r.json());
      setCron(d2?.items || []);
    } finally {
      setArrastrando(null);
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
        <div className="flex gap-2 flex-wrap">
          <Btn variant="gradient" disabled={!eventoId} onClick={() => setNueva(true)}>+ Nueva actividad</Btn>
          {eventoId && (
            <>
              <Btn variant="secondary" disabled={generando} onClick={() => setConfigurandoGen(true)}>
                <Play size={13} /> {generando ? "Generando…" : "Generar horarios automáticos"}
              </Btn>
              <Btn variant="outline" disabled={exportando || porDia.length === 0} onClick={() => exportarHorario("csv")}>
                <Download size={13} /> {exportando ? "Exportando…" : "Exportar CSV"}
              </Btn>
              <Btn variant="outline" disabled={exportando || porDia.length === 0} onClick={() => exportarHorario("pdf")}>
                <FileText size={13} /> {exportando ? "Exportando…" : "Exportar PDF"}
              </Btn>
              <Btn variant="outline" disabled={exportando || porDia.length === 0} onClick={() => exportarHorario("excel")}>
                <FileText size={13} /> {exportando ? "Exportando…" : "Exportar Excel"}
              </Btn>
            </>
          )}
        </div>
      </div>

      <Card>
        <Field label="Evento">
          <SearchSelect groups={eventoGroups} value={eventoId || ""} onChange={(v) => setEventoId(v)} placeholder="Seleccionar evento" searchPlaceholder="Buscar por nombre o campeonato..." />
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
          <p className="text-[10px] text-slate-500 mt-1">Las horas de las actividades deben estar dentro de este rango.</p>
        </div>
      ) : null}

      {loading ? <Empty title="Cargando cronograma..." /> : null}

      {!loading && porDia.length === 0 ? (
        <Empty
          title="Sin actividades"
          sub={eventoId ? "Usá 'Generar horario automático' para crearlo desde las categorías del evento, o agregá la primera actividad manualmente." : "Seleccioná un evento para ver su cronograma."}
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
              {acts.map((a, indice) => {
                const ini = new Date(a.hora_inicio);
                const fin = new Date(a.hora_fin);
                const mins = Math.round((fin - ini) / 60000);
                return (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={() => setArrastrando(indice)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => moverActividad(dia, a.id)}
                    onDragEnd={() => setArrastrando(null)}
                    className={`bg-card border border-border rounded-[14px] p-4 cursor-grab active:cursor-grabbing transition-opacity ${arrastrando === indice ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-black uppercase tracking-wide text-foreground"><span className="text-slate-400 mr-2">☷</span>{a.nombre}</div>
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
        sub="Se agrega al cronograma del evento seleccionado. La hora debe estar dentro del rango del evento."
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
              <input
                type="datetime-local"
                className={inputCls}
                value={draft.hora_inicio || ""}
                onChange={(e) => setDraft({ ...draft, hora_inicio: e.target.value })}
                required
                min={evento ? new Date(evento.fecha_inicio).toISOString().slice(0, 16) : ""}
                max={evento ? new Date(evento.fecha_fin).toISOString().slice(0, 16) : ""}
              />
            </Field>
            <Field label="Fin">
              <input
                type="datetime-local"
                className={inputCls}
                value={draft.hora_fin || ""}
                onChange={(e) => setDraft({ ...draft, hora_fin: e.target.value })}
                required
                min={evento ? new Date(evento.fecha_inicio).toISOString().slice(0, 16) : ""}
                max={evento ? new Date(evento.fecha_fin).toISOString().slice(0, 16) : ""}
              />
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

      {/* Modal de configuración de generación automática */}
      <Modal
        open={configurandoGen}
        onClose={() => setConfigurandoGen(false)}
        title="Configurar generación automática de heats"
        sub="Todos los heats se generan en el mismo día: primero la Manga 1 de cada categoría y luego la Manga 2."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setConfigurandoGen(false)}>Cancelar</Btn>
            <Btn variant="gradient" onClick={generarHorarioAuto} disabled={generando}>
              {generando ? "Generando…" : "Generar horarios"}
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Día de los heats">
            <input
              type="date"
              className={inputCls}
              value={configGen.fechaEvento}
              onChange={(e) => setConfigGen({ ...configGen, fechaEvento: e.target.value })}
              min={evento ? new Date(evento.fecha_inicio).toISOString().slice(0, 10) : ""}
              max={evento ? new Date(evento.fecha_fin).toISOString().slice(0, 10) : ""}
              required
            />
          </Field>
          <Field label="Cantidad de mangas">
            <input
              type="number"
              className={inputCls}
              value={configGen.mangas}
              onChange={(e) => setConfigGen({ ...configGen, mangas: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
              min="1" max="20" required
            />
          </Field>
          <Field label="Vueltas predeterminadas por heat">
            <input
              type="number"
              className={inputCls}
              value={configGen.vueltas}
              onChange={(e) => {
                const vueltas = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                setConfigGen({
                  ...configGen,
                  vueltas,
                  vueltasPorCategoria: Object.fromEntries(categoriasGen.map((categoria) => [categoria.id, vueltas])),
                });
              }}
              min="1" max="50" required
            />
          </Field>
          <Field label="Hora de inicio del evento">
            <input
              type="time"
              className={inputCls}
              value={configGen.horaInicio}
              onChange={(e) => setConfigGen({ ...configGen, horaInicio: e.target.value })}
              required
            />
          </Field>
          <Field label="Duración por heat (minutos)">
            <input
              type="number"
              className={inputCls}
              value={configGen.duracion}
              onChange={(e) => setConfigGen({ ...configGen, duracion: Math.max(5, Number(e.target.value) || 5) })}
              min="5" max="120" required
            />
            <p className="text-[10px] text-slate-400 mt-1">Se usa como valor general. Puedes personalizarlo por categoría abajo.</p>
          </Field>
          <div className="rounded-[12px] border border-border p-3 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Vueltas por categoría</div>
            {categoriasGen.length === 0 ? (
              <p className="text-[11px] text-slate-400">No se encontraron categorías para este evento.</p>
            ) : categoriasGen.map((categoria) => (
              <div key={categoria.id} className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-foreground">{categoria.nombre}</span>
                <input
                  type="number"
                  className={`${inputCls} w-24`}
                  value={configGen.vueltasPorCategoria[categoria.id] ?? 5}
                  onChange={(e) => setConfigGen({
                    ...configGen,
                    vueltasPorCategoria: {
                      ...configGen.vueltasPorCategoria,
                      [categoria.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                    },
                  })}
                  min="1" max="100" required
                />
              </div>
            ))}
          </div>
          <div className="rounded-[12px] border border-blue-100 bg-blue-50 p-3">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-blue-700">Cómo se calculará:</strong> se generarán {configGen.mangas} manga(s) para cada categoría, en el día seleccionado. Al terminar una manga completa comenzará la siguiente.
            </p>
          </div>
        </div>
      </Modal>
    </main>
  );
}