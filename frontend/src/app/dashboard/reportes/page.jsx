"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, CalendarClock, Download, FileSpreadsheet, FileText, Gavel, TrendingUp, Users, Flag, Wallet, Shield, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, Empty, Kpi, Field, selectCls } from "@/components/kit";
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
  const [aviso, setAviso] = useState("");
  const [stamp, setStamp] = useState(null);

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

  const TITULOS = { inscripciones: "Inscripciones por evento", marcas: "Participación por marca", sanciones: "Sanciones del comisariato", crecimiento: "Crecimiento de participantes" };

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
            <Btn variant="gradient" onClick={exportarCSV} disabled={!data || expCSV}><FileSpreadsheet size={13} /> {expCSV ? "..." : "Exportar CSV"}</Btn>
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
