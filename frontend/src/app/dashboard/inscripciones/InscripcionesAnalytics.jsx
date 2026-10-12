"use client";

import { useEffect, useMemo, useState } from "react";
import { getParrillaEventoCategoria } from "@/lib/clasificacionesApi";
import { SearchSelect } from "@/components/kit";
import styles from "./inscripciones.module.css";

const STATE_COLORS = {
  PENDIENTE: "#f59e0b",
  PAGADA: "#2563eb",
  VALIDADA: "#16a34a",
  RECHAZADA: "#dc2626",
};

const STATE_LABELS = {
  PENDIENTE: "Pendientes",
  PAGADA: "Pagadas",
  VALIDADA: "Validadas",
  RECHAZADA: "Rechazadas",
};

function getEstadoKey(value) {
  return String(value || "PENDIENTE").toUpperCase();
}

function getUniqueOptions(items, getter) {
  const seen = new Map();
  items.forEach((item) => {
    const entry = getter(item);
    if (!entry?.id || seen.has(entry.id)) return;
    seen.set(entry.id, entry);
  });
  return Array.from(seen.values());
}

function buildGradient(items, total) {
  if (!total) return "linear-gradient(90deg, #e2e8f0, #e2e8f0)";

  let acc = 0;
  const parts = [];
  items.forEach((item) => {
    if (!item.value) return;
    const start = (acc / total) * 100;
    acc += item.value;
    const end = (acc / total) * 100;
    parts.push(`${item.color} ${start}% ${end}%`);
  });

  return parts.length ? `conic-gradient(${parts.join(", ")})` : "linear-gradient(90deg, #e2e8f0, #e2e8f0)";
}

function getHeatColor(value, max) {
  if (!value || !max) return "#f8fafc";
  const ratio = value / max;
  const green = Math.round(235 - ratio * 100);
  const blue = Math.round(250 - ratio * 80);
  return `rgb(14, ${Math.max(90, green)}, ${Math.max(120, blue)})`;
}

function getMonthKey(dateValue) {
  if (!dateValue) return "Sin fecha";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey) {
  if (monthKey === "Sin fecha") return monthKey;
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat("es-GT", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function parseTimeToMs(timeValue) {
  if (!timeValue) return null;
  const parts = String(timeValue).split(":");
  if (parts.length !== 2) return null;
  const minutes = Number(parts[0]);
  const secondsParts = parts[1].split(".");
  const seconds = Number(secondsParts[0]);
  const millis = secondsParts[1] ? Number(secondsParts[1].padEnd(3, "0")) : 0;
  if (Number.isNaN(minutes) || Number.isNaN(seconds) || Number.isNaN(millis)) return null;
  return minutes * 60000 + seconds * 1000 + millis;
}

function formatMsToTime(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const minutes = Math.floor(ms / 60000);
  const rest = ms % 60000;
  const seconds = Math.floor(rest / 1000);
  const millis = rest % 1000;
  return `${String(minutes).padStart(2, "0")}:
${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`.replace("\n", "");
}

function MetricCard({ label, value, hint }) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      {hint ? <span className={styles.metricHint}>{hint}</span> : null}
    </article>
  );
}

