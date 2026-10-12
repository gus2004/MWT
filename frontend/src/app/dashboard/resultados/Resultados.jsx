"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./resultados.module.css";
import { getPublicInscripciones, getInscripcionOptions } from "@/lib/publicApi";
import { SearchSelect } from "@/components/kit";
import TablaClasificacionOficial from "../clasificaciones/TablaClasificacionOficial";

function formatDateTime(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPoints(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(0) : "0";
}

function pointsForPosition(position) {
  return [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1][Number(position) - 1] || 0;
}

function getHeatStyle(index, total) {
  if (total <= 1) return { opacity: 1 };
  const ratio = index / Math.max(total - 1, 1);
  return {
    opacity: 0.9,
    background: `linear-gradient(135deg, rgba(14,165,233,${0.18 + ratio * 0.16}), rgba(37,99,235,${0.22 + ratio * 0.18}))`,
  };
}

function getToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^| )mwt_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : "";
}

function getOperatorId() {
  try {
    const raw = window.localStorage.getItem("mwt_user");
    const user = raw ? JSON.parse(raw) : null;
    const localId = user?.id || user?.usuario?.id || user?.usuario_id;
    if (localId) return String(localId);
    const token = getToken();
    const payload = token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
    return String(payload?.sub || payload?.userId || payload?.id || "");
  } catch {
    return "";
  }
}

