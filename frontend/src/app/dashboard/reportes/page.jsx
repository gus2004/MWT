"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, Download, FileText, TrendingUp, Wallet, Users, Flag } from "lucide-react";
import { Badge, Btn, Card, Empty, Kpi, Field, selectCls } from "@/components/kit";
import { soporteApi } from "@/lib/soporteApi";

const EST_BADGE = {
  BORRADOR: ["slate", "Borrador"],
  ABIERTO: ["success", "Abierto"],
  EN_CURSO: ["blue", "En curso"],
  FINALIZADO: ["warning", "Finalizado"],
  CANCELADO: ["error", "Cancelado"],
};

export default function ReportesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("inscripciones");
  const [rango, setRango] = useState("90");
  const [exportado, setExportado] = useState(false);

  useEffect(() => {
    soporteApi.getResumenReportes().then(setData).catch((e) => setError(e?.message || "No se pudo generar el reporte.")).finally(() => setLoading(false));
  }, []);

  const maxInsc = useMemo(() => Math.max(1, ...(data?.inscripciones_por_evento || []).map((e) => e.inscripciones || 0)), [data]);
  const maxMarca = useMemo(() => Math.max(1, ...(data?.marcas || []).map((m) => m.count || 0)), [data]);
  const maxCrec = useMemo(() => Math.max(1, ...(data?.crecimiento || []).map((c) => c.total || 0)), [data]);
  const maxEst = useMemo(() => Math.max(1, ...(data?.estado_inscripciones || []).map((e) => e.count || 0)), [data]);

  const exportarCSV = () => {
    let rows = [];
    if (tipo === "inscripciones") {
      rows = [
        ["Evento", "Fecha", "Estado", "Inscripciones", "Validadas"],
        ...(data?.inscripciones_por_evento || []).map((e) => [e.evento, new Date(e.fecha_inicio).toLocaleDateString("es-GT"), e.estado, e.inscripciones || 0, e.validadas || 0]),
      ];
    } else if (tipo === "marcas") {
      rows = [
        ["Marca", "Motos"],
        ...(data?.marcas || []).map((m) => [m.nombre, m.count]),
      ];
    } else if (tipo === "sanciones") {
      rows = [
        ["Fecha", "Piloto", "Evento", "Tipo", "Penalización", "Estado"],
        ...(data?.sanciones_recientes || []).map((s) => [new Date(s.fecha).toLocaleDateString("es-GT"), s.piloto, s.evento, s.tipo, s.penalizacion || "—", s.gravedad]),
      ];
    } else {
      rows = [
        ["Mes", "Participantes acumulados"],
        ...(data?.crecimiento || []).map((c) => [c.mes, c.total]),
      ];
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${tipo}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportado(true);
    setTimeout(() => setExportado(false), 2500);
  };

  const exportarPDF = () => {
    let head = [];
    let rows = [];
    let title = "";

    if (tipo === "inscripciones") {
      title = "Inscripciones por evento";
      head = ["Evento", "Fecha", "Estado", "Inscripciones", "Validadas"];
      rows = (data?.inscripciones_por_evento || []).map((e) => [e.evento, new Date(e.fecha_inicio).toLocaleDateString("es-GT"), e.estado, e.inscripciones || 0, e.validadas || 0]);
    } else if (tipo === "marcas") {
      title = "Participación por marca";
      head = ["Marca", "Motos"];
      rows = (data?.marcas || []).map((m) => [m.nombre, m.count]);
    } else if (tipo === "sanciones") {
      title = "Sanciones recientes";
      head = ["Fecha", "Piloto", "Evento", "Tipo", "Penalización", "Estado"];
      rows = (data?.sanciones_recientes || []).map((s) => [new Date(s.fecha).toLocaleDateString("es-GT"), s.piloto, s.evento, s.tipo, s.penalizacion || "—", s.gravedad]);
    } else {
      title = "Crecimiento de participantes";
      head = ["Mes", "Participantes acumulados"];
      rows = (data?.crecimiento || []).map((c) => [c.mes, c.total]);
    }

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
        <title>Reporte - ${title}</title>
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
        <h1>Reporte: ${title}</h1>
        <div class="sub">Generado el ${new Date().toLocaleDateString("es-GT")} · Últimos ${rango} días</div>
        ${tabla}
      </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
    }, 400);
  };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Métricas del campeonato</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">REPORTES</h1>
          <p className="text-xs text-slate-500 mt-1">{loading ? "Generando métricas..." : `Datos actualizados al ${new Date().toLocaleDateString("es-GT")}`}</p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
        </div>
      </div>

      {loading ? <Empty title="Generando reporte..." sub="Consultando el resumen agregado del sistema..." /> : null}

      {!loading && data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi icon={<Users size={15} />} label="Participantes" value={data.kpis.participantes} accent="blue" />
            <Kpi icon={<Flag size={15} />} label="Eventos" value={data.kpis.eventos} accent="violet" />
            <Kpi icon={<BarChart2 size={15} />} label="Próximos" value={data.kpis.proximos} accent="cyan" />
            <Kpi icon={<TrendingUp size={15} />} label="Sanciones" value={data.kpis.sanciones} accent="amber" />
            <Kpi icon={<Wallet size={15} />} label="Ingresos (Q)" value={`Q${(data.kpis.ingresos || 0).toLocaleString("es-GT", { maximumFractionDigits: 0 })}`} accent="green" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Inscripciones por evento" actions={<Badge variant="blue">Inscripciones · validadas</Badge>}>
              {data.inscripciones_por_evento.length === 0 ? (
                <Empty title="Sin eventos" />
              ) : (
                <div className="space-y-3">
                  {data.inscripciones_por_evento.map((e) => {
                    const [bv, bl] = EST_BADGE[e.estado] || EST_BADGE.BORRADOR;
                    return (
                      <div key={e.evento_id}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-bold text-foreground truncate">{e.evento}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{new Date(e.fecha_inicio).toLocaleDateString("es-GT")} · <Badge variant={bv}>{bl}</Badge></span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted relative overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${(e.inscripciones / maxInsc) * 100}%` }} />
                          <div className="absolute inset-y-0 right-0 w-px bg-white/60" style={{ left: `${(e.validadas / maxInsc) * 100}%` }} />
                        </div>
                        <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
                          <span>{e.inscripciones} inscripciones</span>
                          <span>{e.validadas} validadas</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Estado de inscripciones">
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

            <Card title="Marcas más usadas">
              {data.marcas.length === 0 ? (
                <Empty title="Sin motos registradas" />
              ) : (
                <div className="space-y-3">
                  {data.marcas.slice(0, 6).map((m) => (
                    <div key={m.nombre}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{m.nombre}</span>
                        <span className="text-[10px] font-black text-indigo-500">{m.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${(m.count / maxMarca) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Crecimiento de participantes" actions={<Badge variant="success">acumulado</Badge>}>
              <div className="flex items-end gap-1 h-28">
                {data.crecimiento.map((c, i) => (
                  <div key={c.mes} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-foreground">{i === data.crecimiento.length - 1 ? c.total : ""}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                      style={{ height: `${(c.total / maxCrec) * 100}%`, minHeight: 4 }}
                      title={`${c.mes}: ${c.total}`}
                    />
                    <span className="text-[8px] uppercase tracking-wide text-slate-400">{c.mes.slice(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Generador de reporte" actions={<Badge variant="indigo">CSV · PDF</Badge>}>
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <Field label="Tipo de reporte">
                <select className={selectCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="inscripciones">Inscripciones por evento</option>
                  <option value="marcas">Participación por marca</option>
                  <option value="sanciones">Sanciones recientes</option>
                  <option value="crecimiento">Crecimiento de participantes</option>
                </select>
              </Field>
              <Field label="Rango">
                <select className={selectCls} value={rango} onChange={(e) => setRango(e.target.value)}>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Último año</option>
                </select>
              </Field>
              <div className="flex gap-2">
                <Btn variant="gradient" onClick={exportarCSV} disabled={!data}>
                  <Download size={13} /> {exportado ? "Exportado" : "CSV"}
                </Btn>
                <Btn variant="secondary" onClick={exportarPDF} disabled={!data}>
                  <FileText size={13} /> PDF
                </Btn>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">El archivo se descarga en formato CSV compatible con Excel (separador coma, UTF-8), o como PDF listo para imprimir.</p>
          </Card>
        </>
      ) : null}
    </main>
  );
}
