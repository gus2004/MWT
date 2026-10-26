"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CalendarClock, ChevronDown, ChevronRight, FileSpreadsheet, FileText, Filter, Gavel, Info, Plus, Shield, Trash2 } from "lucide-react";
import { Badge, Btn, Empty, Field, Kpi, Modal, Tabs, inputCls, selectCls } from "@/components/kit";
import { soporteApi, getCurrentUser, fileUrl, descargarReporteComisariato } from "@/lib/soporteApi";
import { getPublicInscripciones } from "@/lib/publicApi";
import { useConfirm } from "@/components/ConfirmProvider";

const ESTADO_BADGE = {
  PENDIENTE: ["blue", "Pendiente"],
  EN_PROCESO: ["warning", "En proceso"],
  RESUELTO: ["success", "Resuelto"],
};

const EST_APELACION = {
  PENDIENTE: ["warning", "Pendiente"],
  ACEPTADA: ["success", "Aceptada"],
  RECHAZADA: ["error", "Rechazada"],
};

const EST_REVISION = {
  PENDIENTE: ["warning", "Pendiente"],
  APROBADA: ["success", "Aprobada"],
  RECHAZADA: ["error", "Rechazada"],
  CONDICIONAL: ["blue", "Condicional"],
};

export default function ComisarioPage() {
  const { confirm } = useConfirm();
  const [tab, setTab] = useState("infracciones");
  const [sanciones, setSanciones] = useState([]);
  const [apelaciones, setApelaciones] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [items, setItems] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [alertas, setAlertas] = useState([]);  const [tipos, setTipos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [wDraft, setWDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [wEvidencias, setWEvidencias] = useState([]); // evidencias subidas al backend
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
  const [reglamento, setReglamento] = useState([]);
  const [regForm, setRegForm] = useState({ codigo: "", titulo: "", area: "CONDUCTA", texto: "" });
  // Subida del PDF del reglamento por evento (leído por la IA)
  const [regPdfEvento, setRegPdfEvento] = useState("");
  const [regPdfFile, setRegPdfFile] = useState(null);
  const [subiendoPdf, setSubiendoPdf] = useState(false);
  const [docReglamentos, setDocReglamentos] = useState([]);
  const [regSaving, setRegSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  // Checklist de inspección mecánica: filtros de la lista de pilotos
  const [revBusq, setRevBusq] = useState("");
  const [revEstadoF, setRevEstadoF] = useState("todos");
  const [eventoFiltro, setEventoFiltro] = useState("todos"); // "todos" | id de evento
  const [exportando, setExportando] = useState(""); // "" | "csv" | "pdf"
  // Desglose del wizard: evento → categoría → búsqueda del piloto
  const [wpEvento, setWpEvento] = useState("");
  const [wpCategoria, setWpCategoria] = useState("");
  const [wpBusq, setWpBusq] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, a, r, it, au, tp, ins, al, rg, docr] = await Promise.all([
        soporteApi.listSanciones().catch(() => []),
        soporteApi.listApelaciones().catch(() => []),
        soporteApi.listRevisionesTecnicas().catch(() => []),
        soporteApi.listItemsChecklist().catch(() => []),
        soporteApi.listAuditoria().catch(() => []),
        soporteApi.listTiposSancion().catch(() => []),
        getPublicInscripciones().catch(() => []),
        soporteApi.alertasIA().catch(() => []),
        soporteApi.listReglamento().catch(() => []),
        soporteApi.listReglamentoDocumentos().catch(() => []),
      ]);
      setSanciones(s);
      setApelaciones(a);
      setRevisiones(r);
      setItems(it);
      setAuditoria(au);
      setTipos(tp);
      setInscripciones(ins);
      setAlertas(al);
      setReglamento(rg);
      setDocReglamentos(docr);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los datos del comisariato.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Gestión por evento: selector, listas filtradas y KPIs ──
  const eventosDisponibles = useMemo(() => {
    const map = new Map();
    (inscripciones || []).forEach((ins) => {
      const ev = ins.evento;
      if (ev?.id && !map.has(ev.id)) {
        map.set(ev.id, { id: ev.id, nombre: ev.nombre, fecha: ev.fecha_inicio || ev.fecha || null, estado: ev.estado || null });
      }
    });
    return [...map.values()].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  }, [inscripciones]);

  const eventoSeleccionado = eventosDisponibles.find((e) => e.id === eventoFiltro) || null;

  const sancionesF = useMemo(
    () => (eventoFiltro === "todos" ? sanciones : sanciones.filter((s) => s.evento?.id === eventoFiltro || s.inscripcion?.evento?.id === eventoFiltro)),
    [sanciones, eventoFiltro],
  );
  const apelacionesF = useMemo(
    () => (eventoFiltro === "todos" ? apelaciones : apelaciones.filter((a) => a.inscripcion?.evento?.id === eventoFiltro || a.sancion?.inscripcion?.evento?.id === eventoFiltro)),
    [apelaciones, eventoFiltro],
  );
  const revisionesF = useMemo(
    () => (eventoFiltro === "todos" ? revisiones : revisiones.filter((r) => r.inscripcion?.evento?.id === eventoFiltro)),
    [revisiones, eventoFiltro],
  );

  // Lista del checklist de inspección con su propio filtro de búsqueda/estado
  const revisionesCheckF = useMemo(() => {
    const q = revBusq.trim().toLowerCase();
    return (revisionesF || []).filter((rev) => {
      if (revEstadoF !== "todos" && rev.estado !== revEstadoF) return false;
      if (!q) return true;
      const nombre = `${rev.inscripcion?.piloto?.usuario?.nombre || ""} ${rev.inscripcion?.piloto?.usuario?.apellido || ""}`.toLowerCase();
      const dorsal = String(rev.inscripcion?.dorsal_asignado ?? "");
      const categoria = String(rev.inscripcion?.categoria?.nombre || "").toLowerCase();
      const moto = `${rev.inscripcion?.motocicleta?.marca?.nombre || ""} ${rev.inscripcion?.motocicleta?.modelo || ""}`.toLowerCase();
      return nombre.includes(q) || dorsal.includes(q) || categoria.includes(q) || moto.includes(q);
    });
  }, [revisionesF, revBusq, revEstadoF]);

  const kpisF = useMemo(() => {
    const evidencias = (sancionesF || []).reduce((acc, s) => acc + (s.evidencias?.length || 0), 0);
    return {
      infracciones: (sancionesF || []).length,
      apelaciones: (apelacionesF || []).length,
      apelacionesPendientes: (apelacionesF || []).filter((a) => (a.estado || "") === "PENDIENTE").length,
      revisiones: (revisionesF || []).length,
      revisionesPendientes: (revisionesF || []).filter((r) => (r.estado || "") === "PENDIENTE").length,
      resueltas: (sancionesF || []).filter((s) => (s.estado || "") === "RESUELTO").length,
      evidencias,
    };
  }, [sancionesF, apelacionesF, revisionesF]);

  // ── Exportación del resumen (CSV Excel / PDF oficial) por evento ──
  const exportarResumen = async (formato) => {
    setExportando(formato);
    setError("");
    try {
      const blob = await descargarReporteComisariato(eventoFiltro === "todos" ? "" : eventoFiltro, formato);
      const fecha = new Date();
      const stamp = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}_${String(fecha.getHours()).padStart(2, "0")}${String(fecha.getMinutes()).padStart(2, "0")}`;
      const nombreEvento = eventoSeleccionado ? eventoSeleccionado.nombre : "Todos-los-eventos";
      const slug = String(nombreEvento).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Resumen-Comisariato-${slug}-${stamp}.${formato}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      setNotice(formato === "pdf" ? "PDF del comisariato generado y descargado." : "CSV del comisariato generado y descargado (compatible con Excel).");
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      setError(err?.message || "No se pudo generar el reporte del comisariato.");
    } finally {
      setExportando("");
    }
  };

  const fechaHora = (d) =>
    d ? new Date(d).toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // ── Desglose de pilotos del wizard: evento → categoría → búsqueda libre ──
  const wpInscripcionSel = useMemo(
    () => inscripciones.find((i) => i.id === wDraft.inscripcion_id) || null,
    [inscripciones, wDraft.inscripcion_id],
  );

  const wpCategorias = useMemo(() => {
    const m = new Map();
    (inscripciones || []).forEach((ins) => {
      if (wpEvento && (ins.evento?.id || "") !== wpEvento) return;
      const c = ins.categoria?.nombre || "—";
      if (!m.has(c)) m.set(c, true);
    });
    return [...m.keys()].sort((a, b) => String(a).localeCompare(String(b)));
  }, [inscripciones, wpEvento]);

  const wpCandidatos = useMemo(() => {
    const q = wpBusq.trim().toLowerCase();
    let lista = (inscripciones || []).filter((ins) => {
      if (wpEvento && (ins.evento?.id || "") !== wpEvento) return false;
      if (wpCategoria && (ins.categoria?.nombre || "—") !== wpCategoria) return false;
      if (!q) return true;
      const nombre = `${ins.piloto?.usuario?.nombre || ""} ${ins.piloto?.usuario?.apellido || ""}`.toLowerCase();
      const dorsal = String(ins.dorsal_asignado ?? ins.dorsal ?? "");
      const moto = `${ins.motocicleta?.marca?.nombre || ""} ${ins.motocicleta?.modelo || ""}`.toLowerCase();
      return nombre.includes(q) || dorsal.includes(q) || moto.includes(q);
    });
    return lista;
  }, [inscripciones, wpEvento, wpCategoria, wpBusq]);

  // Al abrir el wizard, pre-carga el desglose con la inscripción ya elegida (si existe)
  useEffect(() => {
    if (!wizard) return;
    const sel = inscripciones.find((i) => i.id === wDraft.inscripcion_id);
    setWpEvento(sel?.evento?.id || "");
    setWpCategoria(sel?.categoria?.nombre || "");
    setWpBusq("");
  }, [wizard]);

  // ── Tipos de infracción según el evento y su reglamento ──
  // 1) tipos generados del reglamento PDF del evento gestionado (o del evento
  //    del desglose del wizard), 2) los de otros reglamentos, 3) generales.
  const eventoParaTipos = wpInscripcionSel?.evento?.id || (eventoFiltro !== "todos" ? eventoFiltro : "");
  const eventoDelWizard = useMemo(() => {
    if (!eventoParaTipos) return null;
    return eventosDisponibles.find((e) => e.id === eventoParaTipos)?.nombre
      || docReglamentos.find((d) => d.evento_id === eventoParaTipos)?.evento_nombre
      || null;
  }, [eventoParaTipos, eventosDisponibles, docReglamentos]);

  const tiposDelEvento = useMemo(
    () => (eventoParaTipos ? tipos.filter((t) => t.evento_id === eventoParaTipos) : []),
    [tipos, eventoParaTipos],
  );
  const tiposOtrosEventos = useMemo(
    () => tipos.filter((t) => t.evento_id && t.evento_id !== eventoParaTipos),
    [tipos, eventoParaTipos],
  );
  const tiposGenerales = useMemo(() => tipos.filter((t) => !t.evento_id), [tipos]);
  const nombreEventoDeTipo = (evId) =>
    eventosDisponibles.find((e) => e.id === evId)?.nombre
    || docReglamentos.find((d) => d.evento_id === evId)?.evento_nombre
    || "evento sin reglamento";

  const nuevaSancion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await soporteApi.createSancion({
        inscripcion_id: wDraft.inscripcion_id || "",
        comisario_id: getCurrentUser()?.id || "",
        tipo_sancion_id: wDraft.tipo_sancion_id || undefined,
        motivo: wDraft.motivo || "",
        estado: wDraft.estado || "PENDIENTE",
        penalizacion: wDraft.penalizacion || "",
        evidencias: (wEvidencias || []).map((ev) => ev.id),
      });
      setNotice("Infracción registrada correctamente, con evidencias adjuntas.");
      setWizard(false);
      setStep(0);
      setWDraft({});
      setWEvidencias([]);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo registrar la sanción.");
    } finally {
      setSaving(false);
    }
  };

  // ── Evidencias (imágenes/videos): subida real al backend.
  // Solo se guardan como respaldo documental: la IA NO las analiza.
  // Límite de tamaño: 120 MB por archivo (mismo límite del backend).
  const MAX_BYTES_EVIDENCIA = 120 * 1024 * 1024; // 120 MB
  const MAX_MB_EVIDENCIA = "120 MB";
  const esEvidenciaPesada = (file) => file && file.size > MAX_BYTES_EVIDENCIA;

  const subirArchivos = async (files) => {
    if (!files?.length) return;
    const lista = Array.from(files);
    const pesados = lista.filter(esEvidenciaPesada);
    if (pesados.length) {
      const tam = pesados[0].size / (1024 * 1024);
      setError(`⚠️ "${pesados[0].name}" pesa ${tam.toFixed(1)} MB y supera el límite de ${MAX_MB_EVIDENCIA} por archivo. Comprime el video o baja la resolución antes de subirlo.` + (pesados.length > 1 ? ` (${pesados.length} archivo(s) superan el límite.)` : ""));
      return;
    }
    setSubiendoEvidencia(true);
    setError("");
    try {
      for (const file of lista) {
        try {
          const ev = await soporteApi.subirEvidencia(file, wDraft.inscripcion_id || "");
          setWEvidencias((w) => [...w, ev]);
        } catch (errArchivo) {
          setError(errArchivo?.message || `No se pudo subir "${file.name}".`);
        }
      }
    } finally {
      setSubiendoEvidencia(false);
    }
  };

  const quitarEvidencia = async (id) => {
    try {
      await soporteApi.borrarEvidencia(id);
      setWEvidencias((w) => w.filter((x) => x.id !== id));
    } catch (err) {
      setError(err?.message || "No se pudo eliminar la evidencia.");
    }
  };

  // ── Catálogo del reglamento ──
  const guardarArticulo = async (e) => {
    e.preventDefault();
    setRegSaving(true);
    setError("");
    try {
      await soporteApi.createArticuloReglamento({ ...regForm, creado_por: getCurrentUser()?.id || "" });
      setNotice(`Artículo ${regForm.codigo} agregado al catálogo del reglamento.`);
      setRegForm({ codigo: "", titulo: "", area: regForm.area, texto: "" });
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo registrar el artículo.");
    } finally {
      setRegSaving(false);
    }
  };

  const eliminarArticulo = async (art) => {
    if (!(await confirm({ title: "Eliminar artículo", message: `¿Eliminar ${art.codigo} (${art.titulo}) del catálogo del reglamento?`, confirmText: "Eliminar" }))) return;
    try {
      await soporteApi.deleteArticuloReglamento(art.id);
      setNotice(`Artículo ${art.codigo} eliminado.`);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el artículo.");
    }
  };

  const resolver = async (s) => {
    if (!(await confirm({ title: "Resolver infracción", message: "¿Resolver esta infracción y aplicar la sanción? Esta acción no se puede deshacer.", confirmText: "Resolver" }))) return;
    try {
      await soporteApi.updateSancion(s.id, { estado: "RESUELTO" });
      setNotice(`Sanción aplicada a ${s.piloto ? `#${s.piloto.dorsal_asignado}` : ""}.`);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo resolver la infracción.");
    }
  };

  const decidirApelacion = async (a, estado) => {
    if (!(await confirm({ title: estado === "ACEPTADA" ? "Aceptar apelación" : "Rechazar apelación", message: `¿${estado === "ACEPTADA" ? "Aceptar" : "Rechazar"} la apelación? Esta acción no se puede deshacer.`, confirmText: estado === "ACEPTADA" ? "Aceptar" : "Rechazar", danger: estado === "ACEPTADA" ? false : true }))) return;
    try {
      await soporteApi.updateApelacion(a.id, {
        estado,
        comisario_id: getCurrentUser()?.id || "",
        resolucion: estado === "ACEPTADA" ? "Sanción retirada y clasificación recalculada." : "Apelación denegada.",
      });
      setNotice(estado === "ACEPTADA" ? "Sanción retirada y clasificación recalculada." : "Apelación rechazada.");
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la apelación.");
    }
  };

  // ── Checklist de inspección mecánica: verificación rápida por piloto ──
  // Checked = pasó la inspección (APROBADA). Un-check de una aprobada la
  // convierte en rechazada; desmarcar una pendiente no hace nada.
  const marcarRevision = async (rev, paso) => {
    if (paso && rev.estado === "APROBADA") return;
    if (!paso && rev.estado !== "APROBADA") return;
    setSaving(true);
    setError("");
    try {
      const nuevoEstado = paso ? "APROBADA" : "RECHAZADA";
      await soporteApi.updateRevisionTecnica(rev.id, { estado: nuevoEstado, observaciones: rev.observaciones || "" });
      setRevisiones((rs) => rs.map((x) => (x.id === rev.id ? { ...x, estado: nuevoEstado } : x)));
      setNotice(paso ? "Inspección mecánica: el piloto PASÓ (aprobada)." : "Inspección mecánica: el piloto NO PASÓ (rechazada).");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la inspección.");
    } finally {
      setSaving(false);
    }
  };

  const STEPS = ["Tipo", "Descripción", "Evidencia", "Comisario inteligente"];

  const iniciarIA = async () => {
    setAiLoading(true);
    try {
      const tipo = tipos.find((t) => t.id === wDraft.tipo_sancion_id)?.nombre || "";
      const ins = inscripciones.find((i) => i.id === wDraft.inscripcion_id);
      const res = await soporteApi.calificarIA({
        descripcion: wDraft.motivo || "",
        tipo_infraccion: tipo,
        articulo: wDraft.articulo || "",
        dorsal: ins?.dorsal_asignado ?? ins?.dorsal ?? null,
        evento: ins?.evento?.nombre || ins?.evento_nombre || "",
        // Reglamento del evento (si el comisario subió su PDF, la IA lo usa primero)
        evento_id: ins?.evento?.id || ins?.evento_id || "",
        categoria: ins?.categoria?.nombre || "",
      });
      setWDraft((d) => ({
        ...d,
        penalizacion: res.penalizacion || d.penalizacion || "",
        // Artículo sugerido por la IA: se respeta si el comisario ya indicó uno.
        articulo: d.articulo || (res.articulo_sugerido ? `${res.articulo_sugerido.codigo} ${res.articulo_sugerido.titulo}` : d.articulo || ""),
        ai: {
          fuente: res.fuente || "local",
          confianza: res.confianza ?? 0,
          gravedad: res.gravedad,
          penalizacion: res.penalizacion,
          resolucion: res.resolucion,
          fundamentos: res.fundamentos || [],
          articulo_sugerido: res.articulo_sugerido || null,
        },
      }));
    } catch (err) {
      setError(err?.message || "El asistente IA no está disponible en este momento.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Control oficial · normativa ACMG/FMG</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">COMISARIATO</h1>
          <p className="text-xs text-slate-500 mt-1">
            {eventoFiltro === "todos" ? "Todos los eventos" : eventoSeleccionado?.nombre} · {sancionesF.length} infracción(es) · {apelacionesF.length} apelación(es) · {revisionesF.length} revisión(es) técnica(s).
          </p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
          {notice ? <p className="text-xs text-emerald-600 mt-2">{notice}</p> : null}
        </div>
        <Btn variant="gradient" onClick={() => setWizard(true)}><Plus size={13} /> Nueva infracción</Btn>
      </div>

      {/* GESTIÓN POR EVENTO + EXPORTACIÓN */}
      <div className="rounded-[16px] border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_auto_auto] gap-3 items-end">
          <Field label="Evento gestionado" hint="Toda la información del comisariato (infracciones, apelaciones, revisiones y reportes) se filtra por este evento.">
            <select className={selectCls} value={eventoFiltro} onChange={(e) => { setEventoFiltro(e.target.value); setExpanded(null); }}>
              <option value="todos">📦 Todos los eventos</option>
              {eventosDisponibles.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Btn variant="secondary" disabled={exportando !== ""} onClick={() => exportarResumen("csv")} title="Resumen de infracciones en CSV compatible con Excel">
            <FileSpreadsheet size={13} /> {exportando === "csv" ? "Generando..." : "Exportar CSV"}
          </Btn>
          <Btn variant="primary" disabled={exportando !== ""} onClick={() => exportarResumen("pdf")} title="Resumen oficial en PDF con diseño MWT (fechas y horas)">
            <FileText size={13} /> {exportando === "pdf" ? "Generando..." : "Exportar PDF"}
          </Btn>
        </div>
        {eventoSeleccionado ? (
          <div className="flex items-center gap-2 mt-3 flex-wrap text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Badge variant={eventoSeleccionado.estado === "ABIERTO" ? "success" : eventoSeleccionado.estado === "BORRADOR" ? "gray" : "blue"}>{eventoSeleccionado.estado || "EVENTO"}</Badge>
            <span className="inline-flex items-center gap-1"><CalendarClock size={11} /> {eventoSeleccionado.fecha ? fechaHora(eventoSeleccionado.fecha) : "—"}</span>
          </div>
        ) : null}
      </div>

      {/* INDICADORES DEL EVENTO */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Infracciones" value={kpisF.infracciones} sub={`${kpisF.resueltas} resuelta(s)`} accent="rose" />
        <Kpi label="Apelaciones" value={kpisF.apelaciones} sub={`${kpisF.apelacionesPendientes} pendiente(s)`} accent="violet" />
        <Kpi label="Revisión técnica" value={kpisF.revisiones} sub={`${kpisF.revisionesPendientes} pendiente(s)`} accent="amber" />
        <Kpi label="Evidencias" value={kpisF.evidencias} sub="imágenes y videos" accent="cyan" />
        <Kpi label="Banderas/Alertas IA" value={alertas.length} sub="patrones de riesgo" accent="blue" />
        <Kpi label="Artículos reglamento" value={reglamento.length} sub="fuente de la IA" accent="green" />
      </div>

      <Tabs
        tabs={[
          { key: "infracciones", label: "Infracciones" },
          { key: "apelaciones", label: "Apelaciones" },
          { key: "revisiones", label: "Revisión técnica" },
          { key: "alertas", label: "Alertas IA" },
          { key: "reglamento", label: "Reglamento IA" },
          { key: "auditoria", label: "Auditoría" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <Empty title="Cargando comisariato..." /> : null}

      {/* INFRACCIONES */}
      {tab === "infracciones" && !loading ? (
        sancionesF.length === 0 ? (
          <Empty title="Sin infracciones" sub={eventoFiltro === "todos" ? "Las sanciones registradas aparecerán aquí." : "Este evento no tiene infracciones registradas."} />
        ) : (
          <div className="space-y-2">
            {sancionesF.map((s) => {
              const [bv, bl] = ESTADO_BADGE[s.estado] || ESTADO_BADGE.PENDIENTE;
              const abierta = expanded === s.id;
              return (
                <div key={s.id} className="bg-card border border-border rounded-[14px]">
                  <button onClick={() => setExpanded(abierta ? null : s.id)} className="w-full flex items-center gap-3 p-4 text-left">
                    <div className="w-9 h-9 rounded-[10px] bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <Gavel size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-foreground uppercase tracking-wide">INF-{String(s.id).slice(0, 6).toUpperCase()}</span>
                        <Badge variant={bv}>{bl}</Badge>
                        {s.tipo?.nombre ? <Badge variant="indigo">{s.tipo.nombre}</Badge> : null}
                        {s.penalizacion ? <Badge variant="cyan">{s.penalizacion}</Badge> : null}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {s.piloto ? `${s.piloto.nombre || ""} ${s.piloto.apellido || ""} · #${s.piloto.dorsal_asignado || "—"}` : "—"} · {s.evento?.nombre || "—"} · <CalendarClock size={10} className="inline-block -mt-px" /> {fechaHora(s.fecha_sancion)}{s.evidencias?.length ? ` · 📎 ${s.evidencias.length} evidencia(s)` : ""}
                      </div>
                    </div>
                    {abierta ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  {abierta ? (
                    <div className="px-4 pb-4 pt-1 border-t border-border">
                      <p className="text-xs text-slate-500 leading-relaxed mb-3"><strong className="text-foreground">Motivo:</strong> {s.motivo}</p>
                      {s.evidencias?.length ? (
                        <div className="mb-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-2">Evidencias (solo respaldo documental, no analizadas por la IA)</div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {s.evidencias.map((ev) => (
                              <div key={ev.id} className="rounded-[10px] border border-border overflow-hidden bg-muted">
                                {ev.tipo === "IMAGEN" ? (
                                  <a href={fileUrl(ev.ruta_archivo)} target="_blank" rel="noreferrer">
                                    <img src={fileUrl(ev.ruta_archivo)} alt={ev.nombre} className="h-16 w-full object-cover" />
                                  </a>
                                ) : (
                                  <div className="h-16 w-full flex flex-col items-center justify-center text-blue-600">
                                    <span className="text-base">🎥</span>
                                    <a href={fileUrl(ev.ruta_archivo)} target="_blank" rel="noreferrer" className="text-[9px] underline">ver video</a>
                                  </div>
                                )}
                                <div className="px-1 pb-1">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 truncate block">{ev.tipo} · {(ev.tamano / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {s.comisario ? <p className="text-[11px] text-slate-400 mb-3">Comisario: {s.comisario.nombre} {s.comisario.apellido}</p> : null}
                      <div className="flex gap-2">
                        {s.estado !== "RESUELTO" ? (
                          <Btn sm variant="success" onClick={() => resolver(s)}>Resolver · aplicar sanción</Btn>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* APELACIONES */}
      {tab === "apelaciones" && !loading ? (
        apelacionesF.length === 0 ? (
          <Empty title="Sin apelaciones" sub={eventoFiltro === "todos" ? "Las apelaciones de los pilotos aparecerán aquí." : "Este evento no tiene apelaciones."} />
        ) : (
          <div className="space-y-2">
            {apelacionesF.map((a) => {
              const [bv, bl] = EST_APELACION[a.estado] || EST_APELACION.PENDIENTE;
              const piloto = a.inscripcion?.piloto?.usuario;
              return (
                <div key={a.id} className="bg-card border border-border rounded-[14px] p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant={bv}>{bl}</Badge>
                    <span className="text-xs font-black text-foreground uppercase">APE-{String(a.id).slice(0, 6).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400">Ref: INF-{String(a.sancion_id).slice(0, 6).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400 inline-flex items-center gap-1"><CalendarClock size={10} /> {fechaHora(a.fecha)}</span>
                  </div>
                  <div className="text-sm font-bold text-foreground mb-1">
                    {piloto ? `${piloto.nombre} ${piloto.apellido}` : "—"} · #{a.inscripcion?.dorsal_asignado || "—"}
                  </div>
                  <p className="text-xs text-slate-500 italic mb-3">&ldquo;{a.motivo}&rdquo;</p>
                  {a.estado === "PENDIENTE" ? (
                    <div className="flex gap-2">
                      <Btn sm variant="success" onClick={() => decidirApelacion(a, "ACEPTADA")}>Aceptar</Btn>
                      <Btn sm variant="danger" onClick={() => decidirApelacion(a, "RECHAZADA")}>Rechazar</Btn>
                    </div>
                  ) : a.resolucion ? (
                    <p className="text-[11px] text-slate-400">Resolución: {a.resolucion}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* REVISIONES TÉCNICAS — checklist único de inspección mecánica */}
      {tab === "revisiones" && !loading ? (
        <div className="space-y-3">
          <div className="rounded-[14px] border border-blue-400/30 bg-blue-500/5 p-4 flex items-start gap-3">
            <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-foreground">Checklist de inspección mecánica.</strong> Marca el check del piloto que <strong className="text-foreground">pasó la inspección</strong>; desmárcalo si no pasa (queda rechazada). La lista obedece al evento gestionado y a los filtros.
            </p>
          </div>

          {/* FILTROS + RESUMEN */}
          <div className="rounded-[14px] border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <input
              className={inputCls}
              value={revBusq}
              onChange={(e) => setRevBusq(e.target.value)}
              placeholder="Filtrar por nombre, dorsal, categoría o moto…"
            />
            <select className={selectCls} value={revEstadoF} onChange={(e) => setRevEstadoF(e.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE">sin verificar (pendiente)</option>
              <option value="APROBADA">pasaron ✓</option>
              <option value="RECHAZADA">no pasaron</option>
              <option value="CONDICIONAL">condicional</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-black uppercase tracking-widest">
            <Badge variant="gray">{revisionesF.filter((r) => r.estado === "PENDIENTE").length} sin verificar</Badge>
            <Badge variant="success">{revisionesF.filter((r) => r.estado === "APROBADA").length} pasaron</Badge>
            <Badge variant="error">{revisionesF.filter((r) => r.estado === "RECHAZADA").length} no pasaron</Badge>
            <Badge variant="cyan">{revisionesCheckF.length} en lista</Badge>
          </div>

          {/* CHECKLIST DE PILOTOS */}
          {revisionesF.length === 0 ? (
            <Empty title="Sin pilotos que inspeccionar" sub={eventoFiltro === "todos" ? "El checklist se llena con las inscripciones de cada evento." : "Este evento no tiene pilotos inscritos todavía."} />
          ) : revisionesCheckF.length === 0 ? (
            <Empty title="Nadie con esos filtros" sub="Ajusta la búsqueda o el estado en la lista del checklist." />
          ) : (
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-border bg-muted/40">
                    <th className="text-center py-2.5 px-3 w-16">Pasó</th>
                    <th className="text-left py-2.5 px-3 w-14">Dorsal</th>
                    <th className="text-left py-2.5 px-3">Piloto</th>
                    <th className="text-left py-2.5 px-3 hidden md:table-cell">Categoría</th>
                    <th className="text-left py-2.5 px-3 hidden lg:table-cell">Moto</th>
                    <th className="text-left py-2.5 px-3 hidden sm:table-cell">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {revisionesCheckF.map((rev, i) => {
                    const paso = rev.estado === "APROBADA";
                    const [bv, bl] = EST_REVISION[rev.estado] || EST_REVISION.PENDIENTE;
                    const nombre = rev.inscripcion?.piloto?.usuario
                      ? `${rev.inscripcion.piloto.usuario.nombre} ${rev.inscripcion.piloto.usuario.apellido}`.trim()
                      : "—";
                    return (
                      <tr key={rev.id} className={`border-b border-border/60 ${i % 2 === 0 ? "bg-card" : "bg-[#EDF4FF]/40"}`}>
                        <td className="text-center py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={paso}
                            onChange={(e) => marcarRevision(rev, e.target.checked)}
                            title={paso ? "Pasó la inspección (desmarca para rechazar)" : "Marcar que pasó la inspección"}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-black text-foreground">#{rev.inscripcion?.dorsal_asignado || "—"}</td>
                        <td className="py-2.5 px-3 font-bold text-foreground">{nombre}</td>
                        <td className="py-2.5 px-3 text-slate-500 hidden md:table-cell">{rev.inscripcion?.categoria?.nombre || "—"}</td>
                        <td className="py-2.5 px-3 text-slate-500 hidden lg:table-cell">
                          {rev.inscripcion?.motocicleta?.marca?.nombre || ""} {rev.inscripcion?.motocicleta?.modelo || ""}
                        </td>
                        <td className="py-2.5 px-3 hidden sm:table-cell"><Badge variant={bv}>{bl}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* ALERTAS IA */}
      {tab === "alertas" && !loading ? (
        alertas.length === 0 ? (
          <Empty title="Sin alertas de riesgo" sub="No se detectaron patrones preocupantes con los datos actuales del sistema." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {alertas.map((a, i) => (
              <div key={`${a.tipo}-${i}`} className="bg-card border border-border rounded-[14px] p-4 flex gap-3">
                <div
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                    a.nivel === "ALTO"
                      ? "bg-rose-500/10 text-rose-600"
                      : a.nivel === "MEDIO"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {a.nivel === "ALTO" ? <AlertTriangle size={15} /> : a.nivel === "MEDIO" ? <AlertCircle size={15} /> : <Info size={15} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={a.nivel === "ALTO" ? "error" : a.nivel === "MEDIO" ? "warning" : "blue"}>{a.nivel}</Badge>
                    <span className="text-xs font-black text-foreground">{a.titulo}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{a.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* AUDITORÍA */}
      {tab === "auditoria" && !loading ? (
        auditoria.length === 0 ? (
          <Empty title="Sin trazabilidad" sub="La bitácora de acciones aparecerá aquí." />
        ) : (
          <div className="space-y-2">
            {auditoria.slice(0, 50).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-[12px] border border-border p-3">
                <Badge variant={a.accion === "INSERT" ? "success" : a.accion === "UPDATE" ? "blue" : "warning"}>{a.accion}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">{a.tabla_afectada}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Registro {String(a.registro_id).slice(0, 8)} · {a.usuario ? `${a.usuario.nombre} ${a.usuario.apellido}` : "sistema"}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">{new Date(a.fecha).toLocaleString("es-GT")}</div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* REGLAMENTO IA (catálogo que alimenta al asistente) */}
      {tab === "reglamento" && !loading ? (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-indigo-400/30 bg-indigo-500/5 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500 mb-1">Reglamento del evento · fuente del asistente IA</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sube el <strong className="text-foreground">PDF del reglamento de cada evento</strong>: el sistema lo lee, extrae sus artículos y la IA los usa para sugerir el artículo aplicable y la sanción preliminar. También puedes registrar artículos manualmente. Las evidencias (videos/imágenes) no se analizan: solo se guardan como respaldo.
            </p>
          </div>

          {/* SUBIDA DEL PDF DEL REGLAMENTO POR EVENTO */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!regPdfEvento || !regPdfFile) return;
              setSubiendoPdf(true);
              setError("");
              try {
                const d = await soporteApi.subirReglamentoPdf(regPdfFile, regPdfEvento);
                setNotice(`Reglamento procesado: ${d.paginas} página(s) · ${d.articulos} artículo(s) cargados · ${d.tipos_generados} tipo(s) de infracción generados para el evento.`);
                setRegPdfFile(null);
                setRegPdfEvento("");
                setTimeout(() => setNotice(""), 6000);
                const [rg, docs, tps] = await Promise.all([soporteApi.listReglamento(), soporteApi.listReglamentoDocumentos(), soporteApi.listTiposSancion()]);
                setReglamento(rg);
                setDocReglamentos(docs);
                setTipos(tps);
              } catch (err) {
                setError(err?.message || "No se pudo procesar el PDF del reglamento.");
              } finally {
                setSubiendoPdf(false);
              }
            }}
          >
            <div className="rounded-[14px] border border-border bg-card p-4 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">📄 Subir PDF del reglamento (leído por la IA)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <Field label="Evento del reglamento" hint="Un reglamento por evento; si ya existe, se reemplaza.">
                  <select className={selectCls} value={regPdfEvento} onChange={(e) => setRegPdfEvento(e.target.value)}>
                    <option value="">Seleccionar evento…</option>
                    {eventosDisponibles.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Archivo PDF">
                  <input type="file" accept="application/pdf,.pdf" className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-[10px] file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-[11px] file:font-black file:text-indigo-600 hover:file:bg-indigo-500/20" onChange={(e) => setRegPdfFile(e.target.files?.[0] || null)} />
                </Field>
              </div>
              <Btn variant="gradient" type="submit" disabled={subiendoPdf || !regPdfEvento || !regPdfFile}>
                <FileText size={13} /> {subiendoPdf ? "Leyendo el reglamento…" : "Subir y leer el reglamento"}
              </Btn>
            </div>
          </form>

          {/* REGLAMENTOS REGISTRADOS POR EVENTO */}
          {docReglamentos.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Reglamentos registrados</div>
              {docReglamentos.map((d) => (
                <div key={d.id} className="bg-card border border-border rounded-[14px] p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 grid place-items-center shrink-0"><FileText size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-foreground truncate">{d.evento_nombre}</div>
                    <div className="text-[10px] text-slate-400">
                      {d.nombre} · {d.paginas} pág. · <strong className="text-slate-500">{Number(d.articulos)} artículo(s) cargados</strong> · {new Date(d.created_at).toLocaleString("es-GT")}
                    </div>
                  </div>
                  <Btn sm variant="danger" onClick={async () => {
                    const ok = await confirm({ title: "Eliminar reglamento", message: `Se eliminará el PDF y los artículos extraídos de "${d.evento_nombre}".`, danger: true });
                    if (!ok) return;
                    try {
                      await soporteApi.borrarReglamentoPdf(d.evento_id);
                      setDocReglamentos((docs) => docs.filter((x) => x.id !== d.id));
                      setReglamento(await soporteApi.listReglamento());
                      setDocReglamentos(await soporteApi.listReglamentoDocumentos());
                      setNotice("Reglamento del evento eliminado.");
                      setTimeout(() => setNotice(""), 3000);
                    } catch (err) {
                      setError(err?.message || "No se pudo eliminar el reglamento.");
                    }
                  }} aria-label={`Eliminar reglamento de ${d.evento_nombre}`}><Trash2 size={12} /></Btn>
                </div>
              ))}
            </div>
          ) : null}

          <form onSubmit={guardarArticulo} className="rounded-[14px] border border-border bg-card p-4 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Registrar artículo manual (opcional)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Código"><input className={inputCls} value={regForm.codigo} onChange={(e) => setRegForm({ ...regForm, codigo: e.target.value })} placeholder="ART. 4.2" /></Field>
              <Field label="Área">
                <select className={selectCls} value={regForm.area} onChange={(e) => setRegForm({ ...regForm, area: e.target.value })}>
                  <option value="CONDUCTA">CONDUCTA</option>
                  <option value="CORRIDA">CORRIDA / BANDERAS</option>
                  <option value="REVISION_TECNICA">REVISIÓN TÉCNICA</option>
                  <option value="ORGANIZACION">ORGANIZACIÓN</option>
                </select>
              </Field>
              <Field label="Título"><input className={inputCls} value={regForm.titulo} onChange={(e) => setRegForm({ ...regForm, titulo: e.target.value })} placeholder="Adelantamientos" /></Field>
            </div>
            <Field label="Texto del artículo"><textarea rows={3} className={inputCls} value={regForm.texto} onChange={(e) => setRegForm({ ...regForm, texto: e.target.value })} placeholder="Texto completo o resumen del artículo del reglamento..." /></Field>
            <Btn variant="gradient" type="submit" disabled={regSaving}>{regSaving ? "Guardando..." : "Agregar artículo al catálogo"}</Btn>
          </form>
          <div className="space-y-2">
            {reglamento.length === 0 ? (
              <Empty title="Catálogo vacío" sub="Registra los artículos del reglamento oficial para que la IA sugiera el artículo aplicable y la sanción." />
            ) : (
              reglamento.map((art) => (
                <div key={art.id} className="bg-card border border-border rounded-[14px] p-4 flex items-start gap-3">
                  <div className="w-20 shrink-0">
                    <Badge variant="indigo">{art.codigo}</Badge>
                    {art.origen === "PDF" ? <div className="mt-1"><Badge variant="cyan">📄 PDF evento</Badge></div> : null}
                    {art.area ? <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">{String(art.area).replace("_", " ")}</div> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-foreground">{art.titulo}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">{art.texto}</p>
                  </div>
                  <Btn sm variant="danger" onClick={() => eliminarArticulo(art)} aria-label={`Eliminar ${art.codigo}`}><Trash2 size={12} /></Btn>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* WIZARD NUEVA INFRACCIÓN */}
      <Modal
        open={wizard}
        onClose={() => setWizard(false)}
        title="Nueva infracción"
        sub={`Paso ${step + 1} de 4 · ${STEPS[step]}`}
        size="lg"
        footer={
          step < 3 ? (
            <>
              <Btn variant="secondary" onClick={() => (step === 0 ? setWizard(false) : setStep(step - 1))}>Atrás</Btn>
              <Btn variant="gradient" disabled={saving || (step === 0 && (!wDraft.tipo_sancion_id || !wDraft.inscripcion_id))} onClick={() => {
                if (step === 2) { setStep(3); iniciarIA(); } else setStep(step + 1);
              }}>Continuar</Btn>
            </>
          ) : null
        }
      >
        {step === 0 ? (
          <div className="space-y-3">
            <Field
              label="Tipo de infracción"
              hint="Depende del evento: si su reglamento PDF está cargado se generan tipos propios (ej. ACMG); después van los generales."
            >
              <select
                className={selectCls}
                value={wDraft.tipo_sancion_id || ""}
                onChange={(e) => setWDraft({ ...wDraft, tipo_sancion_id: e.target.value })}
              >
                <option value="">Seleccionar tipo…</option>
                {tiposDelEvento.length ? (
                  <optgroup label={`📄 Reglamento del evento${eventoDelWizard ? ` — ${eventoDelWizard}` : ""}`}>
                    {tiposDelEvento.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </optgroup>
                ) : null}
                {tiposOtrosEventos.length ? (
                  <optgroup label="Reglamentos de otros eventos">
                    {tiposOtrosEventos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} ({nombreEventoDeTipo(t.evento_id)})
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                <optgroup label="Tipos generales">
                  {tiposGenerales.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </optgroup>
              </select>
            </Field>
            <Field
              label="Piloto involucrado"
              hint="Desglose fácil: 1) elige el evento, 2) refina la categoría y 3) busca por nombre, dorsal o moto."
            >
              <div className="space-y-2">
                {/* Nivel 1 y 2: evento y categoría */}
                <div className="grid sm:grid-cols-2 gap-2">
                  <select
                    className={selectCls}
                    value={wpEvento}
                    onChange={(e) => {
                      setWpEvento(e.target.value);
                      setWpCategoria("");
                      // Si la inscripción elegida ya no pertenece al evento, se limpia
                      const sel = inscripciones.find((i) => i.id === wDraft.inscripcion_id);
                      if (sel && (sel.evento?.id || "") !== e.target.value) setWDraft({ ...wDraft, inscripcion_id: "" });
                    }}
                  >
                    <option value="">1 · Evento — todos</option>
                    {eventosDisponibles.map((ev) => (
                      <option key={ev.id} value={ev.id}>1 · {ev.nombre}</option>
                    ))}
                  </select>
                  <select
                    className={selectCls}
                    value={wpCategoria}
                    onChange={(e) => {
                      setWpCategoria(e.target.value);
                      const sel = inscripciones.find((i) => i.id === wDraft.inscripcion_id);
                      if (sel && (sel.categoria?.nombre || "—") !== e.target.value) setWDraft({ ...wDraft, inscripcion_id: "" });
                    }}
                    disabled={!wpEvento}
                  >
                    <option value="">{wpEvento ? "2 · Categoría — todas" : "2 · Categoría (elige evento primero)"}</option>
                    {wpEvento ? wpCategorias.map((c) => (
                      <option key={c} value={c}>2 · {c}</option>
                    )) : null}
                  </select>
                </div>

                {/* Nivel 3: búsqueda libre */}
                <input
                  className={inputCls}
                  value={wpBusq}
                  onChange={(e) => setWpBusq(e.target.value)}
                  placeholder="3 · Buscar por nombre, dorsal o moto (ej. 24, rodriguez, yamaha)…"
                />

                {/* Selección actual */}
                {wpInscripcionSel ? (
                  <div className="flex items-center gap-2 rounded-[10px] border border-blue-500/40 bg-blue-500/10 px-3 py-2">
                    <Badge variant="blue">Seleccionado</Badge>
                    <span className="text-[11px] font-bold text-foreground">
                      {wpInscripcionSel.piloto?.usuario ? `${wpInscripcionSel.piloto.usuario.nombre} ${wpInscripcionSel.piloto.usuario.apellido}` : "Piloto"} · #{wpInscripcionSel.dorsal_asignado ?? wpInscripcionSel.dorsal ?? "—"} · {wpInscripcionSel.categoria?.nombre || "—"}
                    </span>
                    <button type="button" className="ml-auto text-[10px] text-slate-400 underline hover:text-foreground" onClick={() => setWDraft({ ...wDraft, inscripcion_id: "" })}>
                      cambiar
                    </button>
                  </div>
                ) : null}

                {/* Lista de candidatos */}
                {wpEvento ? (
                  wpCandidatos.length === 0 ? (
                    <p className="text-[11px] text-slate-400 px-1">Sin pilotos con esos filtros. Ajusta la búsqueda o la categoría.</p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto rounded-[10px] border border-border divide-y divide-border">
                      {wpCandidatos.slice(0, 60).map((ins) => {
                        const activo = wDraft.inscripcion_id === ins.id;
                        const dorsal = ins.dorsal_asignado ?? ins.dorsal ?? "—";
                        return (
                          <button
                            type="button"
                            key={ins.id}
                            onClick={() => setWDraft({ ...wDraft, inscripcion_id: ins.id })}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${activo ? "bg-blue-600/15" : "hover:bg-muted/60"}`}
                          >
                            <span className={`w-10 h-7 shrink-0 rounded-md grid place-items-center text-[11px] font-black ${activo ? "bg-blue-600 text-white" : "bg-muted text-slate-500"}`}>
                              #{dorsal}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[11px] font-bold text-foreground truncate">
                                {ins.piloto?.usuario ? `${ins.piloto.usuario.nombre} ${ins.piloto.usuario.apellido}` : ins.piloto?.nombre_completo || "—"}
                              </span>
                              <span className="block text-[10px] text-slate-400 truncate">
                                {ins.categoria?.nombre || "—"} · {ins.evento?.nombre || "—"}{ins.motocicleta ? ` · ${ins.motocicleta.marca?.nombre || ""} ${ins.motocicleta.modelo || ""}`.trim() : ""}
                              </span>
                            </span>
                            {activo ? <span className="ml-auto text-[10px] font-black uppercase text-blue-500">elegido</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-slate-400 px-1">👆 Elige un evento para ver a sus pilotos (hay {inscripciones.length} inscripción(es) en el sistema).</p>
                )}
              </div>
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <Field label="Artículo del reglamento infringido" hint="Opcional: déjalo vacío y la IA sugerirá el artículo según el reglamento cargado y la descripción.">
              <input className={inputCls} value={wDraft.articulo || ""} onChange={(e) => setWDraft({ ...wDraft, articulo: e.target.value })} placeholder="Ej. Art. 4.2 Adelantamientos (o vacío: lo sugiere la IA)" />
            </Field>
            <Field label="Descripción detallada" hint="Describe el hecho con detalle: la IA la analiza para sugerir artículo y sanción preliminar.">
              <textarea rows={5} className={inputCls} value={wDraft.motivo || ""} onChange={(e) => setWDraft({ ...wDraft, motivo: e.target.value })} placeholder="Qué ocurrió, dónde, con quién y cómo terminó el incidente..." />
            </Field>
            <Field label="Penalización sugerida" hint="También la sugiere la IA si la dejas vacía.">
              <input className={inputCls} value={wDraft.penalizacion || ""} onChange={(e) => setWDraft({ ...wDraft, penalizacion: e.target.value })} placeholder="Ej. +3 segundos / 2 posiciones / DQ (opcional)" />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Adjuntá evidencia del incidente: imágenes o videos. <strong className="text-foreground">La IA no analiza los archivos</strong>: se guardan como respaldo documental de la infracción.
            </p>
            <div className="flex gap-2 flex-wrap">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { subirArchivos(e.target.files); e.target.value = ""; }} />
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-600 px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-indigo-500/20">📷 Subir imágenes</span>
              </label>
              <label className="cursor-pointer">
                <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => { subirArchivos(e.target.files); e.target.value = ""; }} />
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-blue-500/20">🎥 Subir videos</span>
              </label>
              {subiendoEvidencia ? <span className="text-[11px] text-slate-400 animate-pulse self-center">Subiendo archivos…</span> : null}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
              <AlertTriangle size={11} className="shrink-0" />
              Límite: {MAX_MB_EVIDENCIA} por archivo (imagen o video). Si pesa más, el sistema lo rechazará.
            </div>
            {wEvidencias.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {wEvidencias.map((ev) => (
                  <div key={ev.id} className="relative rounded-[10px] border border-border overflow-hidden bg-muted group">
                    {ev.tipo === "IMAGEN" ? (
                      <img src={fileUrl(ev.ruta_archivo)} alt={ev.nombre} className="h-20 w-full object-cover" />
                    ) : (
                      <div className="h-20 w-full flex flex-col items-center justify-center text-blue-600">
                        <span className="text-lg">🎥</span>
                        <a href={fileUrl(ev.ruta_archivo)} target="_blank" rel="noreferrer" className="text-[9px] underline truncate max-w-[90%]">ver video</a>
                      </div>
                    )}
                    <button
                      onClick={() => quitarEvidencia(ev.id)}
                      className="absolute top-1 right-1 rounded-full bg-rose-600 text-white w-5 h-5 text-[9px] font-black flex items-center justify-center opacity-90 hover:opacity-100"
                      title="Quitar evidencia"
                    >✕</button>
                    <div className="px-1 pb-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 truncate block">{ev.tipo} · {(ev.tamano / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">Sin evidencia adjunta (opcional, pero recomendada).</p>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-indigo-400/30 bg-indigo-500/5 p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500">Comisario Inteligente · Asistente IA</div>
                {!aiLoading && wDraft.ai ? (
                  <Badge variant={wDraft.ai.fuente === "ia" ? "indigo" : "blue"}>
                    {wDraft.ai.fuente === "ia" ? "IA generativa" : "Motor local de reglas"}
                  </Badge>
                ) : null}
              </div>
              {aiLoading ? (
                <div className="text-xs text-slate-500 animate-pulse">Analizando evidencia, historial y reglamento...</div>
              ) : wDraft.ai ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant={wDraft.ai.gravedad === "MUY_GRAVE" || wDraft.ai.gravedad === "GRAVE" ? "error" : wDraft.ai.gravedad === "MODERADA" ? "warning" : "success"}>
                      Gravedad: {String(wDraft.ai.gravedad).replace("_", " ")}
                    </Badge>
                    {wDraft.ai.articulo_sugerido ? (
                      <Badge variant="indigo">
                        Artículo sugerido: {wDraft.ai.articulo_sugerido.codigo} — {wDraft.ai.articulo_sugerido.titulo}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm font-black text-foreground mb-2">Sanción preliminar: {wDraft.ai.penalizacion}</div>
                  {wEvidencias.length ? (
                    <div className="text-[10px] text-slate-400 mb-2">📎 {wEvidencias.length} evidencia(s) adjunta(s) — respaldo documental, no analizada por la IA.</div>
                  ) : null}
                  {wDraft.ai.resolucion ? (
                    <div className="rounded-[10px] bg-card border border-border p-3 text-[11px] text-slate-500 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap mb-2">
                      {wDraft.ai.resolucion}
                    </div>
                  ) : null}
                  {(wDraft.ai.fundamentos || []).length ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {wDraft.ai.fundamentos.map((f, i) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-500 px-2 py-0.5">{f}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mb-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      <span>Confianza</span><span>{wDraft.ai.confianza}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${wDraft.ai.confianza}%` }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Sugerencia del asistente · la decisión final siempre la toma el comisario.</p>
                </>
              ) : null}
            </div>
            <form onSubmit={nuevaSancion} className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => { setStep(2); }}>Modificar</Btn>
              <Btn variant="gradient" type="submit" disabled={saving || aiLoading || !wDraft.motivo || !wDraft.inscripcion_id}>
                {saving ? "Registrando..." : "Aceptar y aplicar sanción"}
              </Btn>
            </form>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}