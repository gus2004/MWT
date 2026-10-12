"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./inscripciones.module.css";
import { SearchSelect } from "@/components/kit";
import { useConfirm } from "@/components/ConfirmProvider";
import { createInscripcion, createMotocicleta, deleteInscripcion, getPilotoPublicDetail, updateInscripcion } from "@/lib/adminApi";
import InscripcionesAnalytics from "./InscripcionesAnalytics";
import InscripcionesReportes from "./InscripcionesReportes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function InfoCard({ label, value }) {
  return (
    <article className={styles.infoCard}>
      <span className={styles.infoLabel}>{label}</span>
      <strong className={styles.infoValue}>{value}</strong>
    </article>
  );
}

function getEstadoColor(estado) {
  switch ((estado || "PENDIENTE").toUpperCase()) {
    case "PAGADA":
      return "#2563eb";
    case "VALIDADA":
      return "#16a34a";
    case "RECHAZADA":
      return "#dc2626";
    default:
      return "#f59e0b";
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function fmtEventoFecha(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-GT", { weekday: "short", day: "2-digit", month: "short" });
}

const EMPTY_DRAFT = {
  evento_id: "",
  categoria_id: "",
  piloto_id: "",
  motocicleta_id: "",
  dorsal_asignado: "",
  estado: "PENDIENTE",
};

const EMPTY_MOTO_DRAFT = {
  marca_id: "",
  modelo: "",
  anio: "",
  cilindrada_real: "",
  vin: "",
  color: "",
  apodo_moto: "",
};

export default function Inscripciones() {
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [query, setQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterEvento, setFilterEvento] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterDorsal, setFilterDorsal] = useState("");
  const [sortField, setSortField] = useState("fecha_registro");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState({ eventos: [], categorias: [], pilotos: [], motocicletas: [], marcas: [] });
  const [activeTab, setActiveTab] = useState("inscribir");
  const [selectedPilotoInfo, setSelectedPilotoInfo] = useState(null);
  const [showPilotoModal, setShowPilotoModal] = useState(false);
  const [loadingPilotoInfo, setLoadingPilotoInfo] = useState(false);
  const [showMotoModal, setShowMotoModal] = useState(false);
  const [savingMoto, setSavingMoto] = useState(false);
  const [motoDraft, setMotoDraft] = useState(EMPTY_MOTO_DRAFT);
  const [pdfPreview, setPdfPreview] = useState(null);

  const openPilotoInfo = async (pilotoId) => {
    if (!pilotoId) return;
    setLoadingPilotoInfo(true);
    setMessage("");
    try {
      const detail = await getPilotoPublicDetail(pilotoId);
      setSelectedPilotoInfo(detail);
      setShowPilotoModal(true);
    } catch (err) {
      setMessage("❌ " + (err?.message || "No se pudo obtener la información del piloto."));
    } finally {
      setLoadingPilotoInfo(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/inscripciones`);
        const rawBody = await res.text();
        if (!res.ok) throw new Error(rawBody || `HTTP ${res.status}`);
        const data = JSON.parse(rawBody);
        if (!mounted) return;
        setInscripciones(Array.isArray(data.items) ? data.items : []);
        setError(null);
      } catch (err) {
        if (mounted) setError(err?.message || "Error desconocido");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      try {
        const params = new URLSearchParams();
        if (draft.evento_id) params.set("evento_id", draft.evento_id);
        if (draft.piloto_id) params.set("piloto_id", draft.piloto_id);
        const url = `${API_URL}/api/public/inscripciones/options${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { credentials: "include" });
        const rawBody = await res.text();
        if (!res.ok) throw new Error(rawBody || `HTTP ${res.status}`);
        const data = JSON.parse(rawBody);
        if (!mounted) return;
        setOptions({
          eventos: Array.isArray(data.eventos) ? data.eventos : [],
          categorias: Array.isArray(data.categorias) ? data.categorias : [],
          pilotos: Array.isArray(data.pilotos) ? data.pilotos : [],
          motocicletas: Array.isArray(data.motocicletas) ? data.motocicletas : [],
          marcas: Array.isArray(data.marcas) ? data.marcas : [],
        });
      } catch {
        if (mounted) setOptions({ eventos: [], categorias: [], pilotos: [], motocicletas: [], marcas: [] });
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    };
    loadOptions();
    return () => { mounted = false; };
  }, [draft.evento_id, draft.piloto_id]);

  useEffect(() => {
    let savedDraft = null;
    try {
      const raw = window.sessionStorage.getItem("mwt_inscripcion_draft");
      if (raw) savedDraft = JSON.parse(raw);
      window.sessionStorage.removeItem("mwt_inscripcion_draft");
    } catch {
      // ignore
    }

    let pilotoIdFromUrl = "";
    try {
      const params = new URLSearchParams(window.location.search);
      pilotoIdFromUrl = params.get("piloto_id") || "";
    } catch {
      // ignore
    }

    if (savedDraft && typeof savedDraft === "object") {
      setDraft((current) => ({ ...current, ...savedDraft }));
    }

    if (pilotoIdFromUrl) {
      setDraft((current) => ({ ...current, piloto_id: pilotoIdFromUrl }));
      setMessage("✅ Piloto creado correctamente. Selecciona su motocicleta para continuar la inscripción.");
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        // ignore
      }
    }
  }, []);

  const optionsByBrand = useMemo(() => toArray(options.marcas), [options.marcas]);

  const setField = (field, value) => {
    setDraft((current) => {
      if (field === "piloto_id") {
        return { ...current, piloto_id: value, motocicleta_id: "", dorsal_asignado: "" };
      }
      if (field === "evento_id") {
        return { ...current, evento_id: value, categoria_id: "", motocicleta_id: "", dorsal_asignado: "" };
      }
      if (field === "categoria_id") {
        return { ...current, categoria_id: value, dorsal_asignado: "" };
      }
      return { ...current, [field]: value };
    });
  };

  const optionsByEvent = useMemo(() => toArray(options.eventos), [options.eventos]);
  const eventGroups = useMemo(() => {
    const map = {};
    optionsByEvent.forEach((ev) => {
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
            label: `${ev.nombre}${fmtEventoFecha(ev.fecha_inicio) ? ` · ${fmtEventoFecha(ev.fecha_inicio)}` : ""}`,
          })),
      }));
  }, [optionsByEvent]);
  const optionsByCategory = useMemo(() => toArray(options.categorias), [options.categorias]);
  const categoriasDisponibles = useMemo(() => {
    const evento = optionsByEvent.find((e) => String(e.id) === String(draft.evento_id));
    if (!evento?.campeonato_id || !optionsByCategory.length) return optionsByCategory;
    const filtered = optionsByCategory.filter((c) => String(c.campeonato_id) === String(evento.campeonato_id));
    return filtered.length ? filtered : optionsByCategory;
  }, [optionsByEvent, optionsByCategory, draft.evento_id]);
  const optionsByPilot = useMemo(() => toArray(options.pilotos), [options.pilotos]);
  const optionsByMoto = useMemo(() => toArray(options.motocicletas), [options.motocicletas]);
  const stats = useMemo(() => {
    const uniquePilots = new Set(inscripciones.map((item) => item.piloto_id || item.piloto?.id).filter(Boolean));
    const uniqueEvents = new Set(inscripciones.map((item) => item.evento_id || item.evento?.id).filter(Boolean));
    const uniqueCategories = new Set(inscripciones.map((item) => item.categoria_id || item.categoria?.id).filter(Boolean));
    const uniqueMotos = new Set(inscripciones.map((item) => item.motocicleta_id || item.motocicleta?.id).filter(Boolean));

    return [
      { label: "Inscripciones", value: inscripciones.length },
      { label: "Pilotos", value: uniquePilots.size },
      { label: "Eventos", value: uniqueEvents.size },
      { label: "Categorías", value: uniqueCategories.size },
      { label: "Motocicletas", value: uniqueMotos.size },
    ];
  }, [inscripciones]);
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inscripciones.filter((item) => {
      const matchesQuery = !q || (
        (item.id || "").toLowerCase().includes(q) ||
        (item.piloto?.usuario?.nombre || "").toLowerCase().includes(q) ||
        (item.piloto?.usuario?.apellido || "").toLowerCase().includes(q) ||
        (item.piloto?.usuario?.email || "").toLowerCase().includes(q) ||
        (item.evento?.nombre || "").toLowerCase().includes(q) ||
        (item.categoria?.nombre || "").toLowerCase().includes(q) ||
        (item.estado || "").toLowerCase().includes(q) ||
        String(item.dorsal_asignado || "").includes(q)
      );
      const matchesEstado = !filterEstado || String(item.estado || "").toUpperCase() === filterEstado;
      const matchesEvento = !filterEvento || String(item.evento?.id || item.evento_id || "") === filterEvento;
      const matchesCategoria = !filterCategoria || String(item.categoria?.id || item.categoria_id || "") === filterCategoria;
      const matchesDorsal = !filterDorsal || String(item.dorsal_asignado || "") === filterDorsal;
      return matchesQuery && matchesEstado && matchesEvento && matchesCategoria && matchesDorsal;
    });
  }, [inscripciones, query, filterEstado, filterEvento, filterCategoria, filterDorsal]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  const sortedItems = useMemo(() => {
    const getValue = (item) => {
      if (sortField === "piloto") return `${item.piloto?.usuario?.nombre || ""} ${item.piloto?.usuario?.apellido || ""}`.trim();
      if (sortField === "evento") return item.evento?.nombre || "";
      if (sortField === "categoria") return item.categoria?.nombre || "";
      if (sortField === "dorsal") return Number(item.dorsal_asignado || 0);
      if (sortField === "estado") return item.estado || "";
      return new Date(item.fecha_registro || 0).getTime() || 0;
    };

    return [...filteredItems].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      const comparison = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "es", { sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortDirection]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, page, itemsPerPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  const sortIndicator = (field) => sortField === field ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  useEffect(() => {
    setPage(1);
  }, [query, filterEstado, filterEvento, filterCategoria, filterDorsal]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const categoriaFilterOptions = useMemo(() => {
    const seen = new Map();
    inscripciones
      .filter((item) => !filterEvento || String(item.evento?.id || item.evento_id || "") === filterEvento)
      .forEach((item) => {
        const id = String(item.categoria?.id || item.categoria_id || "");
        if (!id || seen.has(id)) return;
        seen.set(id, item.categoria?.nombre || `Categoría ${id}`);
      });
    return Array.from(seen.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [inscripciones, filterEvento]);

  const dorsalFilterOptions = useMemo(() => {
    const seen = new Set();
    const values = [];
    inscripciones.forEach((item) => {
      const dorsal = String(item.dorsal_asignado || "");
      if (!dorsal || seen.has(dorsal)) return;
      seen.add(dorsal);
      values.push(dorsal);
    });
    return values.sort((a, b) => Number(a) - Number(b));
  }, [inscripciones]);

  const matchingInscripcion = useMemo(() => {
    if (!draft.evento_id || !draft.categoria_id || !draft.piloto_id) return null;
    return inscripciones.find((item) => (
      String(item.evento_id || item.evento?.id || "") === String(draft.evento_id) &&
      String(item.categoria_id || item.categoria?.id || "") === String(draft.categoria_id) &&
      String(item.piloto_id || item.piloto?.id || "") === String(draft.piloto_id)
    )) || null;
  }, [inscripciones, draft.evento_id, draft.categoria_id, draft.piloto_id]);

  const dorsalStatusOptions = useMemo(() => {
    if (!draft.evento_id || !draft.categoria_id) return [];

    return Array.from({ length: 99 }, (_, i) => {
      const numero = i + 1;
      const ocupadoPor = inscripciones.find((item) => (
        String(item.evento_id || item.evento?.id || "") === String(draft.evento_id) &&
        String(item.categoria_id || item.categoria?.id || "") === String(draft.categoria_id) &&
        Number(item.dorsal_asignado) === numero
      ));

      const mismoRegistro = ocupadoPor && matchingInscripcion && String(ocupadoPor.id) === String(matchingInscripcion.id);
      const ocupado = Boolean(ocupadoPor) && !mismoRegistro;

      return {
        numero,
        ocupado,
      };
    });
  }, [inscripciones, draft.evento_id, draft.categoria_id, matchingInscripcion]);

  useEffect(() => {
    if (!matchingInscripcion) return;
    if (draft.dorsal_asignado) return;
    setDraft((current) => ({ ...current, dorsal_asignado: String(matchingInscripcion.dorsal_asignado || "") }));
  }, [matchingInscripcion, draft.dorsal_asignado]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (!draft.evento_id || !draft.categoria_id || !draft.piloto_id || !draft.motocicleta_id || !draft.dorsal_asignado) {
        throw new Error("Completa evento, categoría, piloto, moto y dorsal.");
      }

      const created = await createInscripcion({
        evento_id: draft.evento_id,
        piloto_id: draft.piloto_id,
        categoria_id: draft.categoria_id,
        motocicleta_id: draft.motocicleta_id,
        dorsal_asignado: Number(draft.dorsal_asignado),
        estado: draft.estado,
      });

      const evento = optionsByEvent.find((item) => String(item.id) === String(draft.evento_id));
      const categoria = optionsByCategory.find((item) => String(item.id) === String(draft.categoria_id));
      const piloto = optionsByPilot.find((item) => String(item.id) === String(draft.piloto_id));
      const moto = optionsByMoto.find((item) => String(item.id) === String(draft.motocicleta_id));

      setPdfPreview({
        id: created?.id || "—",
        fecha: created?.fecha_registro ? new Date(created.fecha_registro).toLocaleDateString("es-GT") : new Date().toLocaleDateString("es-GT"),
        evento: evento ? `${evento.nombre || ""}${evento.campeonato_nombre ? ` — ${evento.campeonato_nombre}` : ""}` : "—",
        categoria: categoria ? `${categoria.nombre || ""}${categoria.cilindrada_min || categoria.cilindrada_max ? ` (${categoria.cilindrada_min}-${categoria.cilindrada_max} cc)` : ""}` : "—",
        piloto: piloto ? `${piloto.nombre || ""} ${piloto.apellido || ""}`.trim() : "—",
        email: piloto?.email || "—",
        moto: moto ? `${moto.marca_nombre ? `${moto.marca_nombre} ` : ""}${moto.modelo || ""}${moto.apodo_moto ? ` (${moto.apodo_moto})` : ""}` : "—",
        anio: moto?.anio || "—",
        cilindrada: moto?.cilindrada_real || moto?.cilindrada || "—",
        dorsal: draft.dorsal_asignado || "—",
        estado: (draft.estado || "PENDIENTE").toUpperCase(),
      });

      setMessage("✅ Inscripción guardada correctamente.");
      setDraft(EMPTY_DRAFT);
      const refreshRes = await fetch(`${API_URL}/api/public/inscripciones`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setInscripciones(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      setMessage("❌ " + (err?.message || "No se pudo guardar la inscripción."));
    } finally {
      setSaving(false);
    }
  };

  const abrirVistaPreviaPDF = (preview) => {
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const fila = (label, value) => `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
    const filaHtml = (label, valueHtml) => `<tr><th>${esc(label)}</th><td>${valueHtml}</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Inscripción ${esc(preview.id)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #0f172a; background: #fff; padding: 28px; }
          .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
          h1 { font-size: 20px; letter-spacing: 1px; }
          .comprobante { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
          .meta { text-align: right; font-size: 11px; color: #475569; }
          .meta strong { color: #0f172a; }
          hr { border: none; border-top: 2px solid #0f172a; margin-bottom: 18px; }
          h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin: 18px 0 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; }
          th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #475569; width: 38%; }
          td { font-weight: 600; }
          .dorsal { font-size: 26px; font-weight: 800; color: #0ea5a4; }
          .boton { display: inline-block; margin-top: 18px; padding: 10px 18px; background: #0f172a; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; }
          .hint { margin-top: 8px; font-size: 11px; color: #94a3b8; }
          @media print { .boton, .hint { display: none; } @page { size: letter; margin: 12mm; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="top">
          <div>
            <div class="comprobante">Comprobante de inscripción</div>
            <h1>MWT</h1>
          </div>
          <div class="meta">
            <div>N.º <strong>${esc(preview.id)}</strong></div>
            <div>Fecha: <strong>${esc(preview.fecha)}</strong></div>
          </div>
        </div>
        <hr />
        <h2>Evento</h2>
        <table>${fila("Evento", preview.evento)}${fila("Categoría", preview.categoria)}</table>
        <h2>Piloto</h2>
        <table>${fila("Nombre", preview.piloto)}${fila("Correo", preview.email)}</table>
        <h2>Motocicleta</h2>
        <table>${fila("Motocicleta", preview.moto)}${fila("Año", preview.anio)}${fila("Cilindrada", `${preview.cilindrada} cc`)}</table>
        <h2>Inscripción</h2>
        <table>${filaHtml("Dorsal asignado", `<span class="dorsal">${esc(preview.dorsal)}</span>`)}${fila("Estado", preview.estado)}</table>
        <button class="boton" onclick="window.print()">Imprimir / Guardar como PDF</button>
        <div class="hint">Sugerencia: usa «Guardar como PDF» en el diálogo de impresión para generar el archivo.</div>
      </body>
      </html>
    `;

    const ventana = window.open("", "printInscripcion");
    if (!ventana) return;
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
  };

  const openMotoModal = () => {
    if (!draft.piloto_id) {
      setMessage("⚠️ Primero selecciona un piloto para poder crear su motocicleta.");
      return;
    }

    setMotoDraft(EMPTY_MOTO_DRAFT);
    setShowMotoModal(true);
    setMessage("");
  };

  const goToCrearPiloto = () => {
    try {
      window.sessionStorage.setItem("mwt_inscripcion_draft", JSON.stringify(draft));
    } catch {
      // ignore
    }
    window.location.href = "/dashboard/pilotos?desde=inscripciones";
  };

  const handleCreateMoto = async (event) => {
    event.preventDefault();
    if (!draft.piloto_id) {
      setMessage("⚠️ Primero selecciona un piloto.");
      return;
    }

    setSavingMoto(true);
    setMessage("");

    try {
      if (!motoDraft.marca_id || !motoDraft.modelo.trim() || !motoDraft.anio || !motoDraft.cilindrada_real) {
        throw new Error("Completa marca, modelo, año y cilindrada real.");
      }

      const createdMoto = await createMotocicleta(draft.piloto_id, {
        marca_id: motoDraft.marca_id,
        modelo: motoDraft.modelo.trim(),
        anio: Number(motoDraft.anio),
        cilindrada_real: Number(motoDraft.cilindrada_real),
        vin: motoDraft.vin.trim(),
        color: motoDraft.color.trim(),
        apodo_moto: motoDraft.apodo_moto.trim(),
      });

      const normalizedMoto = {
        ...createdMoto,
        marca_nombre: createdMoto?.marca?.nombre || createdMoto?.marca_nombre || "",
        piloto_id: draft.piloto_id,
      };

      setOptions((current) => {
        const filtered = current.motocicletas.filter((moto) => String(moto.id) !== String(normalizedMoto.id));
        return {
          ...current,
          motocicletas: [normalizedMoto, ...filtered],
        };
      });

      setDraft((current) => ({ ...current, motocicleta_id: String(normalizedMoto.id || "") }));
      setShowMotoModal(false);
      setMessage("✅ Motocicleta registrada y seleccionada para la inscripción.");
    } catch (err) {
      setMessage("❌ " + (err?.message || "No se pudo registrar la motocicleta."));
    } finally {
      setSavingMoto(false);
    }
  };

  const clearListFilters = () => {
    setQuery("");
    setFilterEstado("");
    setFilterEvento("");
    setFilterCategoria("");
    setFilterDorsal("");
    setPage(1);
  };

  if (loading) return <main className={styles.page}><header className={styles.header}><div className={styles.headerInner}><div><p className={styles.eyebrow}>Módulo operativo</p><h1 className={styles.title}>INSCRIPCIONES</h1><p className={styles.subtitle}>Cargando datos...</p></div></div></header></main>;
  if (error) return <main className={styles.page}><header className={styles.header}><div className={styles.headerInner}><div><p className={styles.eyebrow}>Módulo operativo</p><h1 className={styles.title}>INSCRIPCIONES</h1><p className={styles.subtitle} style={{ color: "#fca5a5" }}>Error: {error}</p></div></div></header></main>;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.eyebrow}>Módulo operativo</p>
            <h1 className={styles.title}>INSCRIPCIONES</h1>
            <p className={styles.subtitle}>Total de {inscripciones.length} inscripción{inscripciones.length !== 1 ? "es" : ""} registradas.</p>
          </div>
        </div>
      </header>

      <section className={styles.panel}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => setActiveTab("inscribir")} style={{ padding: "8px 12px", borderRadius: 8, border: activeTab === "inscribir" ? "2px solid #0ea5a4" : "1px solid rgba(148,163,184,0.2)", background: activeTab === "inscribir" ? "#0ea5a4" : "#fff", color: activeTab === "inscribir" ? "#fff" : "#0f172a", cursor: "pointer" }}>Inscribir pilotos</button>
          <button type="button" onClick={() => setActiveTab("estadisticas")} style={{ padding: "8px 12px", borderRadius: 8, border: activeTab === "estadisticas" ? "2px solid #0ea5a4" : "1px solid rgba(148,163,184,0.2)", background: activeTab === "estadisticas" ? "#0ea5a4" : "#fff", color: activeTab === "estadisticas" ? "#fff" : "#0f172a", cursor: "pointer" }}>Estadísticas</button>
          <button type="button" onClick={() => setActiveTab("reportes")} style={{ padding: "8px 12px", borderRadius: 8, border: activeTab === "reportes" ? "2px solid #0ea5a4" : "1px solid rgba(148,163,184,0.2)", background: activeTab === "reportes" ? "#0ea5a4" : "#fff", color: activeTab === "reportes" ? "#fff" : "#0f172a", cursor: "pointer" }}>Reportes</button>
        </div>

        {activeTab === "inscribir" ? (
          <>
            <div className={styles.statsGrid}>{stats.map((item) => <InfoCard key={item.label} label={item.label} value={item.value} />)}</div>

            <section className={styles.cardSection} style={{ marginBottom: 18 }}>
              <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Agregar inscripción</h2><p className={styles.sectionText}>Selecciona un evento, categoría, piloto, moto y dorsal.</p></div><span className={styles.statusBadge}>Alta</span></div>
              {optionsLoading ? <p className={styles.fieldHint}>Cargando catálogos relacionados...</p> : null}

              <form className={styles.formGrid} onSubmit={handleCreate}>
                <label className={styles.field}><span className={styles.fieldLabel}>Evento</span><SearchSelect groups={eventGroups} value={draft.evento_id || ""} onChange={(v) => setField("evento_id", v)} placeholder="Seleccione un evento" searchPlaceholder="Buscar por fecha o campeonato..." className="w-full" inputClassName={styles.input} /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Categoría</span><select className={styles.input} value={draft.categoria_id} onChange={(e) => setField("categoria_id", e.target.value)} required disabled={!draft.evento_id}><option value="">{draft.evento_id ? (categoriasDisponibles.length ? "Seleccione una categoría" : "No hay categorías para este evento") : "Primero seleccione un evento"}</option>{categoriasDisponibles.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre} {categoria.cilindrada_min || categoria.cilindrada_max ? `(${categoria.cilindrada_min}-${categoria.cilindrada_max} cc)` : ""}</option>)}</select></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Piloto</span><SearchSelect options={optionsByPilot.map((piloto) => ({ value: String(piloto.id), label: `${[piloto.nombre, piloto.apellido].filter(Boolean).join(" ")}${piloto.email ? ` - ${piloto.email}` : ""}`.trim() }))} value={draft.piloto_id || ""} onChange={(v) => setField("piloto_id", v)} placeholder="Seleccione un piloto existente" searchPlaceholder="Buscar por nombre..." className="w-full" /><div style={{ marginTop: 8 }}><button type="button" onClick={goToCrearPiloto} style={{ background: "#0ea5a4", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, minHeight: 40 }}>+ Agregar piloto nuevo</button></div></label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Motocicleta</span>
                  <select className={styles.input} value={draft.motocicleta_id} onChange={(e) => setField("motocicleta_id", e.target.value)} required disabled={!draft.piloto_id}>
                    <option value="">{draft.piloto_id ? "Seleccione una motocicleta" : "Primero seleccione un piloto"}</option>
                    {optionsByMoto.filter((moto) => String(moto.piloto_id) === String(draft.piloto_id)).map((motocicleta) => <option key={motocicleta.id} value={motocicleta.id}>{motocicleta.modelo} {motocicleta.apodo_moto ? `- ${motocicleta.apodo_moto}` : ""} {motocicleta.marca_nombre ? `(${motocicleta.marca_nombre})` : ""}</option>)}
                  </select>
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className={styles.secondaryBtn} onClick={openMotoModal} disabled={!draft.piloto_id} style={{ minHeight: 40 }}>
                      Agregar moto nueva
                    </button>
                  </div>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Dorsal asignado</span>
                  <SearchSelect
                    options={dorsalStatusOptions.map((item) => ({
                      value: String(item.numero),
                      label: `#${item.numero}${item.ocupado ? " - ocupado" : " - disponible"}`,
                      disabled: item.ocupado,
                    }))}
                    value={draft.dorsal_asignado || ""}
                    onChange={(v) => setField("dorsal_asignado", v)}
                    placeholder={draft.evento_id && draft.categoria_id ? "Seleccione un dorsal" : "Seleccione evento y categoría"}
                    searchPlaceholder="Buscar dorsal..."
                    className="w-full"
                    disabled={!draft.evento_id || !draft.categoria_id}
                  />
                  <span className={styles.fieldHint}>
                    {draft.evento_id && draft.categoria_id
                      ? `${dorsalStatusOptions.filter((d) => d.ocupado).length} ocupados, ${dorsalStatusOptions.filter((d) => !d.ocupado).length} disponibles.`
                      : "Primero selecciona evento y categoría para ver disponibilidad."}
                  </span>
                </label>
                <label className={styles.field}><span className={styles.fieldLabel}>Estado</span><select className={styles.input} value={draft.estado} onChange={(e) => setField("estado", e.target.value)}><option value="PENDIENTE">Pendiente</option><option value="PAGADA">Pagada</option><option value="VALIDADA">Validada</option><option value="RECHAZADA">Rechazada</option></select></label>

                <div className={styles.formActions} style={{ gridColumn: "1 / -1" }}>{message ? <span className={styles.fieldHint}>{message}</span> : null}<button type="submit" className={styles.primaryBtn} disabled={saving || !draft.evento_id || !draft.categoria_id || !draft.piloto_id || !draft.motocicleta_id || !draft.dorsal_asignado}>{saving ? "Guardando..." : "Guardar inscripción"}</button></div>
              </form>
            </section>

            <section className={styles.cardSection}>
              <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Listado de inscripciones</h2><p className={styles.sectionText}>Datos de todas las inscripciones registradas en el sistema.</p></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
                <input className={styles.input} type="search" placeholder="Buscar por ID, piloto, email, evento o dorsal..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%" }} />
                <select className={styles.input} value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}><option value="">Todos los estados</option><option value="PENDIENTE">Pendiente</option><option value="PAGADA">Pagada</option><option value="VALIDADA">Validada</option><option value="RECHAZADA">Rechazada</option></select>
                <SearchSelect clearable groups={eventGroups} value={filterEvento || ""} onChange={(v) => { setFilterEvento(v); if (v !== filterEvento) setFilterCategoria(""); }} placeholder="Todos los eventos" searchPlaceholder="Buscar evento o campeonato..." className="w-full" inputClassName={styles.input} />
                <select className={styles.input} value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}><option value="">Todas las categorías</option>{categoriaFilterOptions.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</select>
                <select className={styles.input} value={filterDorsal} onChange={(e) => setFilterDorsal(e.target.value)}><option value="">Todos los dorsales</option>{dorsalFilterOptions.map((dorsal) => <option key={dorsal} value={dorsal}>{dorsal}</option>)}</select>
                <button type="button" className={styles.secondaryBtn} onClick={clearListFilters} style={{ minHeight: 44 }}>Limpiar filtros</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <div className={styles.fieldHint}>Mostrando {paginatedItems.length} de {filteredItems.length} resultados.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label className={styles.fieldHint} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    Items por página
                    <select className={styles.input} value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} style={{ width: 110 }}>
                      {[5, 8, 10, 15, 20].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button type="button" className={styles.secondaryBtn} onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} style={{ minHeight: 44, opacity: page <= 1 ? 0.6 : 1 }}>Anterior</button>
                    <span className={styles.fieldHint}>Página {page} de {totalPages}</span>
                    <button type="button" className={styles.secondaryBtn} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} style={{ minHeight: 44, opacity: page >= totalPages ? 0.6 : 1 }}>Siguiente</button>
                  </div>
                </div>
              </div>
              <div className={styles.tableWrapper}>
                {filteredItems.length === 0 ? <div className={styles.emptyState}>{inscripciones.length === 0 ? "No hay inscripciones registradas." : `No hay inscripciones que coincidan con "${query}".`}</div> : (
                  <table className={styles.table}>
                    <thead><tr>
                      <th>ID</th>
                      <th><button type="button" className={styles.sortButton} onClick={() => toggleSort("piloto")}>Piloto{sortIndicator("piloto")}</button></th>
                      <th><button type="button" className={styles.sortButton} onClick={() => toggleSort("evento")}>Evento{sortIndicator("evento")}</button></th>
                      <th><button type="button" className={styles.sortButton} onClick={() => toggleSort("categoria")}>Categoría{sortIndicator("categoria")}</button></th>
                      <th><button type="button" className={styles.sortButton} onClick={() => toggleSort("dorsal")}>Dorsal{sortIndicator("dorsal")}</button></th>
                      <th><button type="button" className={styles.sortButton} onClick={() => toggleSort("estado")}>Estado{sortIndicator("estado")}</button></th>
                      <th><button type="button" className={styles.sortButton} onClick={() => toggleSort("fecha_registro")}>Fecha{sortIndicator("fecha_registro")}</button></th>
                    </tr></thead>
                    <tbody>{paginatedItems.map((item) => (
                      <tr key={item.id}>
                        <td className={styles.monospace}>{item.id.slice(0, 8)}</td>
                        <td>
                          {item.piloto?.usuario?.nombre} {item.piloto?.usuario?.apellido}
                          <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => openPilotoInfo(item.piloto_id || item.piloto?.id)}
                              style={{ background: "#0ea5a4", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: loadingPilotoInfo ? "progress" : "pointer" }}
                              disabled={loadingPilotoInfo}
                            >
                              {loadingPilotoInfo ? "Cargando..." : "Info"}
                            </button>
                            <button type="button" onClick={async () => {
                              if (!(await confirm({ title: "Eliminar inscripción", message: "¿Eliminar esta inscripción? Esto borrará solo este registro y no afectará al piloto.", confirmText: "Eliminar" }))) return;
                              try {
                                setDeletingIds((s) => new Set(s).add(item.id));
                                await deleteInscripcion(item.id);
                                setMessage("✅ Inscripción eliminada");
                                setInscripciones((cur) => cur.filter((i) => i.id !== item.id));
                              } catch (err) {
                                setMessage("❌ " + (err?.message || "No se pudo eliminar la inscripción"));
                              } finally {
                                setDeletingIds((s) => { const next = new Set(s); next.delete(item.id); return next; });
                              }
                            }} style={{ background: deletingIds.has(item.id) ? "#fca5a5" : "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: deletingIds.has(item.id) ? "progress" : "pointer" }} disabled={deletingIds.has(item.id)}>{deletingIds.has(item.id) ? "Eliminando..." : "Eliminar"}</button>
                          </div>
                        </td>
                        <td>{item.evento?.nombre || "—"}</td>
                        <td>{item.categoria?.nombre || "—"}</td>
                        <td className={styles.monospace}>{item.dorsal_asignado || "—"}</td>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><select value={item.estado || "PENDIENTE"} onChange={async (e) => { const nuevo = e.target.value; try { setUpdatingIds((s) => new Set(s).add(item.id)); await updateInscripcion(item.id, { estado: nuevo, usuario_id: "" }); setInscripciones((cur) => cur.map((it) => (it.id === item.id ? { ...it, estado: nuevo } : it))); setMessage("✅ Estado actualizado"); } catch (err) { setMessage("❌ " + (err?.message || "No se pudo actualizar estado")); } finally { setUpdatingIds((s) => { const next = new Set(s); next.delete(item.id); return next; }); } }} style={{ background: getEstadoColor(item.estado), color: "#fff", border: "none", padding: "6px 8px", borderRadius: 6, minWidth: 110, appearance: "none", cursor: updatingIds.has(item.id) ? "progress" : "pointer" }} disabled={updatingIds.has(item.id)}><option value="PENDIENTE">Pendiente</option><option value="PAGADA">Pagada</option><option value="VALIDADA">Validada</option><option value="RECHAZADA">Rechazada</option></select>{updatingIds.has(item.id) ? <span style={{ fontSize: 12, color: "#6b7280" }}>actualizando...</span> : null}</div></td>
                        <td className={styles.monospace}>{item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString("es-GT", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        ) : activeTab === "estadisticas" ? (
          <InscripcionesAnalytics inscripciones={inscripciones} eventGroups={eventGroups} />
        ) : (
          <InscripcionesReportes inscripciones={inscripciones} eventGroups={eventGroups} />
        )}
      </section>

      {showPilotoModal ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, padding: 16 }}>
          <div style={{ width: "min(980px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 20px 60px rgba(15,23,42,0.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Detalle del piloto</h2>
              <button type="button" className={styles.secondaryBtn} onClick={() => setShowPilotoModal(false)}>Cerrar</button>
            </div>

            {selectedPilotoInfo ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10, marginBottom: 16 }}>
                  <InfoCard label="Nombre" value={`${selectedPilotoInfo.usuario?.nombre || ""} ${selectedPilotoInfo.usuario?.apellido || ""}`.trim() || "—"} />
                  <InfoCard label="Email" value={selectedPilotoInfo.usuario?.email || "—"} />
                  <InfoCard label="CUI" value={selectedPilotoInfo.perfil_personal?.cui || "—"} />
                  <InfoCard label="Teléfono" value={selectedPilotoInfo.perfil_personal?.telefono_personal || "—"} />
                  <InfoCard label="Dirección" value={selectedPilotoInfo.perfil_personal?.direccion || "—"} />
                  <InfoCard label="Dorsal Preferido" value={selectedPilotoInfo.dorsal_preferido ?? "—"} />
                  <InfoCard label="Tipo de Sangre" value={selectedPilotoInfo.tipo_sangre || "—"} />
                  <InfoCard label="Alergias" value={selectedPilotoInfo.alergias || "—"} />
                  <InfoCard label="Condiciones Médicas" value={selectedPilotoInfo.condiciones_medicas || "—"} />
                  <InfoCard label="Contacto Emergencia" value={selectedPilotoInfo.nombre_contacto_emergencia || "—"} />
                  <InfoCard label="Parentesco" value={selectedPilotoInfo.parentesco_emergencia || "—"} />
                  <InfoCard label="Tel. Emergencia" value={selectedPilotoInfo.telefono_emergencia || "—"} />
                </div>

                <section className={styles.cardSection} style={{ marginBottom: 16 }}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>Motocicletas del piloto</h3>
                      <p className={styles.sectionText}>Listado completo de motocicletas registradas.</p>
                    </div>
                  </div>
                  {Array.isArray(selectedPilotoInfo.motocicletas) && selectedPilotoInfo.motocicletas.length > 0 ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {selectedPilotoInfo.motocicletas.map((moto) => (
                        <div key={moto.id} style={{ border: "1px solid #dbe4ea", borderRadius: 8, padding: 10, background: "#f8fafc" }}>
                          <strong>{moto.modelo}</strong> ({moto.anio}) - {moto.cilindrada_real} cc
                          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Marca: {moto.marca_nombre || "—"} | VIN: {moto.vin || "—"} | Apodo: {moto.apodo_moto || "—"}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className={styles.fieldHint}>No tiene motocicletas registradas.</p>}
                </section>

                <section className={styles.cardSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>Sanciones históricas</h3>
                      <p className={styles.sectionText}>Incluye sanciones de cualquier evento y categoría.</p>
                    </div>
                  </div>
                  {Array.isArray(selectedPilotoInfo.sanciones_historicas) && selectedPilotoInfo.sanciones_historicas.length > 0 ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {selectedPilotoInfo.sanciones_historicas.map((s) => (
                        <div key={s.id} style={{ border: "1px solid #fecaca", borderRadius: 8, padding: 10, background: "#fff7f7" }}>
                          <div style={{ fontWeight: 700, color: "#b91c1c" }}>{s.tipo_sancion || "Sanción"} - {s.gravedad || "Sin gravedad"}</div>
                          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                            Evento: {s.evento_nombre || "—"} | Categoría: {s.categoria_nombre || "—"} | Dorsal: {s.dorsal_asignado ?? "—"}
                          </div>
                          <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                            Motivo: {s.motivo || "—"} | Penalización: {s.penalizacion || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Fecha: {s.fecha_sancion ? new Date(s.fecha_sancion).toLocaleDateString("es-GT") : "—"} {s.comisario_nombre ? `| Comisario: ${s.comisario_nombre}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className={styles.fieldHint}>No tiene sanciones.</p>}
                </section>
              </>
            ) : <p className={styles.fieldHint}>No hay información del piloto para mostrar.</p>}
          </div>
        </div>
      ) : null}

      {pdfPreview ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 96, padding: 16 }}>
          <div style={{ width: "min(560px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 20px 60px rgba(15,23,42,0.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Inscripción registrada</h2>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPdfPreview(null)}>Cerrar</button>
            </div>

            <p className={styles.fieldHint} style={{ marginTop: 0, marginBottom: 14 }}>
              Revisa la información general y genera el comprobante PDF cuando quieras.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                ["Inscripción N.º", pdfPreview.id],
                ["Fecha", pdfPreview.fecha],
                ["Estado", pdfPreview.estado],
                ["Dorsal", pdfPreview.dorsal],
                ["Evento", pdfPreview.evento],
                ["Categoría", pdfPreview.categoria],
                ["Piloto", pdfPreview.piloto],
                ["Email", pdfPreview.email],
                ["Motocicleta", pdfPreview.moto],
                ["Año", pdfPreview.anio],
                ["Cilindrada", `${pdfPreview.cilindrada} cc`],
              ].map(([k, v]) => (
                <label key={k} className={styles.field}>
                  <span className={styles.fieldLabel}>{k}</span>
                  <input className={styles.input} value={v === "—" ? "" : v} readOnly disabled style={{ color: "#0f172a", opacity: 1 }} />
                </label>
              ))}
            </div>

            <div className={styles.formActions} style={{ gridColumn: "1 / -1" }}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPdfPreview(null)}>Cerrar</button>
              <button type="button" className={styles.primaryBtn} onClick={() => abrirVistaPreviaPDF(pdfPreview)}>Vista previa PDF</button>
            </div>
          </div>
        </div>
      ) : null}

      {showMotoModal ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 95, padding: 16 }}>
          <div style={{ width: "min(720px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 20px 60px rgba(15,23,42,0.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Agregar motocicleta</h2>
              <button type="button" className={styles.secondaryBtn} onClick={() => setShowMotoModal(false)}>Cerrar</button>
            </div>

            <p className={styles.fieldHint} style={{ marginTop: 0, marginBottom: 14 }}>
              Se registrará la moto para el piloto seleccionado y quedará disponible de inmediato para la inscripción.
            </p>

            <form onSubmit={handleCreateMoto} className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Marca</span>
                <select className={styles.input} value={motoDraft.marca_id} onChange={(e) => setMotoDraft((current) => ({ ...current, marca_id: e.target.value }))} required>
                  <option value="">Seleccione una marca</option>
                  {optionsByBrand.map((marca) => <option key={marca.id} value={marca.id}>{marca.nombre}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Modelo</span>
                <input className={styles.input} value={motoDraft.modelo} onChange={(e) => setMotoDraft((current) => ({ ...current, modelo: e.target.value }))} required placeholder="Ej. CBR 600RR" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Año</span>
                <input className={styles.input} type="number" value={motoDraft.anio} onChange={(e) => setMotoDraft((current) => ({ ...current, anio: e.target.value }))} required placeholder="2026" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Cilindrada real</span>
                <input className={styles.input} type="number" value={motoDraft.cilindrada_real} onChange={(e) => setMotoDraft((current) => ({ ...current, cilindrada_real: e.target.value }))} required placeholder="600" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>VIN</span>
                <input className={styles.input} value={motoDraft.vin} onChange={(e) => setMotoDraft((current) => ({ ...current, vin: e.target.value }))} placeholder="Opcional" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Color</span>
                <input className={styles.input} value={motoDraft.color} onChange={(e) => setMotoDraft((current) => ({ ...current, color: e.target.value }))} placeholder="Opcional" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Apodo</span>
                <input className={styles.input} value={motoDraft.apodo_moto} onChange={(e) => setMotoDraft((current) => ({ ...current, apodo_moto: e.target.value }))} placeholder="Opcional" />
              </label>

              <div className={styles.formActions} style={{ gridColumn: "1 / -1" }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowMotoModal(false)} disabled={savingMoto}>Cancelar</button>
                <button type="submit" className={styles.primaryBtn} disabled={savingMoto}>
                  {savingMoto ? "Registrando..." : "Guardar motocicleta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}