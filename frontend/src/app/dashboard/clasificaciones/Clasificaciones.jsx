"use client";

import { useEffect, useMemo, useState } from "react";
import { createClasificacion, deleteClasificacion, getParrillaEventoCategoria, listClasificaciones, saveClasificacionTiempoEvento } from "@/lib/clasificacionesApi";
import TablaClasificacionOficial from "./TablaClasificacionOficial";
import styles from "./clasificaciones.module.css";
import { SearchSelect } from "@/components/kit";
import { useConfirm } from "@/components/ConfirmProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function StatCard({ label, value }) {
  return (
    <article className={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

// ─────────────────────────────────────────────
//  Helpers de tiempo
// ─────────────────────────────────────────────
function parseTimeToMs(t) {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length !== 2) return null;
  const mm = Number(parts[0]);
  const ssParts = parts[1].split(".");
  const ss = Number(ssParts[0]);
  const ms = ssParts[1] ? Number(ssParts[1].padEnd(3, "0")) : 0;
  if (isNaN(mm) || isNaN(ss) || isNaN(ms)) return null;
  return mm * 60000 + ss * 1000 + ms;
}

function formatMsToTime(ms) {
  if (ms == null || isNaN(ms)) return null;
  const minutes = Math.floor(ms / 60000);
  const rest = ms % 60000;
  const seconds = Math.floor(rest / 1000);
  const millis = rest % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export default function Clasificaciones() {
  const { confirm } = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState({ eventos: [], categorias: [] });

  // Paginación tabla guardados
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [filterCategoria, setFilterCategoria] = useState("");
  const [eventoId, setEventoId] = useState("");

  // Add tab state
  const [categoriaForAdd, setCategoriaForAdd] = useState("");
  const [inscritosCategoria, setInscritosCategoria] = useState([]);
  const [savedParrilla, setSavedParrilla] = useState([]);

  // ─── Carga inicial ───────────────────────────────────────
  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listClasificaciones();
      setItems(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las clasificaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { setPage(1); }, [items.length]);

  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const query = eventoId ? `?evento_id=${encodeURIComponent(eventoId)}` : "";
        const res = await fetch(`${API_URL}/api/public/inscripciones/options${query}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!mounted) return;
        setOptions({
          eventos: Array.isArray(data.eventos) ? data.eventos : [],
          categorias: Array.isArray(data.categorias) ? data.categorias : [],
        });
      } catch {
        if (mounted) setOptions({ eventos: [], categorias: [] });
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => { mounted = false; };
  }, [eventoId]);

  useEffect(() => {
    if (!eventoId || !filterCategoria || activeTab !== "results") return;
    loadSavedParrilla(eventoId, filterCategoria);
  }, [eventoId, filterCategoria, activeTab]);

  // ─── Stats ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const withTimes = items.filter((it) => it.posicion != null).length;
    return {
      total: items.length,
      withTimes,
      categorias: new Set(items.map((it) => it.categoria?.id || it.categoria_id)).size,
      campeonatos: new Set(items.map((it) => it.categoria?.campeonato?.id || it.campeonato_id)).size,
    };
  }, [items]);

  const eventoOptions = options.eventos;

  const eventoGroups = useMemo(() => {
    const map = {};
    eventoOptions.forEach((ev) => {
      const key = ev.campeonato_nombre || "Sin campeonato";
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
  }, [eventoOptions]);

  const categoriaOptions = useMemo(() => {
    if (!eventoId) return options.categorias;
    const eventoSeleccionado = options.eventos.find((evento) => String(evento.id) === String(eventoId));
    if (!eventoSeleccionado?.campeonato_id) return options.categorias;
    return options.categorias.filter((categoria) => String(categoria.campeonato_id) === String(eventoSeleccionado.campeonato_id));
  }, [options.categorias, options.eventos, eventoId]);

  // ─── Filtrado y ordenado de guardados ────────────────────
  const filteredItems = useMemo(() => {
    let list = items;
    if (filterCategoria) list = list.filter((it) => String(it.categoria?.id || it.categoria_id || "") === filterCategoria);
    return list;
  }, [items, filterCategoria]);


  const officialEventMeta = useMemo(() => {
    const selectedEvent = options.eventos.find((evento) => String(evento.id) === String(eventoId));
    const selectedCategory = options.categorias.find((categoria) => String(categoria.id) === String(filterCategoria));
    const campeonato = selectedEvent?.campeonato_nombre || selectedEvent?.nombre || "Clasificación oficial";
    const circuito = selectedEvent?.circuito_nombre || "";
    const valida = selectedEvent?.valida || selectedEvent?.numero_valida || 1;
    const hora = selectedEvent?.hora || "";
    const fechaValue = selectedEvent?.fecha_inicio || selectedEvent?.fecha || new Date();
    const fecha = (() => {
      const parsed = new Date(fechaValue);
      return Number.isNaN(parsed.getTime()) ? new Date().toLocaleDateString("es-GT") : parsed.toLocaleDateString("es-GT");
    })();

    return {
      campeonato,
      circuito,
      valida,
      fecha,
      hora,
      categoriaNombre: selectedCategory?.nombre || selectedCategory?.label || "Categoría",
    };
  }, [options.eventos, options.categorias, eventoId, filterCategoria]);

  const officialRows = useMemo(() => {
  if (!filterCategoria) return [];

  return savedParrilla.map((item) => ({
    pos: item.posicion,
    dorsal: item.dorsal_asignado || "-",
    nombre: item.piloto_nombre || "-",
    clase: item.categoria_nombre || "-",
    vuelta1: item.vuelta_1 || "-",   // ← viene null de la API
    vuelta2: item.vuelta_2 || "-",   // ← viene null de la API
    mejor_tiempo: item.mejor_tiempo || "-",
  }));
}, [savedParrilla, filterCategoria]);

  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => {
    if (a.posicion == null && b.posicion == null) return 0;
    if (a.posicion == null) return 1;
    if (b.posicion == null) return -1;
    return Number(a.posicion) - Number(b.posicion);
  }), [filteredItems]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));

  // ─────────────────────────────────────────────────────────
  //  TABLA DE VISTA PREVIA EN TIEMPO REAL
  //  Se calcula directamente desde inscritosCategoria
  //  sin necesidad de guardar ni recargar
  // ─────────────────────────────────────────────────────────
  const tablaClasificacion = useMemo(() => {
    // Solo pilotos que tengan al menos un tiempo ingresado y válido
    const conTiempos = inscritosCategoria
      .map((ins) => {
        const v1ms = parseTimeToMs(ins.vuelta_1);
        const v2ms = parseTimeToMs(ins.vuelta_2);
        const ambos = [v1ms, v2ms].filter((x) => x != null);
        const mejorMs = ambos.length ? Math.min(...ambos) : null;
        return { ins, v1ms, v2ms, mejorMs };
      })
      .filter((row) => row.mejorMs != null); // solo los que tienen al menos un tiempo válido

    // Ordenar de menor a mayor (mejor tiempo primero)
    conTiempos.sort((a, b) => a.mejorMs - b.mejorMs);

    // Asignar posición y calcular diferencia respecto al primero (referencia)
    return conTiempos.map((row, idx) => {
      const diffVsLider = idx === 0 ? 0 : row.mejorMs - conTiempos[0].mejorMs;
      const diffVsAnterior = idx === 0 ? null : row.mejorMs - conTiempos[idx - 1].mejorMs;
      return {
        inscripcionId: row.ins.id,
        eventoId: row.ins.evento_id,
        categoriaId: row.ins.categoria_id,
        posicion: idx + 1,
        pilotoNombre: row.ins.piloto?.usuario
          ? `${row.ins.piloto.usuario.nombre} ${row.ins.piloto.usuario.apellido}`.trim()
          : row.ins.piloto_id || "—",
        dorsal: row.ins.dorsal_asignado,
        vuelta1: row.v1ms != null ? formatMsToTime(row.v1ms) : "—",
        vuelta2: row.v2ms != null ? formatMsToTime(row.v2ms) : "—",
        mejorTiempo: formatMsToTime(row.mejorMs),
        mejorVuelta: row.v1ms != null && row.v2ms != null
          ? (row.v1ms <= row.v2ms ? "V1" : "V2")
          : (row.v1ms != null ? "V1" : "V2"),
        diffVsLider: idx === 0 ? "Líder" : `+${formatMsToTime(diffVsLider)}`,
        diffVsAnterior: diffVsAnterior != null ? `+${formatMsToTime(diffVsAnterior)}` : "—",
      };
    });
  }, [inscritosCategoria]);

  // ─── Cargar inscritos de categoría ───────────────────────
  const loadInscritosForCategoria = async (eventoSeleccionadoId, categoriaId) => {
    if (!eventoSeleccionadoId || !categoriaId) { setInscritosCategoria([]); return; }
    try {
      const res = await fetch(`${API_URL}/api/public/inscripciones`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const inscritos = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
      const filtered = inscritos.filter(
        (ins) => String(ins.evento?.id || ins.evento_id || "") === String(eventoSeleccionadoId)
          && String(ins.categoria?.id || ins.categoria_id || "") === String(categoriaId)
      );
      setInscritosCategoria(filtered.map((ins) => ({ ...ins, vuelta_1: "", vuelta_2: "" })));
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los pilotos de la categoría.");
    }
  };

  const loadSavedParrilla = async (eventoSeleccionadoId, categoriaId) => {
    if (!eventoSeleccionadoId || !categoriaId) {
      setSavedParrilla([]);
      return;
    }

    try {
      const items = await getParrillaEventoCategoria(eventoSeleccionadoId, categoriaId);
      setSavedParrilla(Array.isArray(items) ? items : []);
    } catch {
      setSavedParrilla([]);
    }
  };

  const handleCategoriaForAddChange = async (value) => {
    setCategoriaForAdd(value);
    setPage(1);
    await loadInscritosForCategoria(eventoId, value);
    await loadSavedParrilla(eventoId, value);
  };

  const handleEventoChange = async (value) => {
    setEventoId(value);
    setCategoriaForAdd("");
    setInscritosCategoria([]);
    setSavedParrilla([]);
    setFilterCategoria("");
  };

  // ─── Formateo automático del tiempo al escribir ──────────
  const handleTimeChange = (inscripcionId, field, value) => {
    let digits = value.replace(/\D/g, "").slice(0, 7);
    let display = digits;
    if (digits.length > 4) {
      display = `${digits.slice(0, 2)}:${digits.slice(2, 4)}.${digits.slice(4)}`;
    } else if (digits.length > 2) {
      display = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    setInscritosCategoria((cur) =>
      cur.map((it) => (it.id === inscripcionId ? { ...it, [field]: display } : it))
    );
  };

  // ─── Guardar clasificaciones ─────────────────────────────
  const submitClasificacionesBatch = async () => {
  if (!eventoId) return setError("Selecciona un evento.");
  if (!categoriaForAdd) return setError("Selecciona una categoría.");
  if (tablaClasificacion.length === 0)
    return setError("Ingresa al menos un tiempo válido antes de guardar.");

  setSubmitting(true);
  setError("");

  try {
    // Resolver tablaClasificacion como valor síncrono (ya es useMemo, no Promise)
    const filas = Array.isArray(tablaClasificacion) ? tablaClasificacion : [];

    for (const row of filas) {
      const ins = inscritosCategoria.find(
        (item) => String(item.id) === String(row.inscripcionId)
      );
      if (!ins) continue;

      const pilotoId    = ins.piloto?.id || ins.piloto_id;
      const campeonatoId = ins.categoria?.campeonato_id
        || ins.campeonato_id
        || "";

      // 1. Guardar clasificación general
      await createClasificacion({
        piloto_id:    pilotoId,
        categoria_id: categoriaForAdd,
        campeonato_id: campeonatoId,
        puntos_total: 0,
        posicion:     row.posicion,
        mejor_tiempo: row.mejorTiempo,
      });

      // 2. Guardar tiempos por vuelta — asegurar que evento_id llegue correcto
      const eventoIdReal = ins.evento_id
        || ins.evento?.id
        || eventoId;  // fallback al selector

      const payload = {
        categoria_id:  categoriaForAdd,
        inscripcion_id: row.inscripcionId,
        vuelta_1: ins.vuelta_1 || null,
        vuelta_2: ins.vuelta_2 || null,
      };
      console.log('DEBUG: sending payload to saveClasificacionTiempoEvento', { eventoIdReal, payload });
      await saveClasificacionTiempoEvento(eventoIdReal, payload);
    }

    await loadItems();
    await loadInscritosForCategoria(eventoId, categoriaForAdd);
    await loadSavedParrilla(eventoId, categoriaForAdd);
    setCategoriaForAdd("");
    setInscritosCategoria([]);

  } catch (err) {
    setError(err?.message || "Error guardando clasificaciones.");
  } finally {
    setSubmitting(false);
  }
};

  // ─── Eliminar ────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!(await confirm({ title: "Eliminar clasificación", message: "¿Eliminar esta clasificación? Esta acción no se puede deshacer.", confirmText: "Eliminar" }))) return;
    setError("");
    try {
      await deleteClasificacion(id);
      await loadItems();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la clasificación.");
    }
  };

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Área operativa</p>
          <h1 className={styles.title}>CLASIFICACIONES</h1>
          <p className={styles.subtitle}>
            Ingresa los tiempos de vuelta por piloto. El sistema calcula automáticamente el mejor tiempo y genera la parrilla de salida.
          </p>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.statsGrid}>
          <StatCard label="Registros guardados" value={stats.total} />
          <StatCard label="Con tiempos" value={stats.withTimes} />
          <StatCard label="Categorías" value={stats.categorias} />
          <StatCard label="Campeonatos" value={stats.campeonatos} />
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(148,163,184,0.2)", marginBottom: 20 }}>
          {[["add", "Ingresar tiempos"], ["results", "Parrilla guardada"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                padding: "12px 20px",
                background: activeTab === key ? "#0ea5a4" : "transparent",
                color: activeTab === key ? "#fff" : "#475569",
                border: "none",
                cursor: "pointer",
                fontWeight: activeTab === key ? "bold" : "normal",
                borderBottom: activeTab === key ? "3px solid #0ea5a4" : "3px solid transparent",
                fontSize: 14,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB 1 — INGRESAR TIEMPOS
        ══════════════════════════════════════════════════ */}
        {activeTab === "add" && (
          <div className={styles.layoutGrid}>
            {/* Panel izquierdo: ingreso de tiempos */}
            <section className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Tiempos por piloto</h2>
                  <p className={styles.sectionText}>
                    Selecciona la categoría, ingresa Vuelta 1 y Vuelta 2 (formato MM:SS.mmm).
                    El sistema toma automáticamente el mejor de los dos tiempos.
                  </p>
                </div>
              </div>

              {/* Selectores */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 280 }}>
                  <SearchSelect groups={eventoGroups} value={eventoId || ""} onChange={(v) => handleEventoChange(v)} placeholder="(Seleccionar evento)" searchPlaceholder="Buscar por nombre o campeonato..." inputClassName={styles.input} />
                </div>
                <select
                  className={styles.input}
                  value={categoriaForAdd}
                  onChange={(e) => handleCategoriaForAddChange(e.target.value)}
                  style={{ minWidth: 260, color: "#0f172a" }}
                  disabled={!eventoId}
                >
                  <option value="">{eventoId ? "(Seleccionar categoría)" : "Primero seleccione un evento"}</option>
                  {categoriaOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre || c.label || c.id}</option>
                  ))}
                </select>
              </div>

              {optionsLoading ? (
                <p className={styles.fieldHint}>Cargando eventos y categorías...</p>
              ) : null}

              {/* Tabla de ingreso de tiempos */}
              {inscritosCategoria.length === 0 ? (
                <div style={{ color: "#64748b", padding: "16px", background: "rgba(148,163,184,0.06)", borderRadius: 8 }}>
                  Selecciona un evento y una categoría para ver los pilotos inscritos.
                </div>
              ) : (
                <div style={{ border: "1px solid rgba(148,163,184,0.15)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  {/* Encabezado */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 160px 110px 110px",
                    gap: 8,
                    padding: "10px 14px",
                    background: "rgba(14,165,164,0.08)",
                    fontWeight: "bold",
                    fontSize: 13,
                    color: "#0ea5a4",
                    borderBottom: "1px solid rgba(148,163,184,0.15)",
                  }}>
                    <span>Piloto</span>
                    <span>Vuelta 1</span>
                    <span>Vuelta 2</span>
                    <span>Mejor</span>
                    <span>Diferencia</span>
                  </div>

                  {/* Filas */}
                  {inscritosCategoria.map((ins) => {
                    const v1ms = parseTimeToMs(ins.vuelta_1);
                    const v2ms = parseTimeToMs(ins.vuelta_2);
                    const ambos = [v1ms, v2ms].filter((x) => x != null);
                    const mejorMs = ambos.length ? Math.min(...ambos) : null;
                    const mejor = mejorMs != null ? formatMsToTime(mejorMs) : "—";
                    const difMs = v1ms != null && v2ms != null ? Math.abs(v2ms - v1ms) : null;
                    const dif = difMs != null ? formatMsToTime(difMs) : "—";
                    const esMejorV1 = v1ms != null && v2ms != null && v1ms <= v2ms;
                    const esMejorV2 = v1ms != null && v2ms != null && v2ms < v1ms;
                    const pilotoNombre = ins.piloto?.usuario
                      ? `${ins.piloto.usuario.nombre} ${ins.piloto.usuario.apellido}`.trim()
                      : ins.piloto_id || "—";

                    return (
                      <div
                        key={ins.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 160px 160px 110px 110px",
                          gap: 8,
                          padding: "10px 14px",
                          alignItems: "center",
                          borderBottom: "1px solid rgba(148,163,184,0.08)",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 14 }}>{pilotoNombre}</strong>
                          {ins.dorsal_asignado && (
                            <div style={{ fontSize: 11, color: "#64748b" }}>Dorsal #{ins.dorsal_asignado}</div>
                          )}
                        </div>

                        {/* Vuelta 1 */}
                        <div style={{ position: "relative" }}>
                          <input
                            className={styles.input}
                            placeholder="01:32.450"
                            value={ins.vuelta_1}
                            onChange={(e) => handleTimeChange(ins.id, "vuelta_1", e.target.value)}
                            maxLength={10}
                            style={{
                              width: "100%",
                              border: esMejorV1 ? "1.5px solid #0ea5a4" : undefined,
                              background: esMejorV1 ? "rgba(14,165,164,0.07)" : undefined,
                            }}
                          />
                          {esMejorV1 && (
                            <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#0ea5a4", fontWeight: "bold" }}>
                              ★
                            </span>
                          )}
                        </div>

                        {/* Vuelta 2 */}
                        <div style={{ position: "relative" }}>
                          <input
                            className={styles.input}
                            placeholder="01:32.450"
                            value={ins.vuelta_2}
                            onChange={(e) => handleTimeChange(ins.id, "vuelta_2", e.target.value)}
                            maxLength={10}
                            style={{
                              width: "100%",
                              border: esMejorV2 ? "1.5px solid #0ea5a4" : undefined,
                              background: esMejorV2 ? "rgba(14,165,164,0.07)" : undefined,
                            }}
                          />
                          {esMejorV2 && (
                            <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#0ea5a4", fontWeight: "bold" }}>
                              ★
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: 13, fontWeight: "bold", color: mejorMs != null ? "#0ea5a4" : "#94a3b8" }}>
                          {mejor}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{dif}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={submitClasificacionesBatch}
                disabled={submitting || !categoriaForAdd || tablaClasificacion.length === 0}
                style={{ width: "100%" }}
              >
                {submitting ? "Guardando..." : `Guardar clasificación (${tablaClasificacion.length} piloto${tablaClasificacion.length !== 1 ? "s" : ""} con tiempo)`}
              </button>
            </section>

            {/* ──────────────────────────────────────────────────
                PANEL DERECHO: TABLA EN TIEMPO REAL
                Se actualiza automáticamente al ingresar tiempos
            ────────────────────────────────────────────────── */}
            <aside className={styles.sideColumn}>
              <section className={styles.cardSection}>
                <h2 className={styles.sectionTitle}>Parrilla de salida</h2>
                <p className={styles.sectionText} style={{ marginBottom: 12 }}>
                  Vista previa en tiempo real para el evento y la categoría seleccionados.
                </p>

                {tablaClasificacion.length === 0 ? (
                  <div style={{
                    color: "#64748b",
                    fontSize: 13,
                    padding: "20px 12px",
                    textAlign: "center",
                    background: "rgba(148,163,184,0.05)",
                    borderRadius: 8,
                    border: "1px dashed rgba(148,163,184,0.2)",
                  }}>
                    La parrilla aparecerá aquí cuando ingreses tiempos válidos.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Encabezado */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr 80px 80px",
                      gap: 6,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: "bold",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "1px solid rgba(148,163,184,0.15)",
                    }}>
                      <span>P</span>
                      <span>Piloto</span>
                      <span style={{ textAlign: "right" }}>Mejor</span>
                      <span style={{ textAlign: "right" }}>+Líder</span>
                    </div>

                    {tablaClasificacion.map((row) => {
                      const isPole = row.posicion === 1;
                      return (
                        <div
                          key={row.posicion}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "32px 1fr 80px 80px",
                            gap: 6,
                            padding: "8px 10px",
                            borderRadius: 8,
                            background: isPole ? "rgba(14,165,164,0.10)" : "rgba(148,163,184,0.04)",
                            border: isPole ? "1px solid rgba(14,165,164,0.25)" : "1px solid rgba(148,163,184,0.08)",
                            alignItems: "center",
                          }}
                        >
                          {/* Posición */}
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: isPole ? "#0ea5a4" : "rgba(148,163,184,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: "bold",
                            color: isPole ? "#fff" : "#475569",
                          }}>
                            {row.posicion}
                          </div>

                          {/* Piloto */}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: "600", color: isPole ? "#0ea5a4" : "#0f172a" }}>
                              {row.pilotoNombre}
                              {isPole && <span style={{ marginLeft: 6, fontSize: 10, color: "#0ea5a4" }}>POLE</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              #{row.dorsal} · V1: {row.vuelta1} · V2: {row.vuelta2}
                              <span style={{
                                marginLeft: 6,
                                fontSize: 10,
                                fontWeight: "bold",
                                color: "#0ea5a4",
                              }}>
                                ({row.mejorVuelta} ★)
                              </span>
                            </div>
                          </div>

                          {/* Mejor tiempo */}
                          <div style={{ textAlign: "right", fontSize: 12, fontWeight: "bold", color: "#0f172a" }}>
                            {row.mejorTiempo}
                          </div>

                          {/* Diferencia vs líder */}
                          <div style={{ textAlign: "right", fontSize: 11, color: isPole ? "#0ea5a4" : "#64748b", fontWeight: isPole ? "bold" : "normal" }}>
                            {row.diffVsLider}
                          </div>
                        </div>
                      );
                    })}

                    {/* Leyenda inferior */}
                    <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: 8 }}>
                      ★ = vuelta que define el mejor tiempo · +Líder = diferencia vs pole position
                    </div>
                  </div>
                )}
              </section>
            </aside>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2 — TABLA OFICIAL Y REGISTROS GUARDADOS
        ══════════════════════════════════════════════════ */}
        {activeTab === "results" && (
          <section className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Tabla oficial de clasificación</h2>
                <p className={styles.sectionText}>
                  Selecciona un evento y una categoría; la tabla se alimenta directamente de los registros guardados en el sistema.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap", alignItems: "center" }}>
              <select
                className={styles.input}
                value={filterCategoria}
                onChange={(e) => { setFilterCategoria(e.target.value); setPage(1); }}
                style={{ minWidth: 220, color: "#0f172a" }}
              >
                <option value="">Selecciona una categoría</option>
                {categoriaOptions.map((c) => <option key={c.id} value={c.id}>{c.nombre || c.label || c.id}</option>)}
              </select>
              <div style={{ minWidth: 220 }}>
                <SearchSelect clearable groups={eventoGroups} value={eventoId || ""} onChange={(v) => { handleEventoChange(v); setFilterCategoria(""); setPage(1); }} placeholder="Filtrar por evento" searchPlaceholder="Buscar evento..." inputClassName={styles.input} />
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => { setFilterCategoria(""); setEventoId(""); setPage(1); }}
              >
                Limpiar
              </button>
            </div>

            {filterCategoria ? (
              <TablaClasificacionOficial
                filas={officialRows}
                campeonato={officialEventMeta.campeonato}
                circuito={officialEventMeta.circuito}
                valida={officialEventMeta.valida}
                fecha={officialEventMeta.fecha}
                categoria={officialEventMeta.categoriaNombre}
                hora={officialEventMeta.hora}
                logoIzquierdaUrl={null}
                logoDerechaUrl={null}
                maxRows={officialRows.length || 1}
              />
            ) : (
              <div style={{ color: "#64748b", padding: "20px", background: "rgba(148,163,184,0.06)", borderRadius: 8, border: "1px dashed rgba(148,163,184,0.2)" }}>
                Selecciona una categoría para ver la tabla oficial de clasificación.
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Registros guardados</h2>
                  <p className={styles.sectionText}>
                    Clasificaciones persistidas en la base de datos.
                  </p>
                </div>
              </div>

              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>Pos.</span>
                  <span>Piloto</span>
                  <span>Categoría</span>
                  <span>Mejor tiempo</span>
                  <span>+Líder</span>
                  <span>Acciones</span>
                </div>

                {loading ? (
                  <div className={styles.emptyState}>Cargando...</div>
                ) : sortedItems.filter((it) => it.posicion != null).length === 0 ? (
                  <div className={styles.emptyState}>No hay clasificaciones guardadas con tiempos.</div>
                ) : (
                  (() => {
                    const clasificados = sortedItems.filter((it) => it.posicion != null);
                    const liderMs = parseTimeToMs(clasificados[0]?.mejor_tiempo);
                    return clasificados
                      .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                      .map((item) => {
                        const actualMs = parseTimeToMs(item.mejor_tiempo);
                        const diffMs = liderMs != null && actualMs != null ? actualMs - liderMs : null;
                        const diff = diffMs === 0 ? "Líder" : diffMs != null ? `+${formatMsToTime(diffMs)}` : "—";
                        const pilotoNombre = item.piloto?.usuario
                          ? `${item.piloto.usuario.nombre} ${item.piloto.usuario.apellido}`.trim()
                          : item.piloto_id || "—";
                        return (
                          <div key={item.id} className={styles.tableRow}>
                            <span style={{ fontWeight: "bold", color: item.posicion === 1 ? "#0ea5a4" : undefined }}>
                              {item.posicion}
                            </span>
                            <span>{pilotoNombre}</span>
                            <span>{item.categoria?.nombre || "—"}</span>
                            <span style={{ fontWeight: "bold" }}>{item.mejor_tiempo || "—"}</span>
                            <span style={{ color: item.posicion === 1 ? "#0ea5a4" : "#64748b", fontWeight: item.posicion === 1 ? "bold" : "normal" }}>
                              {diff}
                            </span>
                            <div className={styles.rowActions}>
                              <button type="button" className={styles.textButtonDanger} onClick={() => handleDelete(item.id)}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      });
                  })()
                )}
              </div>

              {!loading && sortedItems.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#475569" }}>Mostrar</span>
                    <select className={styles.input} style={{ width: 70, padding: "4px 8px", fontSize: 13 }} value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}>
                      {[5, 8, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span style={{ fontSize: 13, color: "#475569" }}>por página</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.3)", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>Anterior</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} type="button" onClick={() => setPage(p)} style={{ padding: "6px 12px", borderRadius: 6, border: p === page ? "1px solid #0ea5a4" : "1px solid rgba(148,163,184,0.3)", background: p === page ? "#0ea5a4" : "#fff", color: p === page ? "#fff" : "#0f172a", cursor: "pointer", fontSize: 13, minWidth: 34 }}>{p}</button>
                    ))}
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.3)", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>Siguiente</button>
                  </div>
                  <span style={{ fontSize: 13, color: "#475569" }}>Página {page} de {totalPages} ({sortedItems.length} resultados)</span>
                </div>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}