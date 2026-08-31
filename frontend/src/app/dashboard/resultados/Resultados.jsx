"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./resultados.module.css";
import { getPublicInscripciones, getInscripcionOptions } from "@/lib/publicApi";
import { listClasificaciones } from "@/lib/clasificacionesApi";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatPoints(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(0) : "0";
}

function getPilotLabel(item) {
  const nombres = [item?.piloto?.usuario?.nombre, item?.piloto?.usuario?.apellido].filter(Boolean).join(" ").trim();
  return nombres || item?.piloto?.nombre_completo || item?.piloto?.nombre || "Piloto sin nombre";
}

function getSortDate(item) {
  return new Date(item?.fecha_registro || item?.createdAt || item?.created_at || 0).getTime() || 0;
}

function getUniqueCombos(items) {
  const seen = new Map();
  items.forEach((item) => {
    const eventoId = String(item.evento_id || item.evento?.id || "");
    const categoriaId = String(item.categoria_id || item.categoria?.id || "");
    if (!eventoId || !categoriaId) return;
    const key = `${eventoId}:${categoriaId}`;
    if (!seen.has(key)) {
      seen.set(key, {
        key,
        eventoId,
        eventoNombre: item.evento?.nombre || `Evento ${eventoId}`,
        categoriaId,
        categoriaNombre: item.categoria?.nombre || `Categoría ${categoriaId}`,
      });
    }
  });
  return Array.from(seen.values());
}

function getHeatStyle(index, total) {
  if (total <= 1) return { opacity: 1 };
  const ratio = index / Math.max(total - 1, 1);
  return {
    opacity: 0.9,
    background: `linear-gradient(135deg, rgba(14,165,233,${0.18 + ratio * 0.16}), rgba(37,99,235,${0.22 + ratio * 0.18}))`,
  };
}