function authHeaders(json = false) {
  const token = getToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function Resultados() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inscripciones, setInscripciones] = useState([]);
  const [options, setOptions] = useState({ eventos: [], categorias: [], pilotos: [], motocicletas: [], marcas: [] });
  const [selectedEvento, setSelectedEvento] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [groupId, setGroupId] = useState("");
  const [group, setGroup] = useState(null);
  const [heat, setHeat] = useState(1);
  const [heatRows, setHeatRows] = useState({ 1: [], 2: [] });
  const [heatSources, setHeatSources] = useState({ 1: [], 2: [] });
  const [heatLoading, setHeatLoading] = useState(false);
  const [savingHeat, setSavingHeat] = useState(false);
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const finalSectionRef = useRef(null);
  const [pilotToAdd, setPilotToAdd] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [publicInscripciones, publicOptions] = await Promise.all([
          getPublicInscripciones(),
          getInscripcionOptions(),
        ]);

        if (!mounted) return;
        setInscripciones(Array.isArray(publicInscripciones) ? publicInscripciones : []);
        setOptions(publicOptions);
        setSelectedEvento((current) => current || (publicOptions.eventos?.length ? String(publicOptions.eventos[0].id) : ""));
      } catch (err) {
        if (mounted) setError(err?.message || "No se pudo cargar la información de resultados.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadGroup = async () => {
      setGroupId("");
      setGroup(null);
      setHeatRows({ 1: [], 2: [] });
      setHeatSources({ 1: [], 2: [] });
      if (!selectedEvento || !selectedCategoria) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/eventos/${selectedEvento}/panel/grupos`, {
          headers: authHeaders(),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "No se pudo cargar el grupo de competencia.");
        const groups = Array.isArray(data?.items) ? data.items : [];
        const selectedGroup = groups.find((item) => (item.categorias || []).some((category) => String(category.id) === String(selectedCategoria)));
        if (!mounted) return;
        setGroup(selectedGroup || null);
        setGroupId(selectedGroup?.id || "");
      } catch (err) {
        if (mounted) setWarning(err?.message || "No se pudo cargar la configuración de heats.");
      }
    };

    loadGroup();
    return () => { mounted = false; };
  }, [selectedEvento, selectedCategoria]);

  useEffect(() => {
    let mounted = true;
    const loadHeats = async () => {
      if (!groupId) return;
      setHeatLoading(true);
      setWarning("");
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "";
        const [r1, r2, p1, p2] = await Promise.all([
          fetch(`${api}/api/resultados/grupo/${groupId}/heat/1?categoria_id=${encodeURIComponent(selectedCategoria)}`, { headers: authHeaders() }),
          fetch(`${api}/api/resultados/grupo/${groupId}/heat/2?categoria_id=${encodeURIComponent(selectedCategoria)}`, { headers: authHeaders() }),
          fetch(`${api}/api/resultados/grupo/${groupId}/pilotos?heat=1&categoria_id=${encodeURIComponent(selectedCategoria)}`, { headers: authHeaders() }),
          fetch(`${api}/api/resultados/grupo/${groupId}/pilotos?heat=2&categoria_id=${encodeURIComponent(selectedCategoria)}`, { headers: authHeaders() }),
        ]);
        const read = async (response) => {
          const data = await response.json().catch(() => null);
          return Array.isArray(data?.items) ? data.items : [];
        };
        const [saved1, saved2, pilots1, pilots2] = await Promise.all([read(r1), read(r2), read(p1), read(p2)]);
        if (!mounted) return;
        const inscriptionFallback = inscripciones.filter((item) => (
          String(item.evento_id || item.evento?.id || "") === String(selectedEvento)
          && String(item.categoria_id || item.categoria?.id || "") === String(selectedCategoria)
        )).map((item) => ({
          ...item,
          inscripcion_id: item.id,
          nombre: item.piloto?.usuario
            ? `${item.piloto.usuario.nombre} ${item.piloto.usuario.apellido}`.trim()
            : item.nombre || item.piloto_id || "Piloto",
          dorsal: item.dorsal_asignado || item.dorsal,
          fecha_registro: item.fecha_registro,
        }));
        setHeatRows({ 1: saved1, 2: saved2 });
        const mergeCandidates = (...lists) => {
          const merged = new Map();
          lists.flat().forEach((item) => {
            const id = String(item.inscripcion_id || item.id || "");
            if (id && !merged.has(id)) merged.set(id, item);
          });
          return Array.from(merged.values());
        };
        setHeatSources({
          1: mergeCandidates(pilots1, inscriptionFallback, saved1),
          2: mergeCandidates(pilots2, saved2),
        });
        if (!saved1.length && !saved2.length && pilots1.length) setNotice("Parrilla de Manga 1 lista. Revisa el orden antes de iniciar.");
        if (group?.heat1_completado && !saved2.length && !pilots2.length) setWarning("La Manga 2 aún no tiene pilotos disponibles.");
      } catch (err) {
        if (mounted) setWarning(err?.message || "No se pudieron cargar las parrillas.");
      } finally {
        if (mounted) setHeatLoading(false);
      }
    };

    loadHeats();
    return () => { mounted = false; };
  }, [groupId, group?.heat1_completado, selectedCategoria, selectedEvento, inscripciones]);

  const filteredInscripciones = useMemo(() => {
    return inscripciones.filter((item) => (
      String(item.evento_id || item.evento?.id || "") === String(selectedEvento) &&
      String(item.categoria_id || item.categoria?.id || "") === String(selectedCategoria)
    ));
  }, [inscripciones, selectedEvento, selectedCategoria]);

  const eventOptions = useMemo(() => options.eventos || [], [options.eventos]);
  const eventoGroups = useMemo(() => {
    const map = {};
    eventOptions.forEach((ev) => {
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
  }, [eventOptions]);
  const categoryOptions = useMemo(() => {
    const source = options.categorias || [];
    return source.filter((categoria) => {
      if (!selectedEvento) return true;
      const categoryEventId = String(categoria.evento_id || categoria.evento?.id || "");
      const categoryChampionshipId = String(categoria.campeonato_id || categoria.campeonato?.id || "");
      const selectedEvent = eventOptions.find((evento) => String(evento.id) === String(selectedEvento));
      const selectedChampionshipId = String(selectedEvent?.campeonato_id || selectedEvent?.campeonato?.id || "");
      return !categoryEventId || categoryEventId === String(selectedEvento) || (selectedChampionshipId && categoryChampionshipId === selectedChampionshipId);
    });
  }, [options.categorias, eventOptions, selectedEvento]);

  useEffect(() => {
    if (!selectedCategoria && categoryOptions.length) {
      setSelectedCategoria(String(categoryOptions[0].id));
    }
  }, [categoryOptions, selectedCategoria]);

  const selectedEventRecord = useMemo(() => eventOptions.find((evento) => String(evento.id) === String(selectedEvento)) || null, [eventOptions, selectedEvento]);
  const selectedCategoryRecord = useMemo(() => categoryOptions.find((categoria) => String(categoria.id) === String(selectedCategoria)) || null, [categoryOptions, selectedCategoria]);

  const championshipId = selectedEventRecord?.campeonato_id || selectedEventRecord?.campeonato?.id || selectedCategoryRecord?.campeonato_id || selectedCategoryRecord?.campeonato?.id || null;

  const stats = [
    { label: "Inscritos en categoría", value: filteredInscripciones.length },
    { label: "Con clasificación", value: heatRows[1].filter((row) => row.mejor_tiempo).length },
    { label: "En parrilla", value: (heatRows[heat] || []).length },
    { label: "Origen", value: heatRows[1].some((row) => row.mejor_tiempo) ? "Clasificación" : "Inscripción" },
  ];

  const handleGenerate = () => {
    if (!selectedEvento || !selectedCategoria) return;
  };

  const canGenerate = Boolean(selectedEvento && selectedCategoria);

  const activeRows = useMemo(() => heatRows[heat] || [], [heatRows, heat]);
  const hasSavedClassification = heatRows[1].some((row) => Boolean(row.mejor_tiempo));
  const hasHeatOne = Boolean(group?.heat1_completado || heatRows[1].some((row) => row.puntos !== undefined));
  const finalRows = useMemo(() => {
    const heatOne = new Map(heatRows[1].map((row, index) => [row.inscripcion_id || row.id, { ...row, heat1Position: index + 1 }]));
    const heatTwo = new Map(heatRows[2].map((row, index) => [row.inscripcion_id || row.id, { ...row, heat2Position: index + 1 }]));
    return Array.from(new Set([...heatOne.keys(), ...heatTwo.keys()]))
      .map((id) => {
        const first = heatOne.get(id) || {};
        const second = heatTwo.get(id) || {};
        const heat1Points = pointsForPosition(first.heat1Position);
        const heat2Points = pointsForPosition(second.heat2Position);
        return {
          ...first,
          ...second,
          inscripcion_id: id,
          nombre: second.piloto || second.nombre || first.piloto || first.nombre || "Piloto sin nombre",
          dorsal: second.dorsal || first.dorsal || "—",
          puntosHeat1: heat1Points,
          puntosHeat2: heat2Points,
          puntosFinales: heat1Points + heat2Points,
          desempate: second.heat2Position || Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((row) => row.heat1Position && row.heat2Position)
      .sort((a, b) => b.puntosFinales - a.puntosFinales || a.desempate - b.desempate || a.heat1Position - b.heat1Position)
      .map((row, index) => ({ ...row, posicionFinal: index + 1 }));
  }, [heatRows]);

  const removeHeatRow = (index) => {
    const row = activeRows[index];
    const next = activeRows.filter((_, rowIndex) => rowIndex !== index);
    setHeatRows((current) => ({ ...current, [heat]: next }));
    setWarning(`Advertencia: ${row?.nombre || row?.piloto || "El piloto seleccionado"} fue eliminado de la parrilla de la Manga ${heat}. Guarda para confirmar el cambio.`);
  };

  const moveHeatRow = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= activeRows.length) return;
    const next = [...activeRows];
    [next[index], next[target]] = [next[target], next[index]];
    setHeatRows((current) => ({ ...current, [heat]: next }));
    setNotice(`Posición manual actualizada para el Heat ${heat}.`);
  };

  const pilotOptions = useMemo(() => (heatSources[heat] || []).map((item) => {
    const nombre = item.piloto?.usuario
      ? `${item.piloto.usuario.nombre} ${item.piloto.usuario.apellido}`.trim()
      : item.nombre || item.piloto_id || "Piloto";
    const dorsal = item.dorsal_asignado || item.dorsal || "";
    const itemId = item.inscripcion_id || item.id;
    const used = activeRows.some((row) => String(row.inscripcion_id || row.id) === String(itemId));
    return {
      value: String(itemId),
      label: `#${dorsal} · ${nombre}`,
      disabled: used,
    };
  }), [heatSources, heat, activeRows]);

  const addPilotToHeat = (inscripcionId) => {
    if (!inscripcionId) return;
    const candidate = (heatSources[heat] || []).find((item) => String(item.inscripcion_id || item.id) === String(inscripcionId));
    if (!candidate) return;
    const candidateId = candidate.inscripcion_id || candidate.id;
    if (activeRows.some((row) => String(row.inscripcion_id || row.id) === String(candidateId))) {
      setWarning("Ese piloto ya está en la parrilla.");
      return;
    }
    const nombre = candidate.piloto?.usuario
      ? `${candidate.piloto.usuario.nombre} ${candidate.piloto.usuario.apellido}`.trim()
      : candidate.nombre || candidate.piloto_id || "Piloto";
    const next = [...activeRows, {
      ...candidate,
      inscripcion_id: candidateId,
      nombre,
      dorsal: candidate.dorsal_asignado || candidate.dorsal,
      fecha_registro: candidate.fecha_registro,
    }];
    setHeatRows((current) => ({ ...current, [heat]: next }));
    setPilotToAdd("");
    setNotice(`Piloto #${candidate.dorsal_asignado || candidate.dorsal} agregado a la posición ${next.length}.`);
  };

  const dropHeatRow = (targetIndex) => {
    if (draggedIndex == null || draggedIndex === targetIndex) return;
    const next = [...activeRows];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    setHeatRows((current) => ({ ...current, [heat]: next }));
    setDraggedIndex(null);
    setNotice(`Posición manual actualizada para el Heat ${heat}.`);
  };

  const clearActiveHeat = () => {
    setHeatRows((current) => ({ ...current, [heat]: [] }));
    setPilotToAdd("");
    setConfirmClear(false);
    setWarning("");
    setNotice(`Parrilla del Heat ${heat} limpia. Puedes volver a seleccionarla desde el buscador.`);
  };

  const saveActiveHeat = async () => {
    if (!groupId || !activeRows.length) return;
    if (activeRows.length > 45) {
      setWarning("No se puede guardar una parrilla con más de 45 pilotos.");
      return;
    }
    setSavingHeat(true);
    setNotice("");
    setWarning("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/resultados/grupo/${groupId}/heat/${heat}`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          usuario_id: getOperatorId(),
          categoria_id: selectedCategoria,
          resultados: activeRows.map((row, index) => ({
            inscripcion_id: row.inscripcion_id,
            posicion: index + 1,
            estatus_carrera: row.estatus_carrera || "FIN",
          })),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "No se pudieron guardar los resultados.");
      setNotice(`Manga ${heat} registrada correctamente. ${Array.isArray(data?.warnings) ? data.warnings.join(" ") : ""}`);
      if (activeRows.length < 15) setWarning("Advertencia: hay menos de 15 pilotos; se guardaron los números disponibles.");
      setConfirmSave(false);
      const savedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/resultados/grupo/${groupId}/heat/${heat}?categoria_id=${encodeURIComponent(selectedCategoria)}`, { headers: authHeaders() });
      const savedData = await savedResponse.json().catch(() => null);
      const savedRows = Array.isArray(savedData?.items) ? savedData.items : activeRows;
      setHeatRows((current) => ({ ...current, [heat]: savedRows }));
      if (heat === 1) {
        const nextResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/resultados/grupo/${groupId}/pilotos?heat=2&categoria_id=${encodeURIComponent(selectedCategoria)}`, { headers: authHeaders() });
        const nextData = await nextResponse.json().catch(() => null);
        const nextRows = Array.isArray(nextData?.items) ? nextData.items : [];
        setHeatRows((current) => ({ ...current, 2: [] }));
        setHeatSources((current) => ({ ...current, 2: nextRows }));
        setHeat(2);
        setNotice("Manga 1 registrada. La parrilla de Manga 2 ya se puede armar con este orden manual.");
      } else if (heat === 2) {
        setHeat(3);
        setNotice("Manga 2 registrada. Resultado final generado.");
        window.requestAnimationFrame(() => finalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    } catch (err) {
      setWarning(err?.message || "No se pudieron guardar los resultados.");
    } finally {
      setSavingHeat(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Resultados y parrilla</span>
          <h1 className={styles.title}>Genera la parrilla del evento y registra los puntos oficiales por posición.</h1>
          <p className={styles.subtitle}>
            La clasificación guardada ordena el Heat 1. Si no existe, se usa la fecha y hora de inscripción; el Heat 2 se arma con el orden del Heat 1.
          </p>
        </div>
        <div className={styles.heroCard}>
          <div className={styles.heroCardRow}>
            <span>Evento</span>
            <strong>{selectedEventRecord?.nombre || "Selecciona un evento"}</strong>
          </div>
          <div className={styles.heroCardRow}>
            <span>Categoría</span>
            <strong>{selectedCategoryRecord?.nombre || "Selecciona una categoría"}</strong>
          </div>
          <div className={styles.heroCardRow}>
            <span>Campeonato</span>
            <strong>{championshipId || "Sin campeonato detectado"}</strong>
          </div>
        </div>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.field}>
          <span>Evento</span>
          <SearchSelect groups={eventoGroups} value={selectedEvento || ""} onChange={(v) => { setSelectedEvento(v); setSelectedCategoria(""); }} placeholder="Selecciona un evento" searchPlaceholder="Buscar por nombre o campeonato..." className="w-full" inputClassName={styles.fieldInput} />
        </label>

        <label className={styles.field}>
          <span>Categoría</span>
          <select value={selectedCategoria} onChange={(e) => setSelectedCategoria(e.target.value)} disabled={!selectedEvento}>
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <button className={styles.generateButton} onClick={() => { handleGenerate(); setHeat(1); }} disabled={!canGenerate}>
          Generar parrilla
        </button>
      </section>

      <section className={styles.noticeStack} aria-live="polite">
        {notice ? <div className={styles.noticeSuccess}>{notice}</div> : null}
        {warning ? <div className={styles.noticeWarning}>{warning}</div> : null}
        {activeRows.length > 40 ? <div className={styles.noticeWarning}>Advertencia: hay {activeRows.length} pilotos. El máximo recomendado es 40; hasta 45 requiere confirmación.</div> : null}
      </section>

      <section className={styles.metrics}>
        {stats.map((stat) => (
          <article key={stat.label} className={styles.metricCard}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Parrilla generada</h2>
              <p className={styles.panelText}>
                {hasSavedClassification
                  ? "Ordenada por el mejor tiempo de clasificación guardado para este evento y categoría."
                  : "No hay clasificación guardada; ordenada por fecha y hora de inscripción."}
              </p>
            </div>
            <span className={styles.statusPill}>{hasSavedClassification ? "Por clasificación" : "Por inscripción"}</span>
          </div>

          <div className={styles.heatTabs}>
            {[1, 2, 3].map((number) => (
              <button key={number} type="button" className={heat === number ? styles.heatTabActive : styles.heatTab} onClick={() => setHeat(number)} disabled={(number === 2 && !hasHeatOne) || (number === 3 && !(heatRows[1].length && heatRows[2].length))}>
                {number === 3 ? "Resultado final" : `Heat ${number} · Llegada manual`}
              </button>
            ))}
          </div>

          <div className={styles.heatMeta}>
            <span>{group ? `Grupo: ${group.nombre}` : "Sin grupo de competencia"}</span>
            <strong>{activeRows.length} pilotos</strong>
          </div>

          {loading ? (
            <div className={styles.emptyState}>Cargando resultados...</div>
          ) : error ? (
            <div className={styles.emptyState}>{error}</div>
          ) : !canGenerate ? (
            <div className={styles.emptyState}>Selecciona un evento y una categoría para empezar.</div>
          ) : !groupId ? (
            <div className={styles.emptyState}>La categoría seleccionada no está asignada a un grupo de competencia.</div>
          ) : heatLoading ? (
            <div className={styles.emptyState}>Cargando parrilla y resultados...</div>
          ) : heat === 3 ? (
            <div className={styles.finalPreview}>
              <h3>Resultado final</h3>
              <p>Resultado general calculado con los puntos de Heat 1 y Heat 2.</p>
              {finalRows.slice(0, 15).map((item) => (
                <div key={item.inscripcion_id} className={styles.finalPreviewRow}>
                  <strong>#{item.posicionFinal}</strong>
                  <span>{item.nombre}</span>
                  <b>{item.puntosHeat1} + {item.puntosHeat2} = {item.puntosFinales}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.gridList}>
              <div className={styles.addPilotBar}>
                <SearchSelect
                  options={pilotOptions}
                  value={pilotToAdd}
                  onChange={addPilotToHeat}
                  placeholder={heat === 2 ? "Selecciona pilotos del Heat 1" : "Agregar piloto por dorsal"}
                  searchPlaceholder="Buscar dorsal o piloto..."
                  keepOpenOnSelect
                  className={styles.addPilotSelect}
                  disabled={heat === 2 && !hasHeatOne}
                />
                <button type="button" className={styles.clearButton} onClick={() => setConfirmClear(true)} disabled={!activeRows.length}>
                  Limpiar parrilla
                </button>
                <span>{heat === 2 ? "Selecciona el orden de llegada del Heat 2." : "Selecciona un piloto para crear la parrilla."}</span>
              </div>
              {activeRows.length === 0 ? (
                <div className={styles.emptyState}>
                  {pilotOptions.length > 0
                    ? "La parrilla está vacía. Selecciona pilotos arriba para comenzar."
                    : heat === 2
                      ? "Completa y guarda el Heat 1 para construir esta parrilla."
                      : "No hay inscripciones disponibles para esta categoría."}
                </div>
              ) : null}
              {activeRows.map((item, index) => {
                const id = item.inscripcion_id || item.id;
                return (
                  <article
                    key={`${id}-${index}`}
                    className={styles.gridCard}
                    style={getHeatStyle(index, activeRows.length)}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropHeatRow(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                  >
                    <div className={styles.gridPosition}>#{index + 1}</div>
                    <div className={styles.gridContent}>
                      <strong>{item.pilotoNombre || item.nombre || item.piloto || "Piloto sin nombre"}</strong>
                      <span>Posición {index + 1} · Dorsal #{item.dorsal_asignado || item.dorsal || "—"}</span>
                      <span>{formatDateTime(item.fecha_registro || item.fecha)}</span>
                      {heat === 1 && !hasSavedClassification ? <small>Orden de inscripción</small> : null}
                    </div>
                    <div className={styles.gridScore}>
                      <span>Puntos</span>
                      <strong>{pointsForPosition(index + 1)}</strong>
                    </div>
                    <div className={styles.rowControls}>
                      <span className={styles.dragHint} title="Arrastra la tarjeta para cambiar su posición">Mover</span>
                      <button type="button" className={styles.orderButton} onClick={() => moveHeatRow(index, -1)} disabled={index === 0} title="Subir posición">↑</button>
                      <button type="button" className={styles.orderButton} onClick={() => moveHeatRow(index, 1)} disabled={index === activeRows.length - 1} title="Bajar posición">↓</button>
                      <button type="button" className={styles.removeButton} onClick={() => removeHeatRow(index)} title="Eliminar piloto de la parrilla">Eliminar</button>
                    </div>
                  </article>
                );
              })}
              {activeRows.length > 0 ? <div className={styles.heatActions}>
                <span>{activeRows.length < 15 ? "Se requieren mínimo 15 números; puedes guardar los disponibles." : "Orden de llegada listo para registrar."}</span>
                <button type="button" className={styles.generateButton} onClick={() => setConfirmSave(true)} disabled={savingHeat || activeRows.length > 45}>
                  {savingHeat ? "Guardando..." : `Registrar Heat ${heat}`}
                </button>
              </div> : null}
            </div>
          )}
        </article>

        <aside className={styles.sideStack}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Regla del resultado</h2>
                <p className={styles.panelText}>La clasificación no suma puntos. Los puntos se asignan al guardar cada heat.</p>
              </div>
            </div>

            {finalRows.length === 0 ? (
              <div className={styles.emptyState}>Guarda el Heat 1 y el Heat 2 para generar el resultado final.</div>
            ) : (
              <div className={styles.pointsList}>
                {finalRows.slice(0, 8).map((item) => (
                  <div key={item.inscripcion_id} className={styles.pointsRow}>
                    <div>
                      <strong>#{item.posicionFinal} {item.nombre}</strong>
                      <span>H1 {item.puntosHeat1} pts · H2 {item.puntosHeat2} pts</span>
                    </div>
                    <strong>{formatPoints(item.puntosFinales)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Regla aplicada</h2>
                <p className={styles.panelText}>Puedes cambiar el modo según el reglamento del evento.</p>
              </div>
            </div>
            <div className={styles.ruleList}>
              <div className={styles.ruleRow}>
                <span>Clasificaciones</span>
                <strong>Solo para el primer heat</strong>
              </div>
              <div className={styles.ruleRow}>
                <span>Sin qualy</span>
                <strong>Usar lista de pilotos</strong>
              </div>
              <div className={styles.ruleRow}>
                <span>Con puntos</span>
                <strong>Orden descendente</strong>
              </div>
              <div className={styles.ruleRow}>
                <span>Sin puntos</span>
                <strong>Inscripción por fecha</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>

      {activeRows.length > 0 ? (
        <section ref={finalSectionRef} className={styles.footerPanel}>
          <div>
            <h2 className={styles.panelTitle}>Parrilla exportable</h2>
            <p className={styles.panelText}>Resultado del Heat {heat}. Puedes exportarlo con el formato oficial de resultados.</p>
          </div>
          <TablaClasificacionOficial
            filas={activeRows.map((item, index) => ({
              pos: index + 1,
              dorsal: item.dorsal_asignado || item.dorsal || "-",
              nombre: item.nombre || item.pilotoNombre || item.piloto || "Piloto sin nombre",
              clase: selectedCategoryRecord?.nombre || "-",
              puntos: pointsForPosition(index + 1),
            }))}
            campeonato={selectedEventRecord?.campeonato_nombre || selectedEventRecord?.nombre || "Resultados"}
            circuito={selectedEventRecord?.circuito_nombre || ""}
            valida={selectedEventRecord?.valida || selectedEventRecord?.numero_valida || 1}
            fecha={selectedEventRecord?.fecha_inicio || selectedEventRecord?.fecha || new Date().toLocaleDateString("es-GT")}
            categoria={selectedCategoryRecord?.nombre || "Categoría"}
            hora={selectedEventRecord?.hora || ""}
            mostrarPuntos
            tipoTabla="resultado"
            maxRows={15}
          />
        </section>
      ) : null}

      {finalRows.length > 0 && heatRows[2].length > 0 ? (
        <section className={styles.footerPanel}>
          <div>
            <h2 className={styles.panelTitle}>Resultado final</h2>
            <p className={styles.panelText}>Gran final: suma de puntos del Heat 1 y Heat 2. En empate gana quien terminó delante en el Heat 2.</p>
          </div>
          <TablaClasificacionOficial
            filas={finalRows.map((item) => ({
              pos: item.posicionFinal,
              dorsal: item.dorsal,
              nombre: item.nombre,
              clase: selectedCategoryRecord?.nombre || "-",
              puntosHeat1: item.puntosHeat1,
              puntosHeat2: item.puntosHeat2,
              puntosTotal: item.puntosFinales,
            }))}
            campeonato="RESULTADO FINAL"
            circuito={selectedEventRecord?.circuito_nombre || ""}
            valida={selectedEventRecord?.valida || selectedEventRecord?.numero_valida || 1}
            fecha={selectedEventRecord?.fecha_inicio || selectedEventRecord?.fecha || new Date().toLocaleDateString("es-GT")}
            categoria={selectedCategoryRecord?.nombre || "Categoría"}
            hora="GRAN FINAL"
            tipoTabla="final"
            maxRows={15}
          />
        </section>
      ) : null}

      {confirmSave ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="confirm-results-title">
            <h2 id="confirm-results-title">Confirmar registro del Heat {heat}</h2>
            <p>Se reemplazarán los resultados guardados de este heat y se recalcularán los puntos.</p>
            {activeRows.length > 40 ? <div className={styles.noticeWarning}>Advertencia: estás registrando más de 40 pilotos. El límite excepcional es 45.</div> : null}
            {activeRows.length < 15 ? <div className={styles.noticeWarning}>Hay menos de 15 pilotos. Se guardarán los números disponibles.</div> : null}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmSave(false)}>Cancelar</button>
              <button type="button" className={styles.generateButton} onClick={saveActiveHeat} disabled={savingHeat}>{savingHeat ? "Guardando..." : "Confirmar y guardar"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmClear ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="clear-results-title">
            <h2 id="clear-results-title">Advertencia: limpiar Heat {heat}</h2>
            <p>Se quitarán todas las tarjetas de la parrilla actual. Después podrás volver a agregarlas desde el buscador.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmClear(false)}>Cancelar</button>
              <button type="button" className={styles.clearButton} onClick={clearActiveHeat}>Sí, limpiar parrilla</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
