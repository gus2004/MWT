"use client";

import { useMemo, useState } from "react";
import styles from "./inscripciones.module.css";
import { SearchSelect } from "@/components/kit";

const STATE_LABELS = {
  PENDIENTE: "Pendiente",
  PAGADA: "Pagada",
  VALIDADA: "Validada",
  RECHAZADA: "Rechazada",
};

const STATE_COLORS = {
  PENDIENTE: "#f59e0b",
  PAGADA: "#2563eb",
  VALIDADA: "#16a34a",
  RECHAZADA: "#dc2626",
};

function getEstadoKey(value) {
  return String(value || "PENDIENTE").toUpperCase();
}

function stateBadge(estado) {
  const color = STATE_COLORS[getEstadoKey(estado)] || "#64748b";
  return <span className={styles.badge} style={{ background: `${color}1f`, color }}>{STATE_LABELS[getEstadoKey(estado)] || estado}</span>;
}

export default function InscripcionesReportes({ inscripciones = [], eventGroups = [] }) {
  const [filters, setFilters] = useState({ evento: "", categoria: "", estado: "", query: "" });
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const updateFilters = (updater) => {
    setFilters(updater);
    setPage(1);
  };

  const categoriaOptions = useMemo(() => {
    const seen = new Map();
    inscripciones
      .filter((item) => !filters.evento || String(item.evento?.id || item.evento_id || "") === filters.evento)
      .forEach((item) => {
        const id = String(item.categoria?.id || item.categoria_id || "");
        if (!id || seen.has(id)) return;
        seen.set(id, item.categoria?.nombre || `Categoría ${id}`);
      });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [inscripciones, filters.evento]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return inscripciones.filter((item) => {
      const piloto = `${item.piloto?.usuario?.nombre || ""} ${item.piloto?.usuario?.apellido || ""}`.trim();
      const matchesQuery = !q || [item.id, piloto, item.piloto?.usuario?.email, item.evento?.nombre, item.categoria?.nombre, item.dorsal_asignado, item.estado].some((value) => String(value || "").toLowerCase().includes(q));
      const matchesEvento = !filters.evento || String(item.evento?.id || item.evento_id || "") === filters.evento;
      const matchesCategoria = !filters.categoria || String(item.categoria?.id || item.categoria_id || "") === filters.categoria;
      const matchesEstado = !filters.estado || getEstadoKey(item.estado) === filters.estado;
      return matchesQuery && matchesEvento && matchesCategoria && matchesEstado;
    });
  }, [inscripciones, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage],
  );

  const counts = useMemo(() => {
    const total = filtered.length;
    const byEstado = { PENDIENTE: 0, PAGADA: 0, VALIDADA: 0, RECHAZADA: 0 };
    filtered.forEach((item) => {
      const key = getEstadoKey(item.estado);
      if (key in byEstado) byEstado[key] += 1;
    });
    const uniquePilots = new Set(filtered.map((item) => item.piloto_id || item.piloto?.id).filter(Boolean)).size;
    const uniqueMotos = new Set(filtered.map((item) => item.motocicleta_id || item.motocicleta?.id).filter(Boolean)).size;
    return { total, ...byEstado, uniquePilots, uniqueMotos };
  }, [filtered]);

  const byEvento = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const id = String(item.evento?.id || item.evento_id || "");
      if (!id) return;
      const entry = map.get(id) || { id, nombre: item.evento?.nombre || `Evento ${id}`, total: 0, PENDIENTE: 0, PAGADA: 0, VALIDADA: 0, RECHAZADA: 0 };
      entry.total += 1;
      const key = getEstadoKey(item.estado);
      if (key in entry) entry[key] += 1;
      map.set(id, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const exportarCSV = () => {
    const rows = [
      ["ID", "Piloto", "Email", "Evento", "Categoría", "Dorsal", "Estado", "Fecha de registro"],
      ...filtered.map((item) => [
        item.id,
        `${item.piloto?.usuario?.nombre || ""} ${item.piloto?.usuario?.apellido || ""}`.trim(),
        item.piloto?.usuario?.email || "",
        item.evento?.nombre || "",
        item.categoria?.nombre || "",
        item.dorsal_asignado || "",
        STATE_LABELS[getEstadoKey(item.estado)] || item.estado,
        item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString("es-GT") : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscripciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const head = ["N.º", "Piloto", "Evento", "Categoría", "Dorsal", "Estado", "Fecha"];
    const rows = filtered.map((item, index) => [
      index + 1,
      `${item.piloto?.usuario?.nombre || ""} ${item.piloto?.usuario?.apellido || ""}`.trim(),
      item.evento?.nombre || "—",
      item.categoria?.nombre || "—",
      item.dorsal_asignado || "—",
      STATE_LABELS[getEstadoKey(item.estado)] || item.estado,
      item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString("es-GT") : "—",
    ]);

    const th = (h) => `<th>${h}</th>`;
    const td = (c) => `<td>${String(c ?? "—").replace(/</g, "&lt;")}</td>`;
    const tabla = rows.length
      ? `<table><thead><tr>${head.map(th).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map(td).join("")}</tr>`).join("")}</tbody></table>`
      : `<p class="vacio">Sin inscripciones para los filtros seleccionados.</p>`;

    const ventana = window.open("", "printWindow");
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Inscripciones</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 2px; }
          .sub { color: #475569; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #e2e8f0; }
          thead th { padding: 6px 8px; text-align: center; border: 1px solid #64748b; font-weight: 800; }
          tbody td { padding: 6px 8px; text-align: center; border: 1px dotted #94a3b8; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          .vacio { margin-top: 12px; color: #475569; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <img src="${window.location.origin}/MWT%20-%20NEGRO.png" alt="MWT Motorsport" style="width:120px;height:auto;display:block;margin-bottom:10px;" />
        <h1>Reporte de Inscripciones</h1>
        <div class="sub">Generado el ${new Date().toLocaleDateString("es-GT")} · ${filtered.length} registros</div>
        ${tabla}
      </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
  };

  const resetFilters = () => {
    setFilters({ evento: "", categoria: "", estado: "", query: "" });
    setPage(1);
  };

  return (
    <section className={styles.analyticsShell}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Reportería del proceso de inscripción</h2>
          <p className={styles.sectionText}>Reportes exportables con filtros por evento, categoría y estado.</p>
        </div>
      </div>

      <div className={styles.analyticsFilters}>
        <input className={styles.input} type="search" placeholder="Buscar piloto, evento, dorsal..." value={filters.query} onChange={(e) => updateFilters((c) => ({ ...c, query: e.target.value }))} />
        <SearchSelect clearable groups={eventGroups} value={filters.evento || ""} onChange={(v) => updateFilters((c) => ({ ...c, evento: v, ...(v !== c.evento ? { categoria: "" } : {}) }))} placeholder="Todos los eventos" searchPlaceholder="Buscar evento o campeonato..." className="w-full" inputClassName={styles.input} />
        <select className={styles.input} value={filters.categoria} onChange={(e) => updateFilters((c) => ({ ...c, categoria: e.target.value }))}>
          <option value="">Todas las categorías</option>
          {categoriaOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select className={styles.input} value={filters.estado} onChange={(e) => updateFilters((c) => ({ ...c, estado: e.target.value }))}>
          <option value="">Todos los estados</option>
          {Object.entries(STATE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="button" className={styles.secondaryBtn} onClick={resetFilters}>Limpiar filtros</button>
        <div className={styles.formActions}>
          <button type="button" className={styles.primaryBtn} onClick={exportarCSV} style={{ minHeight: 44, width: "100%" }}>Exportar CSV</button>
          <button type="button" className={styles.primaryBtn} onClick={exportarPDF} style={{ minHeight: 44, width: "100%" }}>Exportar PDF</button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Inscripciones</span><strong className={styles.metricValue}>{counts.total}</strong><span className={styles.metricHint}>Registros visibles</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Pendientes</span><strong className={styles.metricValue}>{counts.PENDIENTE}</strong><span className={styles.metricHint}>Sin pago</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Pagadas</span><strong className={styles.metricValue}>{counts.PAGADA}</strong><span className={styles.metricHint}>Pago registrado</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Validadas</span><strong className={styles.metricValue}>{counts.VALIDADA}</strong><span className={styles.metricHint}>Inscripción confirmada</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Rechazadas</span><strong className={styles.metricValue}>{counts.RECHAZADA}</strong><span className={styles.metricHint}>Bajas / rechazos</span></div>
      </div>

      <section className={styles.cardSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Resumen por evento</h3>
            <p className={styles.sectionText}>Conteo de inscripciones por evento según los filtros aplicados.</p>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          {byEvento.length === 0 ? (
            <div className={styles.emptyState}>No hay datos para el filtro seleccionado.</div>
          ) : (
            <table className={styles.table}>
              <thead><tr><th>Evento</th><th>Total</th><th>Pendientes</th><th>Pagadas</th><th>Validadas</th><th>Rechazadas</th></tr></thead>
              <tbody>
                {byEvento.map((evento) => (
                  <tr key={evento.id}>
                    <td><strong>{evento.nombre}</strong></td>
                    <td className={styles.monospace}>{evento.total}</td>
                    <td className={styles.monospace}>{evento.PENDIENTE}</td>
                    <td className={styles.monospace}>{evento.PAGADA}</td>
                    <td className={styles.monospace}>{evento.VALIDADA}</td>
                    <td className={styles.monospace}>{evento.RECHAZADA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className={styles.cardSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Listado detallado</h3>
            <p className={styles.sectionText}>Detalle de las {filtered.length} inscripciones que coinciden con el filtro.</p>
          </div>
        </div>
        {filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              Mostrar
              <select
                className={styles.input}
                style={{ width: 76, padding: "6px 8px", fontSize: 13 }}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              por página
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ padding: "7px 12px", opacity: currentPage === 1 ? 0.5 : 1 }}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span style={{ color: "var(--text-muted)", fontSize: 13, minWidth: 105, textAlign: "center" }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                className={styles.primaryBtn}
                style={{ padding: "7px 12px", opacity: currentPage === totalPages ? 0.5 : 1 }}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {filtered.length} resultados
            </span>
          </div>
        )}
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>No hay inscripciones que coincidan con los filtros.</div>
          ) : (
            <table className={styles.table}>
              <thead><tr><th>Piloto</th><th>Evento</th><th>Categoría</th><th>Dorsal</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{`${item.piloto?.usuario?.nombre || ""} ${item.piloto?.usuario?.apellido || ""}`.trim()}</strong>
                      <div className={styles.fieldHint}>{item.piloto?.usuario?.email || ""}</div>
                    </td>
                    <td>{item.evento?.nombre || "—"}</td>
                    <td>{item.categoria?.nombre || "—"}</td>
                    <td className={styles.monospace}>{item.dorsal_asignado || "—"}</td>
                    <td>{stateBadge(item.estado)}</td>
                    <td className={styles.monospace}>{item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString("es-GT") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
}