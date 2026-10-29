"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, CalendarClock, Download, FileSpreadsheet, FileText, Gavel, TrendingUp, Users, Flag, Wallet, Shield, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { Badge, Btn, Card, Empty, Kpi, Field, Modal, selectCls } from "@/components/kit";
import { soporteApi } from "@/lib/soporteApi";

const EST_BADGE = {
  BORRADOR: ["gray", "Borrador"],
  ABIERTO: ["success", "Abierto"],
  EN_CURSO: ["blue", "En curso"],
  FINALIZADO: ["warning", "Finalizado"],
  CANCELADO: ["error", "Cancelado"],
};

const EST_SAN = {
  PENDIENTE: ["blue", "Pendiente"],
  EN_PROCESO: ["warning", "En proceso"],
  RESUELTO: ["success", "Resuelto"],
};

const fechaHora = (d) => (d ? new Date(d).toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function ReportesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("inscripciones");
  const [rango, setRango] = useState("90"); // días: 30 | 90 | 365
  const [expCSV, setExpCSV] = useState(false);
  const [expPDF, setExpPDF] = useState(false);
  const [expExcel, setExpExcel] = useState(false);
  const [aviso, setAviso] = useState("");
  const [stamp, setStamp] = useState(null);
  const [ingresoFiltro, setIngresoFiltro] = useState({ query: "", campeonato: "", estado: "", desde: "", hasta: "", orden: "fecha_desc" });
  const [ingresoPagina, setIngresoPagina] = useState(1);
  const [ingresoDetalle, setIngresoDetalle] = useState(null);
  const [detallePagina, setDetallePagina] = useState(1);
  const ingresosPorPagina = 8;
  const detallesPorPagina = 10;

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await soporteApi.getResumenReportes();
      setData(d);
      setStamp(new Date());
    } catch (e) {
      setError(e?.message || "No se pudo generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const maxInsc = useMemo(() => Math.max(1, ...(data?.inscripciones_por_evento || []).map((e) => e.inscripciones || 0)), [data]);
  const maxMarca = useMemo(() => Math.max(1, ...(data?.marcas || []).map((m) => m.count || 0)), [data]);
  const maxCrec = useMemo(() => Math.max(1, ...(data?.crecimiento || []).map((c) => c.total || 0)), [data]);
  const maxEst = useMemo(() => Math.max(1, ...(data?.estado_inscripciones || []).map((e) => e.count || 0)), [data]);

  // Sanciones recientes filtradas por el rango seleccionado (días hacia atrás)
  const sancionesRango = useMemo(() => {
    if (!data?.sanciones_recientes) return [];
    const limite = new Date();
    limite.setDate(limite.getDate() - Number(rango));
    return (data.sanciones_recientes || []).filter((s) => new Date(s.fecha) >= limite);
  }, [data, rango]);

  const campeonatosIngresos = useMemo(() => {
    const items = (data?.ingresos_por_evento || []).map((e) => [e.campeonato_id, e.campeonato]).filter(([id]) => id);
    return Array.from(new Map(items).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const ingresosFiltrados = useMemo(() => {
    const query = ingresoFiltro.query.trim().toLowerCase();
    const desde = ingresoFiltro.desde ? new Date(`${ingresoFiltro.desde}T00:00:00`) : null;
    const hasta = ingresoFiltro.hasta ? new Date(`${ingresoFiltro.hasta}T23:59:59`) : null;
    const rows = (data?.ingresos_por_evento || []).filter((e) => {
      const fecha = new Date(e.fecha_inicio);
      const texto = `${e.evento} ${e.campeonato}`.toLowerCase();
      return (!query || texto.includes(query))
        && (!ingresoFiltro.campeonato || e.campeonato_id === ingresoFiltro.campeonato)
        && (!ingresoFiltro.estado || e.estado === ingresoFiltro.estado)
        && (!desde || fecha >= desde)
        && (!hasta || fecha <= hasta);
    });
    return rows.sort((a, b) => {
      if (ingresoFiltro.orden === "ingreso_desc") return (b.ingresos || 0) - (a.ingresos || 0);
      if (ingresoFiltro.orden === "ingreso_asc") return (a.ingresos || 0) - (b.ingresos || 0);
      if (ingresoFiltro.orden === "evento_asc") return a.evento.localeCompare(b.evento);
      return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
    });
  }, [data, ingresoFiltro]);

  const ingresosTotalPaginas = Math.max(1, Math.ceil(ingresosFiltrados.length / ingresosPorPagina));
  const ingresosPaginaActual = Math.min(ingresoPagina, ingresosTotalPaginas);
  const ingresosVisibles = ingresosFiltrados.slice((ingresosPaginaActual - 1) * ingresosPorPagina, ingresosPaginaActual * ingresosPorPagina);
  const ingresosFiltradosTotal = ingresosFiltrados.reduce((sum, e) => sum + Number(e.ingresos || 0), 0);
  const ingresosConfirmados = (data?.ingresos_por_evento || []).reduce((sum, e) => sum + Number(e.ingresos || 0), 0);
  const actualizarIngresoFiltro = (patch) => {
    setIngresoFiltro((current) => ({ ...current, ...patch }));
    setIngresoPagina(1);
  };
  const dinero = (value) => `Q${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const detalleTotalPaginas = Math.max(1, Math.ceil((ingresoDetalle?.ingresos_detalle?.length || 0) / detallesPorPagina));
  const detallePaginaActual = Math.min(detallePagina, detalleTotalPaginas);
  const detallesVisibles = (ingresoDetalle?.ingresos_detalle || []).slice(
    (detallePaginaActual - 1) * detallesPorPagina,
    detallePaginaActual * detallesPorPagina,
  );

  const copiaAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(""), 3500);
  };

  const dataDelTipo = () => {
    if (!data) return { title: "", head: [], rows: [] };
    if (tipo === "inscripciones") return {
      title: "Inscripciones por evento",
      head: ["Evento", "Fecha", "Estado", "Inscripciones", "Validadas"],
      rows: (data.inscripciones_por_evento || []).map((e) => [e.evento, fechaHora(e.fecha_inicio), e.estado, e.inscripciones || 0, e.validadas || 0]),
    };
    if (tipo === "ingresos") return {
      title: "Ingresos por evento",
      head: ["Evento", "Campeonato", "Fecha", "Inscripciones pagadas", "Pendientes", "Ingreso (Q)", "Ticket promedio (Q)"],
      rows: ingresosFiltrados.map((e) => [e.evento, e.campeonato, fechaHora(e.fecha_inicio), e.inscripciones_pagadas || 0, e.pagos_pendientes || 0, Number(e.ingresos || 0).toFixed(2), Number(e.ticket_promedio || 0).toFixed(2)]),
    };
    if (tipo === "marcas") return {
      title: "Participación por marca",
      head: ["Marca", "Motos"],
      rows: (data.marcas || []).map((m) => [m.nombre, m.count]),
    };
    if (tipo === "sanciones") return {
      title: `Sanciones del comisariato (últimos ${rango} días)`,
      head: ["Fecha y hora", "Piloto", "Evento", "Tipo", "Penalización", "Estado"],
      rows: sancionesRango.map((s) => [fechaHora(s.fecha), s.piloto, s.evento, s.tipo, s.penalizacion || "—", s.gravedad]),
    };
    return {
      title: "Crecimiento de participantes",
      head: ["Mes", "Participantes acumulados"],
      rows: (data.crecimiento || []).map((c) => [c.mes, c.total]),
    };
  };

  const exportarCSV = () => {
    const { title, head, rows } = dataDelTipo();
    const cell = (c) => `"${String(c ?? "").replace(/"/g, '""')}"`;
    const linea = [
      ["MWT MOTORSPORT · SISTEMA DE GESTIÓN DEPORTIVA"],
      [`REPORTE: ${title}`],
      [`Generado: ${fechaHora(new Date())}`],
      [""],
      head.map(cell).join(","),
      ...rows.map((r) => r.map(cell).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + linea], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Reporte_${tipo}_${rango}d_${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExpCSV(true); setTimeout(() => setExpCSV(false), 2000);
    copiaAviso(`CSV generado: "${title}" (${rows.length} fila(s)).`);
  };

  const exportarExcel = () => {
    const { title, head, rows } = dataDelTipo();
    if (!rows.length) {
      copiaAviso("No hay datos para exportar con los filtros seleccionados.");
      return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["MWT MOTORSPORT · SISTEMA DE GESTIÓN DEPORTIVA"],
      [`REPORTE: ${title}`],
      [`Generado: ${fechaHora(new Date())}`],
      [""],
      head,
      ...rows,
    ]);
    worksheet["!cols"] = head.map((header, index) => ({
      wch: Math.min(42, Math.max(String(header).length + 2, ...rows.map((row) => String(row[index] ?? "").length + 2))),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `Reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExpExcel(true); setTimeout(() => setExpExcel(false), 2000);
    copiaAviso(`Excel generado: "${title}" (${rows.length} fila(s)).`);
  };

  const exportarPDF = () => {
    const { title, head, rows } = dataDelTipo();
    const th = (h) => `<th>${h}</th>`;
    const td = (c) => `<td>${String(c ?? "—").replace(/</g, "&lt;")}</td>`;
    const tabla = rows.length
      ? `<table><thead><tr>${head.map(th).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map(td).join("")}</tr>`).join("")}</tbody></table>`
      : `<p class="vacio">Sin datos para el rango seleccionado.</p>`;

    const ventana = window.open("", "printWindow");
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte MWT — ${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #0F172A; background: #fff; }
          .banda { background: #08111F; color: #fff; padding: 22px 28px; border-bottom: 4px solid #67E8F9; }
          .banda .etiqueta { color: #67E8F9; font-size: 9px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase; }
          .banda h1 { font-size: 20px; margin-top: 3px; }
          .banda .linea { color: #94A3B8; font-size: 10px; margin-top: 5px; }
          main { padding: 24px 28px; }
          .kpis { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
          .kpi { background: #EDF4FF; border-radius: 6px; padding: 10px 14px; min-width: 120px; }
          .kpi .et { font-size: 7.5px; letter-spacing: 1.2px; color: #64748B; font-weight: bold; text-transform: uppercase; }
          .kpi .va { font-size: 16px; font-weight: bold; color: #08111F; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #2563EB; color: #fff; }
          thead th { padding: 7px 9px; font-weight: 800; text-align: left; font-size: 9px; letter-spacing: 0.5px; }
          tbody td { padding: 6px 9px; border-bottom: 1px solid #E2E8F0; }
          tbody tr:nth-child(even) { background: #EDF4FF; }
          .vacio { color: #64748B; font-style: italic; margin-top: 10px; }
          .pie { margin-top: 26px; border-top: 1px solid #CBD5E1; padding-top: 8px; color: #64748B; font-size: 8.5px; text-align: center; }
          .firma { display: flex; justify-content: space-around; margin-top: 42px; font-size: 9px; color: #475569; }
          .firma div { border-top: 1px solid #94A3B8; padding-top: 5px; width: 160px; text-align: center; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="banda">
          <div class="etiqueta">MWT Motorsport · Sistema de gestión deportiva</div>
          <h1>Reporte: ${title}</h1>
          <div class="linea">Generado el ${fechaHora(new Date())} · Rango de análisis: últimos ${rango} días</div>
        </div>
        <main>
          <div class="kpis">
            <div class="kpi"><div class="et">Participantes</div><div class="va">${data?.kpis?.participantes ?? "—"}</div></div>
            <div class="kpi"><div class="et">Eventos</div><div class="va">${data?.kpis?.eventos ?? "—"}</div></div>
            <div class="kpi"><div class="et">Sanciones</div><div class="va">${data?.kpis?.sanciones ?? "—"}</div></div>
            <div class="kpi"><div class="et">Ingresos (Q)</div><div class="va">${(Number(data?.kpis?.ingresos || 0)).toLocaleString("es-GT", { maximumFractionDigits: 0 })}</div></div>
          </div>
          ${tabla}
          <div class="firma"><div>Elaborado por (Administración)</div><div>Validado por (Dirección)</div></div>
          <div class="pie">Documento generado por el Sistema MWT Motorsport · Prototipo académico · ${fechaHora(new Date())}</div>
        </main>
      </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
    setExpPDF(true); setTimeout(() => setExpPDF(false), 2000);
    copiaAviso(`PDF de "${title}" enviado a impresión (Guardar como para descargarlo).`);
  };

  const TITULOS = { inscripciones: "Inscripciones por evento", ingresos: "Ingresos por evento", marcas: "Participación por marca", sanciones: "Sanciones del comisariato", crecimiento: "Crecimiento de participantes" };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      {/* CABECERA */}
      <div className="relative overflow-hidden rounded-[18px] border border-border bg-card p-5 lg:p-6">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600 via-indigo-500 to-cyan-400" />
        <div className="flex items-start justify-between gap-4 flex-wrap pl-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Dirección general · métricas del campeonato</div>
            <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">REPORTES</h1>
            <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
              <CalendarClock size={11} /> {loading ? "Generando métricas..." : `Datos actualizados al ${fechaHora(stamp)}`}
            </p>
            {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
            {aviso ? <p className="text-xs text-emerald-600 mt-2">{aviso}</p> : null}
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={cargar} disabled={loading}><RefreshCw size={13} /> Actualizar</Btn>
            <Btn variant="gradient" onClick={exportarCSV} disabled={!data || expCSV}><Download size={13} /> {expCSV ? "..." : "Exportar CSV"}</Btn>
            <Btn variant="secondary" onClick={exportarExcel} disabled={!data || expExcel}><FileSpreadsheet size={13} /> {expExcel ? "..." : "Exportar Excel"}</Btn>
            <Btn variant="secondary" onClick={exportarPDF} disabled={!data || expPDF}><FileText size={13} /> {expPDF ? "..." : "Imprimir PDF"}</Btn>
          </div>
        </div>
      </div>

      {loading ? <Empty title="Generando reporte..." sub="Consultando el resumen agregado del sistema..." /> : null}

      {!loading && data ? (
        <>
          {/* INDICADORES */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <Kpi icon={<Users size={15} />} label="Participantes" value={data.kpis.participantes} sub="pilotos registrados" accent="blue" />
            <Kpi icon={<Flag size={15} />} label="Eventos" value={data.kpis.eventos} sub={`${data.kpis.proximos} próximos`} accent="violet" />
            <Kpi icon={<Gavel size={15} />} label="Sanciones" value={data.kpis.sanciones} sub="comisariato" accent="amber" />
            <Kpi icon={<Wallet size={15} />} label="Ingresos (Q)" value={`Q${(data.kpis.ingresos || 0).toLocaleString("es-GT", { maximumFractionDigits: 0 })}`} sub="inscripciones cobradas" accent="green" />
            <Kpi icon={<TrendingUp size={15} />} label="Marcas" value={(data.marcas || []).length} sub="fabricantes activos" accent="cyan" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Inscripciones por evento" sub="Total de inscripciones vs. validadas por evento" actions={<Badge variant="blue">comparado</Badge>}>
              {data.inscripciones_por_evento.length === 0 ? (
                <Empty title="Sin eventos" />
              ) : (
                <div className="space-y-3">
                  {data.inscripciones_por_evento.map((e) => {
                    const [bv, bl] = EST_BADGE[e.estado] || EST_BADGE.BORRADOR;
                    const pct = Math.round(((e.validadas || 0) / Math.max(1, e.inscripciones)) * 100);
                    return (
                      <div key={e.evento_id}>
                        <div className="flex justify-between items-baseline mb-1 gap-2">
                          <span className="text-xs font-bold text-foreground truncate">{e.evento}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 inline-flex items-center gap-1"><CalendarClock size={9} /> {fechaHora(e.fecha_inicio).split(",")[0]} · <Badge variant={bv}>{bl}</Badge></span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted relative overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${(e.inscripciones / maxInsc) * 100}%` }} />
                          <div className="absolute inset-y-0 right-0 w-px bg-white/60" style={{ left: `${(e.validadas / maxInsc) * 100}%` }} />
                        </div>
                        <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
                          <span>{e.inscripciones} inscripciones</span>
                          <span>{e.validadas} validadas · {pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Estado de inscripciones" sub="Flujo de la cartera: pendiente → pagada → validada" actions={<Badge variant="indigo">embudo</Badge>}>
              <div className="flex flex-col gap-3">
                {data.estado_inscripciones.map((e) => (
                  <div key={e.estado}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{e.estado}</span>
                      <span className="text-[10px] font-black text-foreground">{e.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${e.estado === "VALIDADA" ? "bg-emerald-500" : e.estado === "PAGADA" ? "bg-blue-500" : e.estado === "RECHAZADA" ? "bg-rose-500" : "bg-amber-400"}`}
                        style={{ width: `${(e.count / maxEst) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Marcas más usadas" sub="Distribución del parque de motocicletas" actions={<Badge variant="violet">parque</Badge>}>
              {data.marcas.length === 0 ? (
                <Empty title="Sin motos registradas" />
              ) : (
                <div className="space-y-3">
                  {data.marcas.slice(0, 6).map((m) => (
                    <div key={m.nombre}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{m.nombre}</span>
                        <span className="text-[10px] font-black text-indigo-500">{m.count} moto(s)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${(m.count / maxMarca) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Crecimiento de participantes" sub="Acumulado mensual de pilotos inscritos" actions={<Badge variant="success">tendencia</Badge>}>
              <div className="flex items-end gap-1 h-28">
                {data.crecimiento.map((c, i) => (
                  <div key={c.mes} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-foreground">{i === data.crecimiento.length - 1 ? c.total : ""}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 transition-colors"
                      style={{ height: `${(c.total / maxCrec) * 100}%`, minHeight: 4 }}
                      title={`${c.mes}: ${c.total} participante(s)`}
                    />
                    <span className="text-[8px] uppercase tracking-wide text-slate-400">{c.mes.slice(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card
            title="Ingresos por evento"
            sub="Pagos confirmados agrupados por fecha; los filtros se combinan para encontrar rápidamente un evento."
            actions={<Badge variant="success"><Wallet size={10} /> {dinero(ingresosConfirmados)} confirmados</Badge>}
          >
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-4">
              <input
                className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-blue-400/60"
                placeholder="Buscar evento..."
                value={ingresoFiltro.query}
                onChange={(e) => actualizarIngresoFiltro({ query: e.target.value })}
              />
              <select className={selectCls} value={ingresoFiltro.campeonato} onChange={(e) => actualizarIngresoFiltro({ campeonato: e.target.value })}>
                <option value="">Todos los campeonatos</option>
                {campeonatosIngresos.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
              </select>
              <select className={selectCls} value={ingresoFiltro.estado} onChange={(e) => actualizarIngresoFiltro({ estado: e.target.value })}>
                <option value="">Todos los estados</option>
                {Object.entries(EST_BADGE).map(([id, [, label]]) => <option key={id} value={id}>{label}</option>)}
              </select>
              <input type="date" className={selectCls} aria-label="Fecha desde" value={ingresoFiltro.desde} onChange={(e) => actualizarIngresoFiltro({ desde: e.target.value })} />
              <input type="date" className={selectCls} aria-label="Fecha hasta" value={ingresoFiltro.hasta} onChange={(e) => actualizarIngresoFiltro({ hasta: e.target.value })} />
              <select className={selectCls} value={ingresoFiltro.orden} onChange={(e) => actualizarIngresoFiltro({ orden: e.target.value })}>
                <option value="fecha_desc">Más recientes</option>
                <option value="ingreso_desc">Mayor ingreso</option>
                <option value="ingreso_asc">Menor ingreso</option>
                <option value="evento_asc">Evento A-Z</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="rounded-[10px] bg-emerald-500/10 p-3"><div className="text-[9px] uppercase tracking-widest text-slate-500">Filtrado</div><div className="text-lg font-black text-emerald-600">{dinero(ingresosFiltradosTotal)}</div></div>
              <div className="rounded-[10px] bg-blue-500/10 p-3"><div className="text-[9px] uppercase tracking-widest text-slate-500">Eventos</div><div className="text-lg font-black text-blue-600">{ingresosFiltrados.length}</div></div>
              <div className="rounded-[10px] bg-violet-500/10 p-3"><div className="text-[9px] uppercase tracking-widest text-slate-500">Inscripciones pagadas</div><div className="text-lg font-black text-violet-600">{ingresosFiltrados.reduce((sum, e) => sum + (e.inscripciones_pagadas || 0), 0)}</div></div>
              <div className="rounded-[10px] bg-amber-500/10 p-3"><div className="text-[9px] uppercase tracking-widest text-slate-500">Pendientes</div><div className="text-lg font-black text-amber-600">{ingresosFiltrados.reduce((sum, e) => sum + (e.pagos_pendientes || 0), 0)}</div></div>
            </div>

            {ingresosVisibles.length === 0 ? (
              <Empty title="Sin ingresos para los filtros seleccionados" sub="Prueba con otro campeonato, estado o rango de fechas." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-border">
                        <th className="text-left py-2 pr-3">Evento</th>
                        <th className="text-left py-2 pr-3">Campeonato</th>
                        <th className="text-left py-2 pr-3">Fecha</th>
                        <th className="text-right py-2 pr-3">Pagadas</th>
                        <th className="text-right py-2 pr-3">Pendientes</th>
                        <th className="text-right py-2 pr-3">Ingreso</th>
                        <th className="text-right py-2">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingresosVisibles.map((e, i) => {
                        const [variant, label] = EST_BADGE[e.estado] || EST_BADGE.BORRADOR;
                        return (
                          <tr key={e.evento_id} className={i % 2 === 0 ? "bg-card" : "bg-[#EDF4FF]/60"}>
                            <td className="py-2 pr-3 font-bold text-foreground">
                              <button
                                type="button"
                                className="text-left text-blue-600 hover:text-blue-800 hover:underline disabled:text-slate-400 disabled:no-underline"
                                disabled={!e.ingresos}
                                onClick={() => { setIngresoDetalle(e); setDetallePagina(1); }}
                                title={e.ingresos ? "Ver desglose de ingresos" : "Este evento no tiene ingresos"}
                              >
                                {e.evento}
                              </button>
                              <div className="mt-0.5"><Badge variant={variant}>{label}</Badge></div>
                            </td>
                            <td className="py-2 pr-3 text-slate-500">{e.campeonato}</td>
                            <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{fechaHora(e.fecha_inicio).split(",")[0]}</td>
                            <td className="py-2 pr-3 text-right text-violet-600 font-bold">{e.inscripciones_pagadas}</td>
                            <td className="py-2 pr-3 text-right text-amber-600">{e.pagos_pendientes}</td>
                            <td className="py-2 pr-3 text-right text-emerald-600 font-black">{dinero(e.ingresos)}</td>
                            <td className="py-2 text-right text-slate-500">{dinero(e.ticket_promedio)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {ingresosTotalPaginas > 1 ? (
                  <div className="flex items-center justify-between gap-3 mt-4 text-[10px] text-slate-500">
                    <span>Mostrando {(ingresosPaginaActual - 1) * ingresosPorPagina + 1}–{Math.min(ingresosPaginaActual * ingresosPorPagina, ingresosFiltrados.length)} de {ingresosFiltrados.length}</span>
                    <div className="flex items-center gap-1">
                      <Btn variant="secondary" sm disabled={ingresosPaginaActual === 1} onClick={() => setIngresoPagina((p) => Math.max(1, p - 1))}>Anterior</Btn>
                      <span className="px-2 font-bold">Página {ingresosPaginaActual} de {ingresosTotalPaginas}</span>
                      <Btn variant="secondary" sm disabled={ingresosPaginaActual === ingresosTotalPaginas} onClick={() => setIngresoPagina((p) => Math.min(ingresosTotalPaginas, p + 1))}>Siguiente</Btn>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Card>

          <Modal
            open={Boolean(ingresoDetalle)}
            onClose={() => setIngresoDetalle(null)}
            title={ingresoDetalle ? `Desglose de ingresos · ${ingresoDetalle.evento}` : "Desglose de ingresos"}
            sub={ingresoDetalle ? `${ingresoDetalle.campeonato} · ${ingresoDetalle.inscripciones_pagadas} inscripción(es) pagada(s) · ${dinero(ingresoDetalle.ingresos)}` : ""}
            size="xl"
          >
            {!ingresoDetalle?.ingresos_detalle?.length ? (
              <Empty title="Sin detalle de ingresos" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-border">
                        <th className="text-left py-2 pr-3">Piloto</th>
                        <th className="text-left py-2 pr-3">Correo</th>
                        <th className="text-left py-2 pr-3">Categoría</th>
                        <th className="text-left py-2 pr-3">Estado</th>
                        <th className="text-left py-2 pr-3">Método</th>
                        <th className="text-left py-2 pr-3">Registro</th>
                        <th className="text-right py-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesVisibles.map((detalle, index) => (
                        <tr key={detalle.inscripcion_id} className={index % 2 === 0 ? "bg-card" : "bg-[#EDF4FF]/60"}>
                          <td className="py-2 pr-3 font-bold text-foreground">{detalle.piloto}</td>
                          <td className="py-2 pr-3 text-slate-500">{detalle.email}</td>
                          <td className="py-2 pr-3 text-slate-500">{detalle.categoria}</td>
                          <td className="py-2 pr-3"><Badge variant={detalle.estado === "VALIDADA" ? "success" : "blue"}>{detalle.estado}</Badge></td>
                          <td className="py-2 pr-3 text-slate-500">{detalle.metodo_pago}</td>
                          <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{fechaHora(detalle.fecha_registro)}</td>
                          <td className="py-2 text-right font-black text-emerald-600">{dinero(detalle.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {detalleTotalPaginas > 1 ? (
                  <div className="flex items-center justify-between gap-3 mt-4 text-[10px] text-slate-500">
                    <span>Mostrando {(detallePaginaActual - 1) * detallesPorPagina + 1}–{Math.min(detallePaginaActual * detallesPorPagina, ingresoDetalle.ingresos_detalle.length)} de {ingresoDetalle.ingresos_detalle.length}</span>
                    <div className="flex items-center gap-1">
                      <Btn variant="secondary" sm disabled={detallePaginaActual === 1} onClick={() => setDetallePagina((page) => Math.max(1, page - 1))}>Anterior</Btn>
                      <span className="px-2 font-bold">Página {detallePaginaActual} de {detalleTotalPaginas}</span>
                      <Btn variant="secondary" sm disabled={detallePaginaActual === detalleTotalPaginas} onClick={() => setDetallePagina((page) => Math.min(detalleTotalPaginas, page + 1))}>Siguiente</Btn>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Modal>

          {/* SANCIONES RECIENTES (tabla profesional siempre visible) */}
          <Card
            title="Sanciones del comisariato"
            sub={`Últimos ${rango} días · ${sancionesRango.length} registro(s) · con fecha y hora`}
            actions={<Badge variant="amber"><CalendarClock size={9} className="inline-block -mt-px" /> detalle en tiempo</Badge>}
          >
            {sancionesRango.length === 0 ? (
              <Empty title="Sin sanciones en el rango" sub="Ajusta el rango de análisis o registra infracciones en el comisariato." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-border">
                      <th className="text-left py-2 pr-3">Fecha y hora</th>
                      <th className="text-left py-2 pr-3">Piloto</th>
                      <th className="text-left py-2 pr-3">Evento</th>
                      <th className="text-left py-2 pr-3">Tipo</th>
                      <th className="text-left py-2 pr-3">Penalización</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sancionesRango.slice(0, 12).map((s, i) => {
                      const [bv, bl] = EST_SAN[s.gravedad] || EST_SAN.PENDIENTE;
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-[#EDF4FF]/60"}>
                          <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{fechaHora(s.fecha)}</td>
                          <td className="py-2 pr-3 font-bold text-foreground">{s.piloto}</td>
                          <td className="py-2 pr-3 text-slate-500">{s.evento}</td>
                          <td className="py-2 pr-3 text-slate-500">{s.tipo}</td>
                          <td className="py-2 pr-3 text-slate-500">{s.penalizacion || "—"}</td>
                          <td className="py-2"><Badge variant={bv}>{bl}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sancionesRango.length > 12 ? (
                  <p className="text-[10px] text-slate-400 mt-2">Mostrando 12 de {sancionesRango.length}: usa el CSV para la lista completa.</p>
                ) : null}
              </div>
            )}
          </Card>

          {/* GENERADOR */}
          <Card title="Generador de reportes" sub="Elige el tipo y el rango: la cabecera, los KPIs y las exportaciones usan esta configuración" actions={<Badge variant="indigo">CSV · PDF</Badge>}>
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <Field label="Tipo de reporte">
                <select className={selectCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="inscripciones">Inscripciones por evento</option>
                  <option value="ingresos">Ingresos por evento</option>
                  <option value="marcas">Participación por marca</option>
                  <option value="sanciones">Sanciones del comisariato</option>
                  <option value="crecimiento">Crecimiento de participantes</option>
                </select>
              </Field>
              <Field label="Rango de análisis" hint="Filtra la tabla de sanciones y los reportes exportados.">
                <select className={selectCls} value={rango} onChange={(e) => setRango(e.target.value)}>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Último año</option>
                </select>
              </Field>
              <div className="flex gap-2">
                <Btn variant="gradient" onClick={exportarCSV} disabled={!data || expCSV} title="Descarga CSV compatible con Excel (UTF-8 con BOM)">
                  <Download size={13} /> {expCSV ? "Exportado" : "CSV"}
                </Btn>
                <Btn variant="secondary" onClick={exportarExcel} disabled={!data || expExcel} title="Descarga un libro Excel (.xlsx) con los datos filtrados">
                  <FileSpreadsheet size={13} /> {expExcel ? "Exportado" : "Excel"}
                </Btn>
                <Btn variant="secondary" onClick={exportarPDF} disabled={!data || expPDF} title="Vista de impresión con banda MWT, KPIs y firmas">
                  <FileText size={13} /> {expPDF ? "Enviado" : "Imprimir PDF"}
                </Btn>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              Título del reporte activo: <strong className="text-slate-500">{TITULOS[tipo]}</strong> · El CSV se descarga con separador coma, UTF-8 y BOM (apertura directa en Excel).
            </p>
          </Card>
        </>
      ) : null}
    </main>
  );
}
