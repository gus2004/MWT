"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Flag, Timer, Trophy, X } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, Tabs, inputCls } from "@/components/kit";
import { listEventos } from "@/lib/adminApi";
import { getCurrentUser } from "@/lib/soporteApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders() {
  return {
    Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}`,
  };
}

function parseMs(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!m) return null;
  return Number(m[1]) * 60000 + Number(m[2]) * 1000 + Number((m[3] || "0").padEnd(3, "0"));
}

function fmtMs(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const min = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const m = Math.floor(ms % 1000);
  return `${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(m).padStart(3, "0")}`;
}

const ESQUEMA = [25, 20, 16, 13, 11, 10, 8, 6, 4, 2, 1];

export default function CompetenciaPage() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [tab, setTab] = useState("parrilla");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [parrilla, setParrilla] = useState([]);
  const [m1, setM1] = useState([]);
  const [m2, setM2] = useState([]);
  const [res1, setRes1] = useState([]);
  const [res2, setRes2] = useState([]);
  const [tiempos, setTiempos] = useState({});
  const [saving, setSaving] = useState(false);
  const [reclamo, setReclamo] = useState(null);
  const [mangaEnVivo, setMangaEnVivo] = useState(null);
  const usuario = getCurrentUser();

  const loadEventos = useCallback(async () => {
    try {
      const items = await listEventos();
      setEventos(Array.isArray(items) ? items : []);
    } catch {
      setEventos([]);
    }
  }, []);

  useEffect(() => { loadEventos(); }, [loadEventos]);

  const loadGrupos = async (evId) => {
    try {
      const res = await fetch(`${API_URL}/api/eventos/${evId}/panel/grupos`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const gs = Array.isArray(data.items) ? data.items : [];
      setGrupos(gs);
      if (gs.length > 0) {
        setGrupoId(gs[0].id);
        setCategorias(gs[0].categorias || []);
        setCategoriaId(gs[0].categorias?.[0]?.id || "");
      }
    } catch (err) {
      setError("No se pudieron cargar los grupos del evento.");
      setGrupos([]);
    }
  };

  useEffect(() => {
    if (!eventoId) return;
    loadGrupos(eventoId);
  }, [eventoId]);

  const loadParrilla = async (gId) => {
    if (!gId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/clasificaciones/grupo/${gId}/parrilla`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      const data = await res.json();
      setParrilla(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err?.message || "No se pudo obtener la parrilla.");
    } finally {
      setLoading(false);
    }
  };

  const loadHeat = async (gId, num) => {
    try {
      const res = await fetch(`${API_URL}/api/resultados/grupo/${gId}/heat/${num}`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  };

  const loadPilotosHeat = async (gId, num) => {
    try {
      const res = await fetch(`${API_URL}/api/resultados/grupo/${gId}/pilotos?heat=${num}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  };

  const cargarTodo = useCallback(async (gId) => {
    await loadParrilla(gId);
    const [r1, r2] = await Promise.all([loadHeat(gId, 1), loadHeat(gId, 2)]);
    setRes1(r1);
    setRes2(r2);
    const p1 = r1.length > 0 ? r1.map((r, i) => ({ inscripcion_id: r.inscripcion_id, nombre: r.piloto || r.nombre || "—", dorsal: r.dorsal, posicion: r.posicion ?? i + 1 })) : await loadPilotosHeat(gId, 1);
    setM1(p1);
    const p2 = r2.length > 0 ? r2.map((r, i) => ({ inscripcion_id: r.inscripcion_id, nombre: r.piloto || r.nombre || "—", dorsal: r.dorsal, posicion: r.posicion ?? i + 1 })) : await loadPilotosHeat(gId, 2);
    setM2(p2);
  }, [grupoId]);

  useEffect(() => {
    if (!grupoId) return;
    setCategorias(grupos.find((g) => g.id === grupoId)?.categorias || []);
    cargarTodo(grupoId);
  }, [grupoId, cargarTodo, grupos]);

  const ordenar = (arr) => [...arr].sort((a, b) => {
    const ta = parseMs(a.mejor_tiempo || a.mejor_vuelta);
    const tb = parseMs(b.mejor_tiempo || b.mejor_vuelta);
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb;
  });

  const guardarTiempo = async (inscripcion_id, vuelta_1, vuelta_2) => {
    if (!grupoId || !inscripcion_id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/clasificaciones/grupo/${grupoId}/tiempo`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ inscripcion_id, vuelta_1: vuelta_1 || null, vuelta_2: vuelta_2 || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      await loadParrilla(grupoId);
      setNotice(`Tiempo guardado para la vuelta de ${inscripcion_id.slice(0, 8)}…`);
    } catch (err) {
      setError(err?.message || "No se pudo guardar el tiempo.");
    } finally {
      setSaving(false);
    }
  };

  const completarClasificacion = async () => {
    if (!grupoId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/clasificaciones/grupo/${grupoId}/completar`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      setNotice("Clasificación completada. La parrilla de la Manga 1 quedó fijada.");
      await cargarTodo(grupoId);
    } catch (err) {
      setError(err?.message || "No se pudo completar la clasificación.");
    } finally {
      setSaving(false);
    }
  };

  const guardarHeat = async (num, filas) => {
    if (!grupoId) return;
    setSaving(true);
    setError("");
    try {
      const resultados = filas.map((f, i) => ({
        inscripcion_id: f.inscripcion_id,
        posicion: i + 1,
        vueltas_completadas: f.vueltas || undefined,
        tiempo_total: f.tiempo_total || undefined,
        estatus_carrera: "FIN",
      }));
      const res = await fetch(`${API_URL}/api/resultados/grupo/${grupoId}/heat/${num}`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario?.id || "", resultados }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      setNotice(`Manga ${num} guardada. Puntos acumulados en la clasificación general.`);
      await cargarTodo(grupoId);
      setTab(num === 1 ? "manga2" : "resultados");
    } catch (err) {
      setError(err?.message || "No se pudieron guardar los resultados.");
    } finally {
      setSaving(false);
    }
  };

  const mover = (setFn, list, i, dir) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    next.forEach((r, idx) => (r.posicion = idx + 1));
    setFn(next);
  };

  const quitar = (setFn, list, i) => {
    const next = list.filter((_, idx) => idx !== i);
    next.forEach((r, idx) => (r.posicion = idx + 1));
    setFn(next);
  };

  const guardarReclamo = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const res = await fetch(`${API_URL}/api/soporte/notificaciones`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: `Reclamación · dorsal ${f.get("reclamante")}`,
          mensaje: `Reclamación del dorsal ${f.get("reclamante")} contra el dorsal ${f.get("contra")}: ${f.get("motivo")}`,
          tipo: "sancion",
        }),
      });
      if (!res.ok) throw new Error();
      setNotice("Reclamación registrada y notificada al comisariato.");
      setReclamo(null);
    } catch {
      setError("No se pudo registrar la reclamación.");
    }
  };

  const ordenParrilla = useMemo(() => ordenar(parrilla), [parrilla]);
  const puntos = (pos) => ESQUEMA[pos - 1] || 0;

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Operación de carrera</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">COMPETENCIA</h1>
          <p className="text-xs text-slate-500 mt-1">Cada categoría compite 2 mangas y clasifica 1 vez (qualy). La Manga 2 sale de las posiciones de la Manga 1.</p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
          {notice ? <p className="text-xs text-emerald-600 mt-2">{notice}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${mangaEnVivo ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
            {mangaEnVivo ? `EN VIVO · M${mangaEnVivo}` : "Conectado · Sincronizado"}
          </span>
        </div>
      </div>

      {/* Selectores */}
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Evento">
          <select className={inputCls} value={eventoId} onChange={(e) => { setEventoId(e.target.value); setGrupoId(""); }}>
            <option value="">Seleccionar evento</option>
            {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </Field>
        <Field label="Grupo de categorías">
          <select className={inputCls} value={grupoId} onChange={(e) => setGrupoId(e.target.value)} disabled={!eventoId}>
            <option value="">{eventoId ? (grupos.length ? "Seleccionar grupo" : "Sin grupos") : "Primero selecciona evento"}</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}{g.tiene_clasificacion ? " · con qualy" : ""}</option>)}
          </select>
        </Field>
        <Field label="Categoría">
          <select className={inputCls} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} disabled={!grupoId}>
            <option value="">{grupoId ? "Seleccionar categoría" : "Primero selecciona grupo"}</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.inscritos ?? 0} inscritos)</option>)}
          </select>
        </Field>
      </div>

      <Tabs
        tabs={[
          { key: "parrilla", label: "Qualy · Parrilla M1" },
          { key: "manga1", label: "Manga 1 · Crono" },
          { key: "manga2", label: "Manga 2" },
          { key: "resultados", label: "Resultados" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── QUALY / PARRILLA ── */}
      {tab === "parrilla" ? (
        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          <Card title="Ingreso de tiempos de qualy" sub="Formato MM:SS.mmm · el sistema toma el mejor de los dos.">
            {loading ? <Empty title="Cargando..." /> : parrilla.length === 0 ? (
              <Empty title="Sin pilotos en parrilla" sub="Cargá tiempos para los inscritos del grupo." />
            ) : (
              <div className="space-y-2">
                {parrilla.map((p) => (
                  <div key={p.inscripcion_id || p.id} className="flex items-center gap-3 rounded-[12px] border border-border p-2.5">
                    <span className="w-8 h-8 rounded-[10px] bg-muted text-foreground text-xs font-black flex items-center justify-center shrink-0">
                      {p.posicion ?? "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{p.piloto_nombre || p.nombre || "—"}</div>
                      <div className="text-[10px] text-slate-400">Dorsal {p.dorsal_asignado || p.dorsal || "—"}</div>
                    </div>
                    <input
                      className={`${inputCls} !w-28 text-center font-mono`}
                      placeholder="V1 00:00.000"
                      value={tiempos[p.inscripcion_id || p.id]?.v1 ?? p.vuelta_1 ?? ""}
                      onChange={(e) => setTiempos((t) => ({ ...t, [p.inscripcion_id || p.id]: { ...t[p.inscripcion_id || p.id], v1: e.target.value } }))}
                    />
                    <input
                      className={`${inputCls} !w-28 text-center font-mono`}
                      placeholder="V2 00:00.000"
                      value={tiempos[p.inscripcion_id || p.id]?.v2 ?? p.vuelta_2 ?? ""}
                      onChange={(e) => setTiempos((t) => ({ ...t, [p.inscripcion_id || p.id]: { ...t[p.inscripcion_id || p.id], v2: e.target.value } }))}
                    />
                    <Btn sm variant="secondary" disabled={saving} onClick={() => guardarTiempo(p.inscripcion_id || p.id, tiempos[p.inscripcion_id || p.id]?.v1 ?? p.vuelta_1 ?? "", tiempos[p.inscripcion_id || p.id]?.v2 ?? p.vuelta_2 ?? "")}>
                      Guardar
                    </Btn>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Btn variant="gradient" onClick={completarClasificacion} disabled={saving}>
                    <Flag size={13} /> Completar clasificación
                  </Btn>
                </div>
              </div>
            )}
          </Card>

          <Card title="Parrilla guardada" sub="Ordenada por mejor tiempo.">
            {ordenParrilla.length === 0 ? (
              <Empty title="Sin tiempos" />
            ) : (
              <div className="space-y-1.5">
                {ordenParrilla.map((p, i) => (
                  <div key={p.inscripcion_id || p.id} className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 border ${i === 0 ? "border-blue-400/50 bg-blue-500/10" : "border-transparent bg-muted/30"}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-400/20 text-slate-500"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{p.piloto_nombre || p.nombre || "—"}</div>
                      <div className="text-[10px] text-slate-400">#{p.dorsal_asignado || p.dorsal || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground">{fmtMs(parseMs(p.mejor_tiempo || p.mejor_vuelta))}</div>
                      <div className="text-[9px] text-slate-400">+Líder</div>
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-slate-400 pt-2">★ = vuelta que define el mejor tiempo</div>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ── MANGAS ── */}
      {tab === "manga1" || tab === "manga2" ? (
        <Card
          title={tab === "manga1" ? "Manga 1 · Crono" : "Manga 2 · Llegada"}
          sub={tab === "manga2" ? "La parrilla de Manga 2 se genera invirtiendo el resultado de Manga 1." : "Ordená la parrilla, iniciá la manga y fijá el orden de llegada."}
          actions={
            <Btn
              variant={mangaEnVivo === (tab === "manga1" ? 1 : 2) ? "danger" : "success"}
              onClick={() => setMangaEnVivo(mangaEnVivo === (tab === "manga1" ? 1 : 2) ? null : (tab === "manga1" ? 1 : 2))}
            >
              {mangaEnVivo === (tab === "manga1" ? 1 : 2) ? "Parar manga" : "Iniciar manga"}
            </Btn>
          }
        >
          {loading ? <Empty title="Cargando..." /> : (tab === "manga1" ? m1 : m2).length === 0 ? (
            <Empty
              title={tab === "manga2" ? "La Manga 2 se genera desde la Manga 1" : "Sin pilotos"}
              sub={tab === "manga2" ? "Guardá el resultado de la Manga 1 para generar automáticamente la parrilla invertida." : "Guardá tiempos de qualy para armar la parrilla."}
            />
          ) : (
            <div className="space-y-2">
              {(tab === "manga1" ? m1 : m2).map((r, i) => (
                <div key={r.inscripcion_id + String(i)} className={`flex items-center gap-3 rounded-[12px] border p-3 ${mangaEnVivo ? "border-rose-400/40 bg-rose-500/5" : "border-border"}`}>
                  <span className="w-8 h-8 rounded-[10px] bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">{r.posicion ?? i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">{r.piloto || r.nombre || "—"}</div>
                    <div className="text-[10px] text-slate-400">Dorsal {r.dorsal || "—"}{mangaEnVivo ? " · EN VIVO" : ""}</div>
                  </div>
                  <input className={`${inputCls} !w-20 text-center`} placeholder="Vuelta" title="Vuelta (opcional)" defaultValue={r.vueltas ?? ""} />
                  <div className="flex gap-1">
                    <Btn sm variant="secondary" onClick={() => mover(tab === "manga1" ? setM1 : setM2, tab === "manga1" ? m1 : m2, i, -1)} disabled={i === 0}><ArrowUp size={11} /></Btn>
                    <Btn sm variant="secondary" onClick={() => mover(tab === "manga1" ? setM1 : setM2, tab === "manga1" ? m1 : m2, i, 1)} disabled={i >= (tab === "manga1" ? m1 : m2).length - 1}><ArrowDown size={11} /></Btn>
                    <Btn sm variant="danger" onClick={() => quitar(tab === "manga1" ? setM1 : setM2, tab === "manga1" ? m1 : m2, i)}><X size={11} /></Btn>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="gradient" disabled={saving} onClick={() => guardarHeat(tab === "manga1" ? 1 : 2, tab === "manga1" ? m1 : m2)}>
                  <Trophy size={13} /> {tab === "manga1" ? "Finalizar M1 · generar Manga 2" : "Fijar llegadas M2 → Resultados"}
                </Btn>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {/* ── RESULTADOS ── */}
      {tab === "resultados" ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            { num: 1, filas: res1, titulo: "Manga 1" },
            { num: 2, filas: res2, titulo: "Manga 2" },
          ].map((h) => (
            <Card key={h.num} title={`${h.titulo} · Resultados`} sub="Posición final con puntos del esquema oficial.">
              {h.filas.length === 0 ? (
                <Empty title="Sin resultados" sub="Guardá la manga para ver los resultados." />
              ) : (
                <div className="space-y-1.5">
                  {h.filas.map((r, i) => (
                    <div key={r.id || i} className={`flex items-center gap-3 rounded-[10px] px-3 py-2 ${i === 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/30"}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-amber-500 text-white" : "bg-slate-400/20 text-slate-500"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{r.piloto || r.nombre || r.piloto_nombre || "—"}</div>
                        <div className="text-[10px] text-slate-400">#{r.dorsal || "—"} · {r.estatus_carrera || "FIN"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-blue-600">+{r.puntos_ganados ?? puntos(i + 1)} pts</div>
                        <div className="text-[9px] text-slate-400">{r.tiempo_total || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          <Card className="lg:col-span-2" title="Reclamaciones" sub="Período de reclamaciones: 30 minutos tras publicar resultados provisionales.">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[11px] text-slate-500">
                Las reclamaciones se registran en el sistema y se notifican al comisariato para su resolución.
              </p>
              <Btn variant="secondary" onClick={() => setReclamo({})}><ChevronRight size={12} /> Registrar reclamación</Btn>
            </div>
          </Card>
        </div>
      ) : null}

      <Modal open={Boolean(reclamo)} onClose={() => setReclamo(null)} title="Nueva reclamación" sub="Se notificará al comisariato.">
        <form onSubmit={guardarReclamo} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dorsal reclamante"><input name="reclamante" className={inputCls} required /></Field>
            <Field label="Contra dorsal"><input name="contra" className={inputCls} required /></Field>
          </div>
          <Field label="Motivo"><textarea name="motivo" rows={4} className={inputCls} required placeholder="Describí la reclamación..." /></Field>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setReclamo(null)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit">Registrar reclamación</Btn>
          </div>
        </form>
      </Modal>
    </main>
  );
}