function BarChart({ title, subtitle, items }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          <p className={styles.chartText}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.barList}>
        {items.length === 0 ? (
          <p className={styles.emptyAnalysis}>No hay datos para mostrar.</p>
        ) : (
          items.map((item) => {
            const pct = Math.round((item.value / max) * 100);
            return (
              <div key={item.id || item.label} className={styles.barRow}>
                <div className={styles.barMeta}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${pct}%`, background: item.color || "linear-gradient(90deg, #0ea5a4, #2563eb)" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function MiniBarChart({ title, subtitle, items }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          <p className={styles.chartText}>{subtitle}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className={styles.emptyAnalysis}>No hay datos para mostrar.</p>
      ) : (
        <div className={styles.sparkBars}>
          {items.map((item) => (
            <div key={item.id || item.label} className={styles.sparkBarItem} title={`${item.label}: ${item.value}`}>
              <div className={styles.sparkBarLabel}>{item.label}</div>
              <div className={styles.sparkBarTrack}>
                <div className={styles.sparkBarFill} style={{ height: `${Math.max(10, Math.round((item.value / max) * 100))}%`, background: item.color || "linear-gradient(180deg, #0ea5a4, #2563eb)" }} />
              </div>
              <strong className={styles.sparkBarValue}>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TimeRankingChart({ title, subtitle, items }) {
  const maxMs = Math.max(...items.map((item) => item.mejorMs || 0), 1);
  const minMs = Math.min(...items.map((item) => item.mejorMs || maxMs), maxMs);
  const span = Math.max(maxMs - minMs, 1);

  return (
    <section className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          <p className={styles.chartText}>{subtitle}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className={styles.emptyAnalysis}>No hay tiempos registrados para este filtro.</p>
      ) : (
        <div className={styles.timeRankList}>
          {items.map((item, index) => {
            const normalized = ((maxMs - item.mejorMs) / span) * 100;
            return (
              <div key={`${item.eventoId}-${item.categoriaId}-${item.inscripcionId}`} className={styles.timeRankRow}>
                <div className={styles.timeRankMeta}>
                  <div>
                    <strong>#{index + 1} {item.pilotoNombre}</strong>
                    <div className={styles.timeRankSub}>{item.eventoNombre} · {item.categoriaNombre} · Dorsal #{item.dorsal}</div>
                  </div>
                  <strong>{item.mejorTiempo}</strong>
                </div>
                <div className={styles.timeRankTrack} title={`Mejor tiempo: ${item.mejorTiempo}`}>
                  <div className={styles.timeRankFill} style={{ width: `${Math.max(8, normalized)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function InscripcionesAnalytics({ inscripciones = [], eventGroups = [] }) {
  const [filters, setFilters] = useState({
    query: "",
    estado: "",
    evento: "",
    categoria: "",
    dorsal: "",
  });
  const [bestTimesLoading, setBestTimesLoading] = useState(false);
  const [bestTimesError, setBestTimesError] = useState("");
  const [bestTimes, setBestTimes] = useState([]);

  const categoriaOptions = useMemo(() => getUniqueOptions(
    inscripciones.filter((item) => !filters.evento || String(item.evento?.id || item.evento_id || "") === filters.evento),
    (item) => ({
      id: String(item.categoria?.id || item.categoria_id || ""),
      label: item.categoria?.nombre || `Categoría ${item.categoria_id || ""}`,
    })
  ), [inscripciones, filters.evento]);

  const dorsalOptions = useMemo(() => {
    const seen = new Set();
    return inscripciones
      .map((item) => String(item.dorsal_asignado || ""))
      .filter((value) => value && !seen.has(value) && seen.add(value))
      .sort((a, b) => Number(a) - Number(b));
  }, [inscripciones]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return inscripciones.filter((item) => {
      const matchesQuery = !q || [
        item.id,
        item.piloto?.usuario?.nombre,
        item.piloto?.usuario?.apellido,
        item.piloto?.usuario?.email,
        item.evento?.nombre,
        item.categoria?.nombre,
        item.estado,
        item.dorsal_asignado,
      ].some((value) => String(value || "").toLowerCase().includes(q));

      const matchesEstado = !filters.estado || getEstadoKey(item.estado) === filters.estado;
      const matchesEvento = !filters.evento || String(item.evento?.id || item.evento_id || "") === filters.evento;
      const matchesCategoria = !filters.categoria || String(item.categoria?.id || item.categoria_id || "") === filters.categoria;
      const matchesDorsal = !filters.dorsal || String(item.dorsal_asignado || "") === filters.dorsal;

      return matchesQuery && matchesEstado && matchesEvento && matchesCategoria && matchesDorsal;
    });
  }, [filters, inscripciones]);

  const uniqueEventCategoryCombos = useMemo(() => {
    const seen = new Set();
    return filtered
      .map((item) => {
        const eventId = String(item.evento?.id || item.evento_id || "");
        const categoriaId = String(item.categoria?.id || item.categoria_id || "");
        if (!eventId || !categoriaId) return null;
        const key = `${eventId}:${categoriaId}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          key,
          eventoId: eventId,
          eventoNombre: item.evento?.nombre || `Evento ${eventId}`,
          categoriaId,
          categoriaNombre: item.categoria?.nombre || `Categoría ${categoriaId}`,
        };
      })
      .filter(Boolean);
  }, [filtered]);

  useEffect(() => {
    let mounted = true;

    const loadBestTimes = async () => {
      setBestTimesLoading(true);
      setBestTimesError("");

      try {
        const responses = await Promise.all(uniqueEventCategoryCombos.map(async (combo) => {
          const items = await getParrillaEventoCategoria(combo.eventoId, combo.categoriaId);
          return items.map((row) => ({
            eventoId: combo.eventoId,
            eventoNombre: combo.eventoNombre,
            categoriaId: combo.categoriaId,
            categoriaNombre: combo.categoriaNombre,
            inscripcionId: row.id,
            pilotoNombre: row.piloto_nombre || "—",
            dorsal: row.dorsal_asignado || "—",
            mejorTiempo: row.mejor_tiempo || "—",
            mejorMs: parseTimeToMs(row.mejor_tiempo),
          }));
        }));

        const merged = responses.flat().filter((row) => row.mejorMs != null);
        merged.sort((a, b) => a.mejorMs - b.mejorMs);

        if (!mounted) return;
        setBestTimes(merged);
      } catch (error) {
        if (mounted) {
          setBestTimes([]);
          setBestTimesError(error?.message || "No se pudieron cargar los mejores tiempos.");
        }
      } finally {
        if (mounted) setBestTimesLoading(false);
      }
    };

    if (uniqueEventCategoryCombos.length === 0) {
      setBestTimes([]);
      setBestTimesError("");
      setBestTimesLoading(false);
      return () => { mounted = false; };
    }

    loadBestTimes();
    return () => { mounted = false; };
  }, [uniqueEventCategoryCombos]);

  const summary = useMemo(() => {
    const uniquePilots = new Set(filtered.map((item) => item.piloto_id || item.piloto?.id).filter(Boolean));
    const uniqueEvents = new Set(filtered.map((item) => item.evento_id || item.evento?.id).filter(Boolean));
    const uniqueMotos = new Set(filtered.map((item) => item.motocicleta_id || item.motocicleta?.id).filter(Boolean));
    const sanciones = filtered.flatMap((item) => Array.isArray(item.sanciones) ? item.sanciones : []);

    return {
      inscripciones: filtered.length,
      pilotos: uniquePilots.size,
      eventos: uniqueEvents.size,
      motocicletas: uniqueMotos.size,
      sanciones: sanciones.length,
    };
  }, [filtered]);

  const bestTimeSummary = useMemo(() => {
    if (!bestTimes.length) {
      return {
        record: null,
        averageTop5: null,
      };
    }

    const record = bestTimes[0];
    const top5 = bestTimes.slice(0, 5);
    const averageTop5 = Math.round(top5.reduce((sum, item) => sum + item.mejorMs, 0) / top5.length);

    return {
      record,
      averageTop5: formatMsToTime(averageTop5),
    };
  }, [bestTimes]);

  const statusItems = useMemo(() => {
    const counts = { PENDIENTE: 0, PAGADA: 0, VALIDADA: 0, RECHAZADA: 0 };
    filtered.forEach((item) => {
      const key = getEstadoKey(item.estado);
      if (key in counts) counts[key] += 1;
    });
    return Object.keys(counts).map((key) => ({
      key,
      label: STATE_LABELS[key],
      value: counts[key],
      color: STATE_COLORS[key],
    }));
  }, [filtered]);

  const topCategorias = useMemo(() => {
    const counts = new Map();
    filtered.forEach((item) => {
      const id = String(item.categoria?.id || item.categoria_id || "");
      if (!id) return;
      const label = item.categoria?.nombre || `Categoría ${id}`;
      counts.set(id, { id, label, value: (counts.get(id)?.value || 0) + 1 });
    });
    return Array.from(counts.values()).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filtered]);

  const topPilotos = useMemo(() => {
    const counts = new Map();
    filtered.forEach((item) => {
      const id = String(item.piloto?.id || item.piloto_id || "");
      if (!id) return;
      const label = `${item.piloto?.usuario?.nombre || ""} ${item.piloto?.usuario?.apellido || ""}`.trim() || `Piloto ${id}`;
      counts.set(id, { id, label, value: (counts.get(id)?.value || 0) + 1 });
    });
    return Array.from(counts.values()).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filtered]);

  const trendByMonth = useMemo(() => {
    const counts = new Map();
    filtered.forEach((item) => {
      const key = getMonthKey(item.fecha_registro);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([key, value]) => ({ label: getMonthLabel(key), value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered]);

  const motoBrands = useMemo(() => {
    const counts = new Map();
    filtered.forEach((item) => {
      const label = item.motocicleta?.marca?.nombre || item.motocicleta?.marca_nombre || "Sin marca";
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const sanctionsBySeverity = useMemo(() => {
    const counts = new Map();
    filtered.forEach((item) => {
      (Array.isArray(item.sanciones) ? item.sanciones : []).forEach((sancion) => {
        const key = String(sancion.gravedad || "Sin gravedad");
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const dorsalUsage = useMemo(() => {
    const counts = new Map();
    filtered.forEach((item) => {
      const key = String(item.dorsal_asignado || "");
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label: `#${label}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const bestTimesByCategory = useMemo(() => {
    const grouped = new Map();
    bestTimes.forEach((item) => {
      const key = item.categoriaId;
      const current = grouped.get(key);
      if (!current || item.mejorMs < current.mejorMs) {
        grouped.set(key, item);
      }
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.mejorMs - b.mejorMs)
      .slice(0, 8)
      .map((item) => ({
        id: item.categoriaId,
        label: item.categoriaNombre,
        value: item.mejorMs,
        color: "linear-gradient(90deg, #0ea5a4, #2563eb)",
        mejorTiempo: item.mejorTiempo,
      }));
  }, [bestTimes]);

  const matrix = useMemo(() => {
    const eventMap = new Map();
    const categoryMap = new Map();

    filtered.forEach((item) => {
      const eventId = String(item.evento?.id || item.evento_id || "");
      const categoryId = String(item.categoria?.id || item.categoria_id || "");
      if (!eventId || !categoryId) return;

      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, item.evento?.nombre || `Evento ${eventId}`);
      }
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, item.categoria?.nombre || `Categoría ${categoryId}`);
      }
    });

    const events = Array.from(eventMap.entries()).map(([id, label]) => ({
      id,
      label,
      value: filtered.filter((item) => String(item.evento?.id || item.evento_id || "") === id).length,
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    const categories = Array.from(categoryMap.entries()).map(([id, label]) => ({
      id,
      label,
      value: filtered.filter((item) => String(item.categoria?.id || item.categoria_id || "") === id).length,
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    const max = Math.max(...events.flatMap((evento) => categories.map((categoria) => filtered.filter((item) => String(item.evento?.id || item.evento_id || "") === evento.id && String(item.categoria?.id || item.categoria_id || "") === categoria.id).length)), 1);

    return { events, categories, max };
  }, [filtered]);

  const donutStyle = useMemo(() => buildGradient(statusItems, filtered.length), [filtered.length, statusItems]);

  const resetFilters = () => setFilters({ query: "", estado: "", evento: "", categoria: "", dorsal: "" });

  return (
    <section className={styles.analyticsShell}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Analítica de inscripciones</h2>
          <p className={styles.sectionText}>Filtros interactivos y gráficos tipo dashboard para leer el estado real del sistema.</p>
        </div>
      </div>

      <div className={styles.analyticsFilters}>
        <input className={styles.input} type="search" placeholder="Buscar piloto, evento, categoría o dorsal..." value={filters.query} onChange={(e) => setFilters((current) => ({ ...current, query: e.target.value }))} />
        <select className={styles.input} value={filters.estado} onChange={(e) => setFilters((current) => ({ ...current, estado: e.target.value }))}>
          <option value="">Todos los estados</option>
          {Object.entries(STATE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <SearchSelect clearable groups={eventGroups} value={filters.evento || ""} onChange={(v) => setFilters((current) => ({ ...current, evento: v, ...(v !== current.evento ? { categoria: "" } : {}) }))} placeholder="Todos los eventos" searchPlaceholder="Buscar evento o campeonato..." className="w-full" inputClassName={styles.input} />
        <select className={styles.input} value={filters.categoria} onChange={(e) => setFilters((current) => ({ ...current, categoria: e.target.value }))}>
          <option value="">Todas las categorías</option>
          {categoriaOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select className={styles.input} value={filters.dorsal} onChange={(e) => setFilters((current) => ({ ...current, dorsal: e.target.value }))}>
          <option value="">Todos los dorsales</option>
          {dorsalOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" className={styles.secondaryBtn} onClick={resetFilters}>Limpiar filtros</button>
      </div>

      <div className={styles.kpiGrid}>
        <MetricCard label="Inscripciones" value={summary.inscripciones} hint="Registros visibles" />
        <MetricCard label="Pilotos" value={summary.pilotos} hint="Pilotos únicos" />
        <MetricCard label="Eventos" value={summary.eventos} hint="Eventos activos" />
        <MetricCard label="Motocicletas" value={summary.motocicletas} hint="Motos usadas" />
        <MetricCard label="Sanciones" value={summary.sanciones} hint="Historial ligado" />
      </div>

      <div className={styles.kpiGrid}>
        <MetricCard
          label="Récord absoluto"
          value={bestTimeSummary.record ? bestTimeSummary.record.mejorTiempo : "—"}
          hint={bestTimeSummary.record ? `${bestTimeSummary.record.pilotoNombre} · ${bestTimeSummary.record.categoriaNombre}` : (bestTimesLoading ? "Buscando tiempos..." : "Sin tiempos registrados")}
        />
        <MetricCard
          label="Promedio top 5"
          value={bestTimeSummary.averageTop5 || "—"}
          hint="Promedio de los 5 mejores tiempos"
        />
        <MetricCard
          label="Combos con tiempo"
          value={new Set(bestTimes.map((item) => `${item.eventoId}:${item.categoriaId}`)).size}
          hint="Evento + categoría con datos"
        />
        <MetricCard
          label="Pilotos cronometrados"
          value={new Set(bestTimes.map((item) => item.pilotoNombre)).size}
          hint="Pilotos con al menos un tiempo"
        />
        <MetricCard
          label="Mejor tiempo cargado"
          value={bestTimes.length ? bestTimes[0].mejorTiempo : "—"}
          hint={bestTimesLoading ? "Actualizando desde clasificación" : (bestTimesError || "Datos de clasificación")}
        />
      </div>

      <div className={styles.chartGrid}>
        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Distribución por estado</h3>
              <p className={styles.chartText}>Vista tipo pastel/donut con el total filtrado.</p>
            </div>
          </div>
          <div className={styles.donutLayout}>
            <div className={styles.donutChart} style={{ background: donutStyle }}>
              <div className={styles.donutCenter}>
                <strong>{filtered.length}</strong>
                <span>inscripciones</span>
              </div>
            </div>
            <div className={styles.legendList}>
              {statusItems.map((item) => (
                <div key={item.key} className={styles.legendItem}>
                  <span className={styles.legendSwatch} style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BarChart title="Top categorías" subtitle="Cantidad de inscripciones por categoría dentro del filtro actual." items={topCategorias} />
      </div>

      <div className={styles.chartGrid}>
        <BarChart title="Top pilotos" subtitle="Pilotos con mayor cantidad de inscripciones visibles." items={topPilotos} />

        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Heatmap evento vs categoría</h3>
              <p className={styles.chartText}>Más oscuro significa más inscripciones en esa combinación.</p>
            </div>
          </div>

          {matrix.events.length === 0 || matrix.categories.length === 0 ? (
            <p className={styles.emptyAnalysis}>No hay suficiente información para construir el heatmap.</p>
          ) : (
            <div className={styles.heatmapWrap}>
              <div className={styles.heatmapGrid} style={{ gridTemplateColumns: `240px repeat(${matrix.categories.length}, minmax(90px, 1fr))` }}>
                <div className={styles.heatmapHead}>Evento / Categoría</div>
                {matrix.categories.map((categoria) => <div key={categoria.id} className={styles.heatmapHead}>{categoria.label}</div>)}
                {matrix.events.map((evento) => (
                  <div key={evento.id} style={{ display: "contents" }}>
                    <div className={styles.heatmapRowLabel}>{evento.label}</div>
                    {matrix.categories.map((categoria) => {
                      const value = filtered.filter((item) => String(item.evento?.id || item.evento_id || "") === evento.id && String(item.categoria?.id || item.categoria_id || "") === categoria.id).length;
                      return (
                        <div
                          key={`${evento.id}-${categoria.id}`}
                          className={styles.heatmapCell}
                          style={{ background: getHeatColor(value, matrix.max) }}
                          title={`${evento.label} / ${categoria.label}: ${value}`}
                        >
                          <strong>{value}</strong>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className={styles.chartGrid}>
        <TimeRankingChart
          title="Mejores tiempos registrados"
          subtitle="Ranking global de los mejores tiempos obtenidos desde clasificaciones. Menor tiempo = mejor posición."
          items={bestTimes.slice(0, 10)}
        />

        <BarChart
          title="Récord por categoría"
          subtitle="La mejor marca registrada en cada categoría visible."
          items={bestTimesByCategory.map((item) => ({
            ...item,
            label: `${item.label} · ${item.mejorTiempo}`,
            value: Math.max(...bestTimesByCategory.map((candidate) => candidate.value), 1) - item.value,
          }))}
        />
      </div>

      <div className={styles.chartGrid}>
        <MiniBarChart
          title="Tendencia por mes"
          subtitle="Cómo se concentran las inscripciones por mes dentro del filtro actual."
          items={trendByMonth}
        />

        <BarChart
          title="Marcas de motocicleta"
          subtitle="Marcas más presentes en las inscripciones filtradas."
          items={motoBrands}
        />
      </div>

      <div className={styles.chartGrid}>
        <BarChart
          title="Sanciones por gravedad"
          subtitle="Distribución histórica de sanciones vinculadas al filtro actual."
          items={sanctionsBySeverity}
        />

        <BarChart
          title="Uso de dorsales"
          subtitle="Dorsales más repetidos dentro de la selección visible."
          items={dorsalUsage}
        />
      </div>
    </section>
  );
}