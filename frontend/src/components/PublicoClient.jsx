"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Shield, ChevronLeft } from "lucide-react";
import { Kpi, Card, Empty, Table, Tabs, Badge } from "@/components/kit";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PublicoClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("clasificacion");

  useEffect(() => {
    fetch(`${API_URL}/api/public/stats`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e?.message || "No se pudieron cargar los datos públicos."));
  }, []);

  const resumen = data?.resumen || null;
  const pilotos = useMemo(() => (Array.isArray(data?.pilotos) ? data.pilotos : []), [data]);
  const clasificaciones = useMemo(
    () => (Array.isArray(data?.clasificaciones) ? data.clasificaciones : []),
    [data]
  );
  const resultados = useMemo(() => (Array.isArray(data?.resultados) ? data.resultados : []), [data]);
  const categorias = useMemo(() => (Array.isArray(data?.categorias) ? data.categorias : []), [data]);

  const porCategoria = useMemo(() => {
    const map = {};
    clasificaciones.forEach((c) => {
      if (!map[c.categoria]) map[c.categoria] = [];
      map[c.categoria].push(c);
    });
    return map;
  }, [clasificaciones]);

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header público */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 3L22 21H2Z" opacity=".4" /><path d="M12 8L19 20H5Z" /></svg>
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-900 leading-none">MWT · Estadísticas</div>
              <div className="text-[8px] font-black uppercase tracking-[0.22em] text-blue-600 mt-0.5">Consulta pública del campeonato</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="px-4 py-2 rounded-[10px] border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-[0.08em] hover:border-blue-300 hover:text-blue-600 transition-colors">
              <span className="inline-flex items-center gap-1"><ChevronLeft size={12} /> Volver</span>
            </Link>
            <Link href="/login" className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-[0.08em] hover:from-blue-500 hover:to-indigo-500 transition-colors">
              Ingresar como personal
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
        <div className="rounded-[16px] border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
          <Shield size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Vista pública general del campeonato · sin sesión ni registro. Los datos clasificados (licencias, pagos, antecedentes)
            solo son visibles para el personal autorizado.
          </p>
        </div>

        {error ? <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-[10px] px-3 py-2">{error}</p> : null}

        {/* Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Pilotos registrados" value={resumen ? String(resumen.pilotos ?? 0) : "..."} sub={`${categorias.length} categorías activas`} accent="blue" />
          <Kpi label="Eventos del campeonato" value={resumen ? String(resumen.eventos ?? 0) : "..."} sub={`${resumen?.eventos_proximos ?? 0} abiertos/envivo`} accent="violet" />
          <Kpi label="Participación" value={resumen ? Object.values(data?.participantes_por_categoria || {}).reduce((a, b) => a + b, 0) : "..."} sub="Inscripciones válidas" accent="green" />
          <Kpi label="Resultados publicados" value={String(resultados.length)} sub="Heats con tiempos" accent="amber" />
        </div>

        <Tabs
          tabs={[
            { key: "clasificacion", label: "Clasificación general" },
            { key: "resultados", label: "Resultados por evento" },
            { key: "pilotos", label: "Pilotos" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "clasificacion" ? (
          Object.keys(porCategoria).length === 0 ? (
            <Empty title="Sin clasificación publicada" sub="Cuando se publiquen clasificaciones del campeonato aparecerán aquí." />
          ) : (
            <div className="space-y-4">
              {Object.entries(porCategoria).map(([cat, rows]) => (
                <Card key={cat} title={cat} sub="Campeonato nacional · Temporada 2026" actions={<Badge variant="blue">{rows.length} pilotos</Badge>}>
                  <Table head={["Pos", "#", "Piloto", "Puntos"]}>
                    {[...rows].sort((a, b) => (a.posicion || 999) - (b.posicion || 999) || (b.puntos || 0) - (a.puntos || 0)).map((r, i) => (
                      <tr key={`${r.piloto}-${i}`} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-[8px] text-xs font-black ${i === 0 ? "bg-amber-500/15 text-amber-600 border border-amber-500/25" : i === 1 ? "bg-slate-400/15 text-slate-500 border border-slate-400/25" : i === 2 ? "bg-orange-700/15 text-orange-700 border border-orange-700/25" : "bg-slate-100 text-slate-500"}`}>
                            {r.posicion || i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3"><span className="text-sm font-black text-blue-600">#{r.dorsal ?? "—"}</span></td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.piloto}</td>
                        <td className="px-4 py-3 text-xs font-black text-slate-900">{r.puntos}</td>
                      </tr>
                    ))}
                  </Table>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {tab === "resultados" ? (
          resultados.length === 0 ? (
            <Empty title="Sin resultados publicados" sub="Los tiempos y posiciones por heat aparecerán aquí cuando se publiquen." />
          ) : (
            <div className="space-y-4">
              {resultados.map((h, idx) => (
                <Card key={`${h.heat}-${idx}`} title={`${h.heat} · ${h.categoria}`} sub="Resultados oficiales por heat" actions={<Badge variant="success">{h.resultados.length} pilotos</Badge>}>
                  <Table head={["Pos", "#", "Piloto", "Vuelta 1", "Vuelta 2", "Mejor", "Puntos"]}>
                    {h.resultados.map((r, i) => (
                      <tr key={`${r.piloto}-${i}`} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1 rounded-[7px] text-xs font-black ${i === 0 ? "bg-amber-500/15 text-amber-600 border border-amber-500/25" : "bg-slate-100 text-slate-500"}`}>
                            {r.posicion > 0 ? r.posicion : i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3"><span className="text-sm font-black text-blue-600">#{r.dorsal ?? "—"}</span></td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.piloto}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.vuelta_1 ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.vuelta_2 ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">{r.mejor_vuelta ?? "—"}</td>
                        <td className="px-4 py-3 text-xs font-black text-slate-900">{r.puntos}</td>
                      </tr>
                    ))}
                  </Table>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {tab === "pilotos" ? (
          pilotos.length === 0 ? (
            <Empty title="Sin pilotos registrados" sub="La lista de pilotos del campeonato aparecerá aquí." />
          ) : (
            <Card title={`Pilotos registrados (${pilotos.length})`} sub="Listado público de participantes">
              <Table head={["#", "Piloto"]}>
                {pilotos.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3"><span className="text-sm font-black text-blue-600">#{p.dorsal ?? "—"}</span></td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{p.nombre}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          )
        ) : null}

        <div className="flex items-center gap-3 flex-wrap pt-2 pb-4">
          <Trophy size={14} className="text-amber-500" />
          <span className="text-[11px] text-slate-500">Campeonato de motociclismo de Guatemala · MWT Motorsport · ACMG · FMG</span>
        </div>
      </main>
    </div>
  );
}