export default function Resultados() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inscripciones, setInscripciones] = useState([]);
  const [options, setOptions] = useState({ eventos: [], categorias: [], pilotos: [], motocicletas: [], marcas: [] });
  const [selectedEvento, setSelectedEvento] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [generationMode, setGenerationMode] = useState("points");
  const [pointsSource, setPointsSource] = useState("historical");
  const [sortMode, setSortMode] = useState("historic-date");
  const [classificationItems, setClassificationItems] = useState([]);
  const [classificationLoading, setClassificationLoading] = useState(false);

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
        if (!selectedEvento && publicOptions.eventos?.length) {
          setSelectedEvento(String(publicOptions.eventos[0].id));
        }
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
    const loadClassifications = async () => {
      if (!selectedEvento || !selectedCategoria) {
        setClassificationItems([]);
        return;
      }

      setClassificationLoading(true);
      try {
        const items = await listClasificaciones({ campeonatoId: null, categoriaId: selectedCategoria });
        if (!mounted) return;
        const normalized = Array.isArray(items)
          ? items.filter((item) => String(item.categoria_id || item.categoria?.id || "") === String(selectedCategoria))
          : [];
        setClassificationItems(normalized);
      } catch {
        if (mounted) setClassificationItems([]);
      } finally {
        if (mounted) setClassificationLoading(false);
      }
    };

    loadClassifications();
    return () => {
      mounted = false;
    };
  }, [selectedEvento, selectedCategoria]);

  const filteredInscripciones = useMemo(() => {
    return inscripciones.filter((item) => (
      String(item.evento_id || item.evento?.id || "") === String(selectedEvento) &&
      String(item.categoria_id || item.categoria?.id || "") === String(selectedCategoria)
    ));
  }, [inscripciones, selectedEvento, selectedCategoria]);

  const eventOptions = options.eventos || [];
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

  const historicalPoints = useMemo(() => {
    const items = classificationItems
      .map((item) => ({
        id: String(item.id || `${item.piloto_id}-${item.categoria_id}`),
        pilotoId: String(item.piloto_id || item.piloto?.id || ""),
        pilotoNombre: getPilotLabel(item),
        puntos: Number(item.puntos_total || item.puntos || 0),
        posicion: Number(item.posicion || 0),
        dorsal: item.dorsal_asignado || item.dorsal || "—",
        fecha: item.fecha_registro || item.createdAt || null,
        eventoNombre: item.evento?.nombre || selectedEventRecord?.nombre || "Evento",
        categoriaNombre: item.categoria?.nombre || selectedCategoryRecord?.nombre || "Categoría",
      }))
      .filter((item) => item.pilotoId);

    const merged = new Map();
    items.forEach((item) => {
      const current = merged.get(item.pilotoId);
      if (!current || item.puntos > current.puntos || (item.puntos === current.puntos && getSortDate(item) > getSortDate(current))) {
        merged.set(item.pilotoId, item);
      }
    });

    return Array.from(merged.values())
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (sortMode === "historic-date") return getSortDate(b) - getSortDate(a);
        return a.pilotoNombre.localeCompare(b.pilotoNombre, "es");
      });
  }, [classificationItems, selectedEventRecord, selectedCategoryRecord, sortMode]);

  const generatedGrid = useMemo(() => {
    const candidateSource = generationMode === "points" && historicalPoints.length ? historicalPoints : filteredInscripciones.map((item) => ({
      pilotoId: String(item.piloto_id || item.piloto?.id || ""),
      pilotoNombre: getPilotLabel(item),
      dorsal: item.dorsal_asignado || item.dorsal || "—",
      puntos: 0,
      fecha: item.fecha_registro || item.createdAt || null,
      eventoNombre: item.evento?.nombre || selectedEventRecord?.nombre || "Evento",
      categoriaNombre: item.categoria?.nombre || selectedCategoryRecord?.nombre || "Categoría",
    }));

    const merged = new Map();
    candidateSource.forEach((item) => {
      const key = String(item.pilotoId || item.pilotoNombre || "");
      if (!key) return;
      const current = merged.get(key);
      if (!current) {
        merged.set(key, item);
        return;
      }
      if ((item.puntos || 0) > (current.puntos || 0)) {
        merged.set(key, item);
        return;
      }
      if ((item.puntos || 0) === (current.puntos || 0) && getSortDate(item) > getSortDate(current)) {
        merged.set(key, item);
      }
    });

    const sorted = Array.from(merged.values()).sort((a, b) => {
      if (generationMode === "points" && historicalPoints.length) {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      }

      if (sortMode === "inscription-date") {
        return getSortDate(a) - getSortDate(b);
      }

      if (sortMode === "historic-date") {
        return getSortDate(b) - getSortDate(a);
      }

      return String(a.pilotoNombre || "").localeCompare(String(b.pilotoNombre || ""), "es");
    });

    return sorted.map((item, index) => ({ ...item, position: index + 1 }));
  }, [generationMode, filteredInscripciones, historicalPoints, selectedEventRecord, selectedCategoryRecord, sortMode]);

  const usesHistoricalPoints = generationMode === "points" && historicalPoints.length > 0;
  const usesFallbackPilots = !usesHistoricalPoints;

  const stats = [
    { label: "Inscritos en categoría", value: filteredInscripciones.length },
    { label: "Con puntaje histórico", value: historicalPoints.length },
    { label: "Generados", value: generatedGrid.length },
    { label: "Modo", value: generationMode === "points" ? "Por puntos" : "Lista base" },
  ];

  const handleGenerate = () => {
    if (!selectedEvento || !selectedCategoria) return;
    if (generationMode === "points" && !historicalPoints.length) {
      setGenerationMode("list");
    }
  };

  const canGenerate = Boolean(selectedEvento && selectedCategoria);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Resultados y parrilla</span>
          <h1 className={styles.title}>Genera la salida por puntos o por lista de pilotos, según el reglamento del evento.</h1>
          <p className={styles.subtitle}>
            Selecciona el evento y la categoría. Si hay historial de puntos, el sistema arma la parrilla automáticamente; si no existe historial, cae a la lista de inscritos.
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
          <select value={selectedEvento} onChange={(e) => { setSelectedEvento(e.target.value); setSelectedCategoria(""); }}>
            <option value="">Selecciona un evento</option>
            {eventOptions.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nombre}
              </option>
            ))}
          </select>
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

        <label className={styles.field}>
          <span>Modo de generación</span>
          <select value={generationMode} onChange={(e) => setGenerationMode(e.target.value)}>
            <option value="points">Por puntos históricos</option>
            <option value="list">Lista de pilotos</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Orden de respaldo</span>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="historic-date">Fecha histórica</option>
            <option value="inscription-date">Fecha de inscripción</option>
            <option value="name">Nombre del piloto</option>
          </select>
        </label>

        <button className={styles.generateButton} onClick={handleGenerate} disabled={!canGenerate}>
          Generar parrilla
        </button>
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
                {usesHistoricalPoints
                  ? "Ordenada por puntos acumulados y resuelta por fecha histórica cuando hay empate."
                  : "No hay historial suficiente; se genera la lista de pilotos inscritos para esta categoría."}
              </p>
            </div>
            <span className={styles.statusPill}>{usesHistoricalPoints ? "Por puntos" : "Lista base"}</span>
          </div>

          {loading ? (
            <div className={styles.emptyState}>Cargando resultados...</div>
          ) : error ? (
            <div className={styles.emptyState}>{error}</div>
          ) : !canGenerate ? (
            <div className={styles.emptyState}>Selecciona un evento y una categoría para empezar.</div>
          ) : generatedGrid.length === 0 ? (
            <div className={styles.emptyState}>No hay pilotos para generar la parrilla.</div>
          ) : (
            <div className={styles.gridList}>
              {generatedGrid.map((item, index) => (
                <article key={`${item.pilotoId}-${index}`} className={styles.gridCard} style={getHeatStyle(index, generatedGrid.length)}>
                  <div className={styles.gridPosition}>#{index + 1}</div>
                  <div className={styles.gridContent}>
                    <strong>{item.pilotoNombre}</strong>
                    <span>Dorsal {item.dorsal || "—"}</span>
                    <span>{formatDate(item.fecha)}</span>
                  </div>
                  <div className={styles.gridScore}>
                    <span>{usesHistoricalPoints ? "Puntos" : "Base"}</span>
                    <strong>{usesHistoricalPoints ? formatPoints(item.puntos) : "Inscrito"}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <aside className={styles.sideStack}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Histórico de puntos</h2>
                <p className={styles.panelText}>Se usa cuando la categoría tiene registros previos y el evento permite orden por puntos.</p>
              </div>
            </div>

            {classificationLoading ? (
              <div className={styles.emptyState}>Cargando clasificaciones...</div>
            ) : historicalPoints.length === 0 ? (
              <div className={styles.emptyState}>No hay puntos históricos. Se usará la lista de pilotos inscritos.</div>
            ) : (
              <div className={styles.pointsList}>
                {historicalPoints.slice(0, 8).map((item, index) => (
                  <div key={`${item.pilotoId}-${index}`} className={styles.pointsRow}>
                    <div>
                      <strong>#{index + 1} {item.pilotoNombre}</strong>
                      <span>{item.eventoNombre} · {item.categoriaNombre}</span>
                    </div>
                    <strong>{formatPoints(item.puntos)}</strong>
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

      {generatedGrid.length > 0 ? (
        <section className={styles.footerPanel}>
          <div>
            <h2 className={styles.panelTitle}>Vista previa rápida</h2>
            <p className={styles.panelText}>Lista para copiar, imprimir o usar como base del primer heat.</p>
          </div>
          <div className={styles.previewChips}>
            {generatedGrid.slice(0, 6).map((item) => (
              <span key={item.pilotoId} className={styles.previewChip}>
                #{item.position} {item.pilotoNombre}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
