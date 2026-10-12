"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Copy, Folder, FolderOpen, FolderPlus, List, Plus, Pencil, Trash2, Clock, ChevronDown, ChevronRight, X, Tag } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, inputCls, selectCls } from "@/components/kit";
import { useConfirm } from "@/components/ConfirmProvider";
import { listEventos, publishEvento, saveDraftEvento, deleteEvento, listCampeonatos, listCircuitos } from "@/lib/adminApi";
import { getCurrentUser } from "@/lib/soporteApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(extra = {}) {
  let token = "";
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(^| )mwt_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[2]);
  }
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

const ESTADO_BADGE = {
  BORRADOR: ["gray", "Borrador"],
  ABIERTO: ["cyan", "Inscripciones abiertas"],
  EN_CURSO: ["success", "En curso"],
  FINALIZADO: ["gray", "Finalizado"],
  CANCELADO: ["error", "Cancelado"],
};

const MODALIDAD_BADGE = {
  ACMG: ["blue", "ACMG"],
  YAMAHA: ["indigo", "Yamaha"],
  OTRO: ["gray", "Otro"],
};

const CICLO = ["BORRADOR", "ABIERTO", "EN_CURSO", "FINALIZADO", "CANCELADO"];
const CICLO_ORDER = { BORRADOR: 0, ABIERTO: 1, EN_CURSO: 2, FINALIZADO: 3, CANCELADO: 4 };

function fmtFecha(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtHora(v) {
  if (!v) return "—";
  return String(v).slice(0, 5);
}

export default function EventosPage() {
  const { confirm } = useConfirm();
  const [eventos, setEventos] = useState([]);
  const [arbol, setArbol] = useState([]);
  const [campeonatos, setCampeonatos] = useState([]);
  const [circuitos, setCircuitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("carpetas");
  const [abierto, setAbierto] = useState([]);
  const [calendar, setCalendar] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });

  // Modal de serie (carpeta de evento ACMG/Yamaha)
  const [modal, setModal] = useState(null); // { tipo: "crear"|"editar", serie }
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal de fecha (evento dentro de la serie)
  const [modalFecha, setModalFecha] = useState(null); // { tipo, evento, serie_id }
  const [draftFecha, setDraftFecha] = useState({});

  // Cronograma
  const [cronogramaDe, setCronogramaDe] = useState(null);
  const [cronograma, setCronograma] = useState([]);
  const [cronogramaModal, setCronogramaModal] = useState(null);
  const [cronogramaLoading, setCronogramaLoading] = useState(false);

  // Categorías del evento (serie)
  const [categoriasDe, setCategoriasDe] = useState(null);
  const [categoriasData, setCategoriasData] = useState({ items: [], pool: [] });
  const [catLoading, setCatLoading] = useState(false);
  const [selImport, setSelImport] = useState([]);
  const [catBusca, setCatBusca] = useState("");

  // Copiar año
  const [modalClonar, setModalClonar] = useState(null); // { origen_anio }
  const [cloneDraft, setCloneDraft] = useState({ destino_anio: 0, copiar_fechas: true, copiar_categorias: true, copiar_cronograma: true });
  const [clonando, setClonando] = useState(false);
  const [cloneError, setCloneError] = useState("");
  const [cloneResult, setCloneResult] = useState(null);

  useEffect(() => {
    listCampeonatos().then(setCampeonatos).catch(() => setCampeonatos([]));
    listCircuitos().then(setCircuitos).catch(() => setCircuitos([]));
  }, []);

  const loadArbol = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/series/arbol`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setArbol(items);
      // Por defecto abrir el año más reciente y todas sus series
      setAbierto((prev) => {
        if (prev.length > 0) return prev;
        if (!items.length) return [];
        const next = [`a:${items[0].anio}`];
        items[0].series.forEach((s) => next.push(`s:${s.id}`));
        return next;
      });
    } catch (err) {
      setError(err?.message || "No se pudo cargar el árbol de eventos.");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listEventos();
      setEventos(Array.isArray(items) ? items : Array.isArray(items?.items) ? items.items : []);
      await loadArbol();
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  }, [loadArbol]);

  useEffect(() => { load(); }, [load]);

  const toggleAbierto = (key) => {
    setAbierto((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  function computeEventsByDay() {
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
  }

  const eventsByDay = computeEventsByDay();
  const mesLabel = new Date(calendar.y, calendar.m, 1).toLocaleDateString("es-GT", { month: "long", year: "numeric" });

  const isValidTransition = (from, to) => {
    if (from === "BORRADOR") return to === "ABIERTO";
    if (from === "ABIERTO") return ["EN_CURSO", "CANCELADO"].includes(to);
    if (from === "EN_CURSO") return to === "FINALIZADO";
    return false;
  };

  // ---------------- Serie (carpeta de evento) ----------------

  const abrirNuevaSerie = (anio) => {
    setModal({ tipo: "crear", serie: null });
    setDraft({ nombre: "", anio: anio || new Date().getFullYear(), modalidad: "ACMG", descripcion: "" });
  };

  const abrirEditarSerie = (serie) => {
    setModal({ tipo: "editar", serie });
    setDraft({
      nombre: serie.nombre,
      anio: serie.anio,
      modalidad: serie.modalidad || "OTRO",
      descripcion: serie.descripcion || "",
    });
  };

  const guardarSerie = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nombre: draft.nombre,
        anio: Number(draft.anio),
        modalidad: draft.modalidad,
        descripcion: draft.descripcion || undefined,
      };
      const res = await fetch(`${API_URL}/api/admin/series${modal.tipo === "editar" ? `/${modal.serie.id}` : ""}`, {
        method: modal.tipo === "editar" ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      setModal(null);
      await loadArbol();
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la carpeta de evento.");
    } finally {
      setSaving(false);
    }
  };

  const eliminarSerie = async (serie) => {
    if (!(await confirm({ title: "Eliminar carpeta de evento", message: `¿Eliminar la carpeta "${serie.nombre}" (${serie.anio})? Esta acción no se puede deshacer.`, confirmText: "Eliminar" }))) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/series/${serie.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      await loadArbol();
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar la carpeta.");
    }
  };

  // ---------------- Copiar año ----------------

  const abrirClonarAnio = (origenAnio) => {
    setModalClonar({ origen_anio: origenAnio });
    setCloneDraft({ destino_anio: origenAnio + 1, copiar_fechas: true, copiar_categorias: true, copiar_cronograma: true });
    setCloneError("");
    setCloneResult(null);
  };

  const clonarAnio = async (e) => {
    e.preventDefault();
    if (!modalClonar) return;
    setClonando(true);
    setCloneError("");
    setCloneResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/series/clonar-anio`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          origen_anio: modalClonar.origen_anio,
          destino_anio: Number(cloneDraft.destino_anio),
          copiar_fechas: cloneDraft.copiar_fechas,
          copiar_categorias: cloneDraft.copiar_categorias,
          copiar_cronograma: cloneDraft.copiar_cronograma,
          usuario_id: getCurrentUser()?.id || "",
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      const data = await res.json();
      setCloneResult(data);
      if (data.series_creadas > 0) {
        setAbierto((prev) => Array.from(new Set([...prev, `a:${data.destino_anio}`])));
        await loadArbol();
        await load();
      }
    } catch (err) {
      setCloneError(err?.message || "No se pudo copiar el año.");
    } finally {
      setClonando(false);
    }
  };

  // ---------------- Fecha (evento) ----------------

  const abrirNuevaFecha = (serie) => {
    const n = serie.fechas.length;
    const ord = ["Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta", "Séptima", "Octava", "Novena", "Décima"];
    const sugerido = n < ord.length ? `${ord[n]} fecha` : `${n + 1}ª fecha`;
    setModalFecha({ tipo: "crear", evento: null, serie_id: serie.id });
    setDraftFecha({ nombre: sugerido, campeonato_id: serie.id, estado: "BORRADOR", visible_portada: true });
  };

  const abrirEditarFecha = (ev) => {
    setModalFecha({ tipo: "editar", evento: ev, serie_id: ev.campeonato_id });
    setDraftFecha({
      nombre: ev.nombre,
      fecha_inicio: ev.fecha_inicio?.slice(0, 10),
      fecha_fin: ev.fecha_fin?.slice(0, 10) || ev.fecha_inicio?.slice(0, 10),
      campeonato_id: ev.campeonato_id,
      circuito_id: ev.circuito_id || undefined,
      costo_base: ev.costo_base ?? "",
      estado: ev.estado,
      visible_portada: !!ev.visible_portada,
    });
  };

  const guardarFecha = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nombre: draftFecha.nombre,
        fecha_inicio: draftFecha.fecha_inicio,
        fecha_fin: draftFecha.fecha_fin || draftFecha.fecha_inicio,
        campeonato_id: draftFecha.campeonato_id || undefined,
        circuito_id: draftFecha.circuito_id || undefined,
        costo_base: draftFecha.costo_base ? Number(draftFecha.costo_base) : undefined,
        id: modalFecha?.tipo === "editar" ? modalFecha.evento.id : undefined,
      };
      if (modalFecha?.tipo === "editar") {
        await saveDraftEvento(payload);
      } else if (draftFecha.estado === "ABIERTO") {
        await publishEvento(payload);
      } else {
        await saveDraftEvento(payload);
      }
      setModalFecha(null);
      await loadArbol();
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la fecha.");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (evento) => {
    if (!(await confirm({ title: "Eliminar fecha", message: `¿Eliminar la fecha "${evento.nombre}"? Esta acción no se puede deshacer.`, confirmText: "Eliminar" }))) return;
    try {
      await deleteEvento(evento.id);
      await loadArbol();
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar la fecha.");
    }
  };

  const cambiarEstado = async (evento, estado) => {
    const usuario = getCurrentUser();
    if (!usuario?.id) { setError("Usuario no identificado"); return; }
    try {
      const res = await fetch(`${API_URL}/api/eventos/${evento.id}/estado`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ estado_nuevo: estado, usuario_id: usuario.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      await loadArbol();
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado.");
    }
  };

  // ---------------- Cronograma ----------------

  const abrirCronograma = async (evento) => {
    setCronogramaDe(evento);
    setCronogramaLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/eventos/${evento.id}/cronograma`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCronograma(Array.isArray(data.items) ? data.items : []);
      } else {
        setCronograma([]);
      }
    } catch {
      setCronograma([]);
    } finally {
      setCronogramaLoading(false);
    }
  };

  const addActividad = async (e) => {
    e.preventDefault();
    if (!cronogramaDe) return;
    const fd = new FormData(e.target);
    const payload = {
      nombre: fd.get("act_nombre"),
      hora_inicio: fd.get("act_hora_inicio"),
      hora_fin: fd.get("act_hora_fin"),
      descripcion: fd.get("act_descripcion") || undefined,
      es_pista: fd.get("act_es_pista") === "on",
    };
    try {
      const res = await fetch(`${API_URL}/api/eventos/${cronogramaDe.id}/cronograma`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      abrirCronograma(cronogramaDe);
    } catch (err) {
      setError(err?.message || "No se pudo agregar la actividad.");
    }
  };

  const deleteActividad = async (id) => {
    if (!cronogramaDe) return;
    if (!(await confirm({ title: "Eliminar actividad", message: "¿Eliminar esta actividad del cronograma? Esta acción no se puede deshacer.", confirmText: "Eliminar" }))) return;
    try {
      await fetch(`${API_URL}/api/eventos/${cronogramaDe.id}/cronograma/${id}`, { method: "DELETE", headers: authHeaders() });
      abrirCronograma(cronogramaDe);
    } catch (err) {
      setError(err?.message || "No se pudo eliminar.");
    }
  };

  // ---------------- Categorías del evento (serie) ----------------

  const abrirCategorias = async (serie) => {
    setCategoriasDe(serie);
    setCatLoading(true);
    setCatBusca("");
    setSelImport([]);
    try {
      const res = await fetch(`${API_URL}/api/admin/series/${serie.id}/categorias`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      const data = await res.json();
      setCategoriasData({
        items: Array.isArray(data.items) ? data.items : [],
        pool: Array.isArray(data.pool) ? data.pool : [],
      });
    } catch (err) {
      setError(err?.message || "No se pudieron cargar las categorías.");
      setCategoriasData({ items: [], pool: [] });
    } finally {
      setCatLoading(false);
    }
  };

  const recargarCategorias = async () => {
    if (!categoriasDe) return;
    await abrirCategorias(categoriasDe);
  };

  const addCategoria = async (e) => {
    e.preventDefault();
    if (!categoriasDe) return;
    const fd = new FormData(e.target);
    const payload = {
      nombre: fd.get("cat_nombre"),
      cilindrada_min: Number(fd.get("cat_cil_min")),
      cilindrada_max: Number(fd.get("cat_cil_max")),
      descripcion: fd.get("cat_descripcion") || undefined,
      precio_inscripcion: Number(fd.get("cat_precio") || 0),
      usuario_id: getCurrentUser()?.id || "",
    };
    try {
      const res = await fetch(`${API_URL}/api/admin/series/${categoriasDe.id}/categorias`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      e.target.reset();
      await recargarCategorias();
    } catch (err) {
      setError(err?.message || "No se pudo agregar la categoría.");
    }
  };

  const importarCategorias = async () => {
    if (!categoriasDe || !selImport.length) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/series/${categoriasDe.id}/categorias/importar`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ categoria_ids: selImport, usuario_id: getCurrentUser()?.id || "" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      setSelImport([]);
      await recargarCategorias();
    } catch (err) {
      setError(err?.message || "No se pudieron importar las categorías.");
    }
  };

  const deleteCategoria = async (id) => {
    if (!categoriasDe) return;
    if (!(await confirm({ title: "Eliminar categoría", message: "¿Eliminar esta categoría? No se puede eliminar si tiene inscripciones.", confirmText: "Eliminar" }))) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/series/${categoriasDe.id}/categorias/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Error");
      await recargarCategorias();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar la categoría.");
    }
  };

  const toggleSelImport = (id) => {
    setSelImport((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const poolFiltrado = categoriasData.pool.filter((c) => {
    const q = catBusca.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.origen_nombre || "").toLowerCase().includes(q) ||
      String(c.origen_anio).includes(q)
    );
  });

  // ---------------- Render helpers ----------------

  const cronogramaItems = cronograma.map((act) => (
    <div key={act.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0"><Clock size={14} /></div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-foreground truncate">{act.nombre}</div>
            {act.descripcion ? <div className="text-[11px] text-slate-500">{act.descripcion}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="text-[11px] font-black text-blue-600 whitespace-nowrap">{fmtHora(act.hora_inicio)} - {fmtHora(act.hora_fin)}</div>
          {act.es_pista && <Badge variant="cyan">Pista</Badge>}
        </div>
      </div>
      <button onClick={() => deleteActividad(act.id)} className="text-rose-500 hover:text-rose-700 p-1 shrink-0" title="Eliminar"><X size={14} /></button>
    </div>
  ));

  const renderEstados = (ev) => (
    <div className="flex items-center gap-1 min-w-[140px]">
      {CICLO.filter((c) => c !== "CANCELADO").map((c) => {
        const pasado = CICLO_ORDER[ev.estado] >= CICLO_ORDER[c];
        const activo = ev.estado === c;
        const habilitado = isValidTransition(ev.estado, c) || c === ev.estado;
        return (
          <button
            key={c}
            onClick={() => habilitado && !activo && cambiarEstado(ev, c)}
            disabled={!habilitado || activo}
            title={activo ? `Estado actual: ${c}` : habilitado ? `Pasar a ${c}` : `Transición no permitida (${ev.estado} → ${c})`}
            className={`h-1.5 rounded-full transition-all flex-1 ${activo ? "bg-blue-600 shadow-lg shadow-blue-600/30" : pasado ? "bg-blue-300" : "bg-muted"} ${habilitado && !activo ? "cursor-pointer" : "cursor-default"}`}
          />
        );
      })}
    </div>
  );

  const renderFechas = (serie) => (
    <div className="space-y-2">
      {serie.fechas.length === 0 ? (
        <div className="text-[11px] text-slate-400 pl-5 py-1">Sin fechas aún. Agrega la primera fecha de esta carpeta.</div>
      ) : (
        serie.fechas.map((ev) => {
          const [bv, bl] = ESTADO_BADGE[ev.estado] || ESTADO_BADGE.BORRADOR;
          return (
            <div key={ev.id} data-qa="fecha" className={`rounded-[12px] border p-3 transition-colors ${ev.estado === "ABIERTO" ? "border-cyan-400/40 bg-cyan-500/5" : "border-border bg-background/60"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar size={14} className="text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">{ev.nombre}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {fmtFecha(ev.fecha_inicio)}{ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio ? ` – ${fmtFecha(ev.fecha_fin)}` : ""} · {ev.circuito?.nombre || "Sin circuito"}
                    </div>
                  </div>
                </div>
                <Badge variant={bv}>{bl}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap mt-2.5">
                {renderEstados(ev)}
                <div className="flex gap-1.5 flex-wrap">
                  <Btn variant="secondary" sm onClick={() => abrirCronograma(ev)}><Clock size={11} /> Cronograma</Btn>
                  <Btn variant="secondary" sm onClick={() => abrirCategorias(serie)}><Tag size={11} /> Categorías</Btn>
                  <Btn variant="secondary" sm onClick={() => abrirEditarFecha(ev)}><Pencil size={11} /> Editar</Btn>
                  <Btn variant="danger" sm onClick={() => eliminar(ev)} aria-label={`Eliminar fecha ${ev.nombre}`}><Trash2 size={11} /></Btn>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderSeries = (año) => (
    <div className="space-y-2.5">
      {año.series.length === 0 ? (
        <div className="text-[11px] text-slate-400 pl-5 py-1">Sin carpetas de evento en este año.</div>
      ) : (
        año.series.map((serie) => {
          const [mbv, mbl] = MODALIDAD_BADGE[serie.modalidad] || MODALIDAD_BADGE.OTRO;
          const open = abierto.includes(`s:${serie.id}`);
          return (
            <div key={serie.id} data-qa="serie" className="rounded-[14px] border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 flex-wrap p-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button onClick={() => toggleAbierto(`s:${serie.id}`)} className="text-slate-500 hover:text-blue-600 shrink-0 p-0.5" aria-label="Expandir serie">
                    {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  {open ? <FolderOpen size={15} className="text-indigo-500 shrink-0" /> : <Folder size={15} className="text-indigo-500 shrink-0" />}
                  <button onClick={() => toggleAbierto(`s:${serie.id}`)} className="min-w-0 text-left">
                    <span className="text-sm font-bold text-foreground truncate block">{serie.nombre}</span>
                    <span className="text-[10px] text-slate-500 block">{serie.count_fechas} fecha(s) · {serie.total_categorias} categoría(s)</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={mbv}>{mbl}</Badge>
                  <Btn variant="secondary" sm onClick={() => abrirNuevaFecha(serie)}><Plus size={11} /> Fecha</Btn>
                  <Btn variant="secondary" sm onClick={() => abrirCategorias(serie)}><Tag size={11} /> Categorías</Btn>
                  <Btn variant="secondary" sm onClick={() => abrirEditarSerie(serie)} aria-label="Editar carpeta"><Pencil size={11} /></Btn>
                  <Btn variant="danger" sm onClick={() => eliminarSerie(serie)} aria-label={`Eliminar carpeta ${serie.nombre}`}><Trash2 size={11} /></Btn>
                </div>
              </div>
              {open ? <div className="px-3 pb-3 pl-8">{renderFechas(serie)}</div> : null}
            </div>
          );
        })
      )}
    </div>
  );

  const renderCarpetas = () => {
    if (arbol.length === 0) {
      return <Empty title="No hay carpetas de eventos" sub="Crea tu primera carpeta de evento (ACMG o Yamaha) con el botón «Nuevo evento»." />;
    }
    return (
      <div className="space-y-3">
        {arbol.map((año) => {
          const open = abierto.includes(`a:${año.anio}`);
          const totalSeries = año.series.length;
          const totalFechas = año.series.reduce((acc, s) => acc + (s.count_fechas || 0), 0);
          return (
            <section key={año.anio} data-qa="anio" className="rounded-[16px] border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 flex-wrap p-4 border-b border-border">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button onClick={() => toggleAbierto(`a:${año.anio}`)} className="text-slate-500 hover:text-blue-600 shrink-0 p-0.5" aria-label="Expandir año">
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {open ? <FolderOpen size={17} className="text-blue-600 shrink-0" /> : <Folder size={17} className="text-blue-600 shrink-0" />}
                  <button onClick={() => toggleAbierto(`a:${año.anio}`)} className="min-w-0 text-left">
                    <span className="text-sm font-black uppercase tracking-[0.04em] text-foreground block">Año {año.anio}</span>
                    <span className="text-[10px] text-slate-500 block">{totalSeries} carpeta(s) · {totalFechas} fecha(s)</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Btn variant="secondary" sm onClick={() => abrirClonarAnio(año.anio)} title={`Copiar la estructura del año ${año.anio} a otro año`} data-qa={`copiar-anio-${año.anio}`}>
                    <Copy size={11} /> Copiar año
                  </Btn>
                  <Btn variant="secondary" sm onClick={() => abrirNuevaSerie(año.anio)}>
                    <FolderPlus size={11} /> Nuevo evento
                  </Btn>
                </div>
              </div>
              {open ? <div className="p-3">{renderSeries(año)}</div> : null}
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Organizador</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">EVENTOS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Carpetas por año y tipo (ACMG / Yamaha), con sus fechas y categorías.
          </p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[12px] border border-border overflow-hidden">
            <button data-qa="tab-carpetas" onClick={() => setMode("carpetas")} className={`px-3.5 py-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${mode === "carpetas" ? "bg-blue-600 text-white" : "text-slate-500"}`}>
              <Folder size={12} /> Carpetas
            </button>
            <button data-qa="tab-lista" onClick={() => setMode("lista")} className={`px-3.5 py-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${mode === "lista" ? "bg-blue-600 text-white" : "text-slate-500"}`}>
              <List size={12} /> Lista
            </button>
            <button data-qa="tab-calendario" onClick={() => setMode("calendario")} className={`px-3.5 py-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${mode === "calendario" ? "bg-blue-600 text-white" : "text-slate-500"}`}>
              <Calendar size={12} /> Calendario
            </button>
          </div>
          <Btn variant="gradient" onClick={() => abrirNuevaSerie(null)}>
            <Plus size={13} /> Nuevo evento
          </Btn>
        </div>
      </div>

      {loading ? (
        <Empty title="Cargando eventos..." />
      ) : mode === "carpetas" ? (
        renderCarpetas()
      ) : mode === "lista" ? (
        eventos.length === 0 ? (
          <Empty title="No hay eventos" sub="Crea una carpeta de evento y agrega fechas." />
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {eventos.map((ev) => {
              const [bv, bl] = ESTADO_BADGE[ev.estado] || ESTADO_BADGE.BORRADOR;
              return (
                <Card key={ev.id} title={ev.nombre} actions={<Badge variant={bv}>{bl}</Badge>}>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 flex-wrap">
                    <Calendar size={12} /> {fmtFecha(ev.fecha_inicio)} - {fmtFecha(ev.fecha_fin)}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3 flex-wrap">
                    <Clock size={12} /> {ev.circuito?.nombre || "Sin circuito"} - {ev.campeonato?.nombre || "Sin campeonato"}
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {renderEstados(ev)}
                    <div className="flex gap-1.5 flex-wrap">
                      <Btn variant="secondary" sm onClick={() => abrirCronograma(ev)}><Clock size={11} /> Cronograma</Btn>
                      <Btn variant="secondary" sm onClick={() => abrirEditarFecha(ev)}><Pencil size={11} /> Editar</Btn>
                      <Btn variant="danger" sm onClick={() => eliminar(ev)} aria-label={`Eliminar fecha ${ev.nombre}`}><Trash2 size={11} /></Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card
          title={mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
          actions={
            <div className="flex gap-1.5">
              <Btn variant="secondary" sm onClick={() => setCalendar((c) => ({ ...c, m: c.m === 0 ? 11 : c.m - 1, y: c.m === 0 ? c.y - 1 : c.y }))}>‹</Btn>
              <Btn variant="secondary" sm onClick={() => setCalendar((c) => ({ ...c, m: c.m === 11 ? 0 : c.m + 1, y: c.m === 11 ? c.y + 1 : c.y }))}>›</Btn>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
              <div key={i} className="text-[9px] font-black uppercase tracking-widest text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: new Date(calendar.y, calendar.m, 1).getDay() }).map((_, i) => <div key={"e" + i} />)}
            {Array.from({ length: new Date(calendar.y, calendar.m + 1, 0).getDate() }, (_, i) => i + 1).map((day) => {
              const evs = eventsByDay[day] || [];
              const hoy = new Date();
              const esHoy = hoy.getDate() === day && hoy.getMonth() === calendar.m && hoy.getFullYear() === calendar.y;
              return (
                <div key={day} className={"min-h-[64px] rounded-[10px] border p-1.5 " + (esHoy ? "border-blue-500 bg-blue-500/5" : "border-transparent bg-muted/30")}>
                  <div className={"text-[10px] font-bold " + (esHoy ? "text-blue-600" : "text-slate-500")}>{day}</div>
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

      {/* Modal: crear/editar carpeta de evento (serie) */}
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.tipo === "editar" ? "Editar carpeta de evento" : "Nueva carpeta de evento"}
        sub="Agrupa las fechas de un evento por año y tipo (ACMG o Yamaha)."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" form="serieForm" disabled={saving}>
              {saving ? "Guardando..." : "Guardar carpeta"}
            </Btn>
          </>
        }
      >
        <form id="serieForm" onSubmit={guardarSerie} className="space-y-3.5">
          <Field label="Nombre del evento" error={error}>
            <input className={inputCls} value={draft.nombre || ""} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} required placeholder="Ej. Campeonato Nacional ACMG" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Año">
              <input type="number" className={inputCls} value={draft.anio ?? ""} onChange={(e) => setDraft({ ...draft, anio: e.target.value })} required min="2000" max="2100" />
            </Field>
            <Field label="Tipo de evento">
              <select className={selectCls} value={draft.modalidad || "ACMG"} onChange={(e) => setDraft({ ...draft, modalidad: e.target.value })}>
                <option value="ACMG">ACMG</option>
                <option value="YAMAHA">Yamaha</option>
                <option value="OTRO">Otro</option>
              </select>
            </Field>
          </div>
          <Field label="Descripción (opcional)">
            <textarea className={inputCls} rows={2} value={draft.descripcion || ""} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="Detalles del evento..." />
          </Field>
        </form>
      </Modal>

      {/* Modal: crear/editar fecha */}
      <Modal
        open={Boolean(modalFecha)}
        onClose={() => setModalFecha(null)}
        title={modalFecha?.tipo === "editar" ? "Editar fecha" : "Nueva fecha"}
        sub="Las fechas son las rondas (primera fecha, segunda fecha...) dentro de una carpeta de evento."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModalFecha(null)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" form="fechaForm" disabled={saving}>
              {saving ? "Guardando..." : "Guardar fecha"}
            </Btn>
          </>
        }
      >
        <form id="fechaForm" onSubmit={guardarFecha} className="space-y-3.5">
          <Field label="Nombre de la fecha" error={error}>
            <input className={inputCls} value={draftFecha.nombre || ""} onChange={(e) => setDraftFecha({ ...draftFecha, nombre: e.target.value })} required placeholder="Ej. Primera fecha" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicio">
              <input type="date" className={inputCls} value={draftFecha.fecha_inicio || ""} onChange={(e) => setDraftFecha({ ...draftFecha, fecha_inicio: e.target.value })} required />
            </Field>
            <Field label="Fecha fin">
              <input type="date" className={inputCls} value={draftFecha.fecha_fin || ""} onChange={(e) => setDraftFecha({ ...draftFecha, fecha_fin: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Campeonato">
              <select className={selectCls} value={draftFecha.campeonato_id || ""} onChange={(e) => setDraftFecha({ ...draftFecha, campeonato_id: e.target.value || undefined })}>
                <option value="">Auto (Campeonato Nacional MWT)</option>
                {campeonatos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.anio})</option>
                ))}
              </select>
            </Field>
            <Field label="Circuito">
              <select className={selectCls} value={draftFecha.circuito_id || ""} onChange={(e) => setDraftFecha({ ...draftFecha, circuito_id: e.target.value || undefined })}>
                <option value="">Auto (Autodromo Los Volcanes)</option>
                {circuitos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Costo base (Q)">
              <input type="number" className={inputCls} value={draftFecha.costo_base ?? ""} onChange={(e) => setDraftFecha({ ...draftFecha, costo_base: e.target.value })} placeholder="950" min="0" step="1" />
            </Field>
            <Field label="Estado inicial">
              <select className={selectCls} value={draftFecha.estado || "BORRADOR"} onChange={(e) => setDraftFecha({ ...draftFecha, estado: e.target.value })}>
                <option value="BORRADOR">Borrador</option>
                <option value="ABIERTO">Inscripciones abiertas</option>
              </select>
            </Field>
          </div>
          <Field label="Visible en portada">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draftFecha.visible_portada ?? true} onChange={(e) => setDraftFecha({ ...draftFecha, visible_portada: e.target.checked })} className="w-4 h-4 rounded border-border accent-blue-600" />
              <span className="text-sm">Mostrar en página principal</span>
            </label>
          </Field>
        </form>
      </Modal>

      {/* Modal: cronograma */}
      <Modal
        open={Boolean(cronogramaDe)}
        onClose={() => setCronogramaDe(null)}
        title="Cronograma de actividades"
        sub={cronogramaDe?.nombre}
        size="lg"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setCronogramaDe(null)}>Cerrar</Btn>
            <Btn variant="secondary" onClick={() => setCronogramaModal({ tipo: "crear" })}><Plus size={12} /> Agregar actividad</Btn>
          </>
        }
      >
        {cronogramaLoading ? (
          <Empty title="Cargando cronograma..." />
        ) : cronograma.length === 0 ? (
          <Empty title="Sin actividades" sub="Agrega la primera actividad del cronograma." />
        ) : (
          <div className="space-y-2">{cronogramaItems}</div>
        )}

        {cronogramaModal && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-bold mb-3">{cronogramaModal.tipo === "editar" ? "Editar actividad" : "Nueva actividad"}</h4>
            <form onSubmit={(e) => { e.preventDefault(); addActividad(e); }} className="space-y-3">
              <Field label="Nombre"><input className={inputCls} name="act_nombre" required placeholder="Ej. Practicas libres" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hora inicio"><input type="time" className={inputCls} name="act_hora_inicio" required /></Field>
                <Field label="Hora fin"><input type="time" className={inputCls} name="act_hora_fin" required /></Field>
              </div>
              <Field label="Descripcion (opcional)"><textarea className={inputCls} name="act_descripcion" rows={2} placeholder="Detalles..." /></Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="act_es_pista" className="w-4 h-4 rounded border-border accent-blue-600" />
                <span className="text-sm">Es actividad en pista</span>
              </label>
              <div className="flex justify-end gap-2">
                <Btn variant="secondary" type="button" onClick={() => setCronogramaModal(null)}>Cancelar</Btn>
                <Btn variant="gradient" type="submit">{cronogramaModal.tipo === "editar" ? "Actualizar" : "Agregar"}</Btn>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: categorías del evento (serie) */}
      <Modal
        open={Boolean(categoriasDe)}
        onClose={() => setCategoriasDe(null)}
        title="Categorías del evento"
        sub={categoriasDe ? `${categoriasDe.nombre} — ${(MODALIDAD_BADGE[categoriasDe.modalidad] || ["gray", "Otro"])[1]}/${categoriasDe.anio}` : ""}
        size="lg"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setCategoriasDe(null)}>Cerrar</Btn>
            <Btn variant="success" onClick={importarCategorias} disabled={!selImport.length}>
              Importar {selImport.length > 0 ? `(${selImport.length})` : "seleccionadas"}
            </Btn>
          </>
        }
      >
        {catLoading ? (
          <Empty title="Cargando categorías..." />
        ) : (
          <div className="space-y-5">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 mb-2">
                Categorías que participan ({categoriasData.items.length})
              </h4>
              {categoriasData.items.length === 0 ? (
                <Empty title="Sin categorías" sub="Agrega categorías nuevas o impórtalas de eventos ya registrados." />
              ) : (
                <div className="space-y-2">
                  {categoriasData.items.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{cat.nombre}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span>{cat.cilindrada_min}-{cat.cilindrada_max} cc</span>
                          <span className="text-blue-600 font-black">Q{Number(cat.precio_inscripcion || 0).toLocaleString("es-GT")}</span>
                          <span>Inscritos: {cat.total_inscritos || 0}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteCategoria(cat.id)} className="text-rose-500 hover:text-rose-700 p-1 shrink-0" title="Eliminar"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Importar categorías ya registradas</h4>
              <input
                className={inputCls + " mb-2"}
                placeholder="Buscar por nombre o evento de origen..."
                value={catBusca}
                onChange={(e) => setCatBusca(e.target.value)}
              />
              {categoriasData.pool.length === 0 ? (
                <p className="text-[11px] text-slate-400">No hay categorías registradas en otros eventos para importar.</p>
              ) : poolFiltrado.length === 0 ? (
                <p className="text-[11px] text-slate-400">Sin resultados para la búsqueda.</p>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-[12px] border border-border divide-y divide-border">
                  {poolFiltrado.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={selImport.includes(c.id)}
                        onChange={() => toggleSelImport(c.id)}
                        className="w-4 h-4 rounded border-border accent-blue-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-foreground truncate">{c.nombre}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {c.cilindrada_min}-{c.cilindrada_max} cc · desde {c.origen_nombre} ({c.origen_anio})
                        </div>
                      </div>
                      <Badge variant={(MODALIDAD_BADGE[c.modalidad] || ["gray", "Otro"])[0]}>{c.modalidad}</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 mb-2">Agregar categoría nueva</h4>
              <form onSubmit={addCategoria} className="space-y-3">
                <Field label="Nombre"><input className={inputCls} name="cat_nombre" required placeholder="Ej. 125cc Stock" /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Cilindrada min"><input type="number" className={inputCls} name="cat_cil_min" required placeholder="100" min="50" /></Field>
                  <Field label="Cilindrada max"><input type="number" className={inputCls} name="cat_cil_max" required placeholder="125" min="50" /></Field>
                  <Field label="Precio (Q)"><input type="number" className={inputCls} name="cat_precio" required placeholder="950" min="0" step="1" /></Field>
                </div>
                <Field label="Descripción (opcional)"><textarea className={inputCls} name="cat_descripcion" rows={2} placeholder="Detalles..." /></Field>
                <div className="flex justify-end">
                  <Btn variant="gradient" type="submit"><Plus size={12} /> Agregar categoría</Btn>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: copiar año */}
      <Modal
        open={Boolean(modalClonar)}
        onClose={() => setModalClonar(null)}
        title={`Copiar año ${modalClonar?.origen_anio ?? ""} a otro año`}
        sub="Crea en el año destino las mismas carpetas (ACMG / Yamaha), con sus fechas, categorías y cronograma."
        footer={
          cloneResult ? (
            <Btn variant="gradient" onClick={() => setModalClonar(null)}>Cerrar</Btn>
          ) : (
            <>
              <Btn variant="secondary" onClick={() => setModalClonar(null)}>Cancelar</Btn>
              <Btn variant="gradient" type="submit" form="clonarForm" disabled={clonando}>
                {clonando ? "Copiando..." : "Copiar año"}
              </Btn>
            </>
          )
        }
      >
        {cloneResult ? (
          <div className="space-y-3">
            <div className="rounded-[12px] border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <div className="text-sm font-black text-emerald-600">¡Año {cloneResult.destino_anio} copiado!</div>
              <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                <li>
                  Carpetas creadas: <strong className="text-foreground">{cloneResult.series_creadas}</strong>
                  {cloneResult.series_omitidas > 0 ? ` · omitidas (ya existían): ${cloneResult.series_omitidas}` : ""}
                </li>
                <li>Fechas en borrador: <strong className="text-foreground">{cloneResult.fechas_creadas}</strong></li>
                <li>Categorías participantes: <strong className="text-foreground">{cloneResult.categorias_creadas}</strong></li>
                <li>Actividades de cronograma: <strong className="text-foreground">{cloneResult.cronograma_creado}</strong></li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-400">
              Revisa la sección «Año {cloneResult.destino_anio}» para ajustar fechas, circuitos y estados antes de publicar.
            </p>
          </div>
        ) : (
          <form id="clonarForm" onSubmit={clonarAnio} className="space-y-3.5" data-qa="clonar-form">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Año de origen">
                <input className={inputCls} value={modalClonar?.origen_anio ?? ""} disabled />
              </Field>
              <Field label="Año de destino" error={cloneError}>
                <input
                  type="number"
                  className={inputCls}
                  value={cloneDraft.destino_anio ?? ""}
                  onChange={(e) => setCloneDraft({ ...cloneDraft, destino_anio: e.target.value })}
                  required
                  min="2000"
                  max="2100"
                />
              </Field>
            </div>
            <Field label="Qué copiar">
              <div className="space-y-2 rounded-[12px] border border-border bg-muted/20 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cloneDraft.copiar_fechas} onChange={(e) => setCloneDraft({ ...cloneDraft, copiar_fechas: e.target.checked })} className="w-4 h-4 rounded border-border accent-blue-600" />
                  <span className="text-sm">Fechas (como borrador)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cloneDraft.copiar_categorias} onChange={(e) => setCloneDraft({ ...cloneDraft, copiar_categorias: e.target.checked })} className="w-4 h-4 rounded border-border accent-blue-600" />
                  <span className="text-sm">Categorías participantes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cloneDraft.copiar_cronograma} onChange={(e) => setCloneDraft({ ...cloneDraft, copiar_cronograma: e.target.checked })} className="w-4 h-4 rounded border-border accent-blue-600" />
                  <span className="text-sm">Cronograma de actividades</span>
                </label>
              </div>
            </Field>
          </form>
        )}
      </Modal>
    </main>
  );
}