"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Gavel, Plus, Shield } from "lucide-react";
import { Badge, Btn, Empty, Field, Modal, Tabs, inputCls, selectCls } from "@/components/kit";
import { soporteApi, getCurrentUser } from "@/lib/soporteApi";
import { getPublicInscripciones } from "@/lib/publicApi";
import { useConfirm } from "@/components/ConfirmProvider";

const ESTADO_BADGE = {
  PENDIENTE: ["blue", "Pendiente"],
  EN_PROCESO: ["warning", "En proceso"],
  RESUELTO: ["success", "Resuelto"],
};

const EST_APELACION = {
  PENDIENTE: ["warning", "Pendiente"],
  ACEPTADA: ["success", "Aceptada"],
  RECHAZADA: ["error", "Rechazada"],
};

const EST_REVISION = {
  PENDIENTE: ["warning", "Pendiente"],
  APROBADA: ["success", "Aprobada"],
  RECHAZADA: ["error", "Rechazada"],
  CONDICIONAL: ["blue", "Condicional"],
};

export default function ComisarioPage() {
  const { confirm } = useConfirm();
  const [tab, setTab] = useState("infracciones");
  const [sanciones, setSanciones] = useState([]);
  const [apelaciones, setApelaciones] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [items, setItems] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [wDraft, setWDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [evidencias, setEvidencias] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [revOpen, setRevOpen] = useState(null);
  const [revDetalles, setRevDetalles] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, a, r, it, au, tp, ins] = await Promise.all([
        soporteApi.listSanciones().catch(() => []),
        soporteApi.listApelaciones().catch(() => []),
        soporteApi.listRevisionesTecnicas().catch(() => []),
        soporteApi.listItemsChecklist().catch(() => []),
        soporteApi.listAuditoria().catch(() => []),
        soporteApi.listTiposSancion().catch(() => []),
        getPublicInscripciones().catch(() => []),
      ]);
      setSanciones(s);
      setApelaciones(a);
      setRevisiones(r);
      setItems(it);
      setAuditoria(au);
      setTipos(tp);
      setInscripciones(ins);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los datos del comisariato.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const inscriptoLabel = (ins) => {
    if (!ins) return "—";
    const nombre = ins.piloto?.usuario
      ? `${ins.piloto.usuario.nombre} ${ins.piloto.usuario.apellido}`.trim()
      : ins.piloto?.nombre_completo || "—";
    return `${nombre} · #${ins.dorsal_asignado ?? ins.dorsal ?? "—"} · ${ins.evento?.nombre || ins.evento_nombre || "—"}`;
  };

  const nuevaSancion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const f = new FormData(e.target);
      await soporteApi.createSancion({
        inscripcion_id: f.get("inscripcion_id"),
        comisario_id: getCurrentUser()?.id || "",
        tipo_sancion_id: f.get("tipo_sancion_id") || undefined,
        motivo: f.get("motivo"),
        estado: wDraft.estado || "PENDIENTE",
        penalizacion: wDraft.penalizacion || "",
      });
      setNotice("Infracción registrada correctamente.");
      setWizard(false);
      setStep(0);
      setWDraft({});
      setEvidencias([]);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo registrar la sanción.");
    } finally {
      setSaving(false);
    }
  };

  const resolver = async (s) => {
    if (!(await confirm({ title: "Resolver infracción", message: "¿Resolver esta infracción y aplicar la sanción? Esta acción no se puede deshacer.", confirmText: "Resolver" }))) return;
    try {
      await soporteApi.updateSancion(s.id, { estado: "RESUELTO" });
      setNotice(`Sanción aplicada a ${s.piloto ? `#${s.piloto.dorsal_asignado}` : ""}.`);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo resolver la infracción.");
    }
  };

  const decidirApelacion = async (a, estado) => {
    if (!(await confirm({ title: estado === "ACEPTADA" ? "Aceptar apelación" : "Rechazar apelación", message: `¿${estado === "ACEPTADA" ? "Aceptar" : "Rechazar"} la apelación? Esta acción no se puede deshacer.`, confirmText: estado === "ACEPTADA" ? "Aceptar" : "Rechazar", danger: estado === "ACEPTADA" ? false : true }))) return;
    try {
      await soporteApi.updateApelacion(a.id, {
        estado,
        comisario_id: getCurrentUser()?.id || "",
        resolucion: estado === "ACEPTADA" ? "Sanción retirada y clasificación recalculada." : "Apelación denegada.",
      });
      setNotice(estado === "ACEPTADA" ? "Sanción retirada y clasificación recalculada." : "Apelación rechazada.");
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la apelación.");
    }
  };

  const guardarRevision = async (rev) => {
    if (!rev) return;
    setSaving(true);
    setError("");
    try {
      await soporteApi.updateRevisionTecnica(rev.id, {
        estado: revDetalles[rev.id]?.estado || rev.estado,
        observaciones: revDetalles[rev.id]?.observaciones || rev.observaciones || "",
        detalles: (revDetalles[rev.id]?.checklist || []).map((c) => ({
          item_id: c.item_id,
          esta_bien: c.esta_bien,
        })),
      });
      setNotice("Revisión técnica actualizada.");
      setRevOpen(null);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la revisión.");
    } finally {
      setSaving(false);
    }
  };

  const abrirRevision = (rev) => {
    setRevOpen(rev);
    setRevDetalles({
      [rev.id]: {
        estado: rev.estado,
        observaciones: rev.observaciones || "",
        checklist: items.map((it) => ({
          item_id: it.id,
          nombre: it.nombre,
          esta_bien: rev.detalles?.some((d) => d.item_id === it.id && d.esta_bien) ?? false,
        })),
      },
    });
  };

  const STEPS = ["Tipo", "Descripción", "Evidencia", "Comisario inteligente"];

  const iniciarIA = () => {
    setAiLoading(true);
    setTimeout(() => {
      setWDraft((d) => ({
        ...d,
        ai: {
          recomendacion: `+3 segundos según artículo del reglamento vinculado a "${tipos.find((t) => t.id === d.tipo_sancion_id)?.nombre || "la infracción"}"`,
          confianza: 87,
        },
      }));
      setAiLoading(false);
    }, 2200);
  };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Control oficial</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">COMISARIATO</h1>
          <p className="text-xs text-slate-500 mt-1">
            {sanciones.length} infracción(es) · {apelaciones.length} apelación(es) · {revisiones.length} revisión(es) técnica(s).
          </p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
          {notice ? <p className="text-xs text-emerald-600 mt-2">{notice}</p> : null}
        </div>
        <Btn variant="gradient" onClick={() => setWizard(true)}><Plus size={13} /> Nueva infracción</Btn>
      </div>

      <Tabs
        tabs={[
          { key: "infracciones", label: "Infracciones" },
          { key: "apelaciones", label: "Apelaciones" },
          { key: "revisiones", label: "Revisión técnica" },
          { key: "auditoria", label: "Auditoría" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <Empty title="Cargando comisariato..." /> : null}

      {/* INFRAACCIONES */}
      {tab === "infracciones" && !loading ? (
        sanciones.length === 0 ? (
          <Empty title="Sin infracciones" sub="Las sanciones registradas aparecerán aquí." />
        ) : (
          <div className="space-y-2">
            {sanciones.map((s) => {
              const [bv, bl] = ESTADO_BADGE[s.estado] || ESTADO_BADGE.PENDIENTE;
              const abierta = expanded === s.id;
              return (
                <div key={s.id} className="bg-card border border-border rounded-[14px]">
                  <button onClick={() => setExpanded(abierta ? null : s.id)} className="w-full flex items-center gap-3 p-4 text-left">
                    <div className="w-9 h-9 rounded-[10px] bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <Gavel size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-foreground uppercase tracking-wide">INF-{String(s.id).slice(0, 6).toUpperCase()}</span>
                        <Badge variant={bv}>{bl}</Badge>
                        {s.tipo?.nombre ? <Badge variant="indigo">{s.tipo.nombre}</Badge> : null}
                        {s.penalizacion ? <Badge variant="cyan">{s.penalizacion}</Badge> : null}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {s.piloto ? `${s.piloto.nombre || ""} ${s.piloto.apellido || ""} · #${s.piloto.dorsal_asignado || "—"}` : "—"} · {s.evento?.nombre || "—"} · {s.fecha_sancion ? new Date(s.fecha_sancion).toLocaleDateString("es-GT") : "—"}
                      </div>
                    </div>
                    {abierta ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  {abierta ? (
                    <div className="px-4 pb-4 pt-1 border-t border-border">
                      <p className="text-xs text-slate-500 leading-relaxed mb-3"><strong className="text-foreground">Motivo:</strong> {s.motivo}</p>
                      {s.comisario ? <p className="text-[11px] text-slate-400 mb-3">Comisario: {s.comisario.nombre} {s.comisario.apellido}</p> : null}
                      <div className="flex gap-2">
                        {s.estado !== "RESUELTO" ? (
                          <Btn sm variant="success" onClick={() => resolver(s)}>Resolver · aplicar sanción</Btn>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* APELACIONES */}
      {tab === "apelaciones" && !loading ? (
        apelaciones.length === 0 ? (
          <Empty title="Sin apelaciones" sub="Las apelaciones de los pilotos aparecerán aquí." />
        ) : (
          <div className="space-y-2">
            {apelaciones.map((a) => {
              const [bv, bl] = EST_APELACION[a.estado] || EST_APELACION.PENDIENTE;
              const piloto = a.inscripcion?.piloto?.usuario;
              return (
                <div key={a.id} className="bg-card border border-border rounded-[14px] p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant={bv}>{bl}</Badge>
                    <span className="text-xs font-black text-foreground uppercase">APE-{String(a.id).slice(0, 6).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400">Ref: INF-{String(a.sancion_id).slice(0, 6).toUpperCase()}</span>
                  </div>
                  <div className="text-sm font-bold text-foreground mb-1">
                    {piloto ? `${piloto.nombre} ${piloto.apellido}` : "—"} · #{a.inscripcion?.dorsal_asignado || "—"}
                  </div>
                  <p className="text-xs text-slate-500 italic mb-3">&ldquo;{a.motivo}&rdquo;</p>
                  {a.estado === "PENDIENTE" ? (
                    <div className="flex gap-2">
                      <Btn sm variant="success" onClick={() => decidirApelacion(a, "ACEPTADA")}>Aceptar</Btn>
                      <Btn sm variant="danger" onClick={() => decidirApelacion(a, "RECHAZADA")}>Rechazar</Btn>
                    </div>
                  ) : a.resolucion ? (
                    <p className="text-[11px] text-slate-400">Resolución: {a.resolucion}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* REVISIONES TÉCNICAS */}
      {tab === "revisiones" && !loading ? (
        revisiones.length === 0 ? (
          <Empty title="Sin revisiones técnicas" sub="Se crean automáticamente al registrar cada inscripción." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {revisiones.map((rev) => {
              const [bv, bl] = EST_REVISION[rev.estado] || EST_REVISION.PENDIENTE;
              const nombre = rev.inscripcion?.piloto?.usuario
                ? `${rev.inscripcion.piloto.usuario.nombre} ${rev.inscripcion.piloto.usuario.apellido}`.trim()
                : "—";
              return (
                <div key={rev.id} className="bg-card border border-border rounded-[14px] p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-blue-600" />
                      <span className="text-xs font-black text-foreground">{nombre}</span>
                    </div>
                    <Badge variant={bv}>{bl}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">
                    #{rev.inscripcion?.dorsal_asignado || "—"} · {rev.inscripcion?.categoria?.nombre || "—"} · {rev.inscripcion?.evento?.nombre || "—"}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-3">
                    {rev.inscripcion?.motocicleta?.marca?.nombre || ""} {rev.inscripcion?.motocicleta?.modelo || ""} · {new Date(rev.fecha_revision).toLocaleDateString("es-GT")}
                  </div>
                  <Btn sm variant="secondary" onClick={() => abrirRevision(rev)}>Revisar checklist</Btn>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* AUDITORÍA */}
      {tab === "auditoria" && !loading ? (
        auditoria.length === 0 ? (
          <Empty title="Sin trazabilidad" sub="La bitácora de acciones aparecerá aquí." />
        ) : (
          <div className="space-y-2">
            {auditoria.slice(0, 50).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-[12px] border border-border p-3">
                <Badge variant={a.accion === "INSERT" ? "success" : a.accion === "UPDATE" ? "blue" : "warning"}>{a.accion}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">{a.tabla_afectada}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Registro {String(a.registro_id).slice(0, 8)} · {a.usuario ? `${a.usuario.nombre} ${a.usuario.apellido}` : "sistema"}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">{new Date(a.fecha).toLocaleString("es-GT")}</div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* MODAL REVISIÓN */}
      <Modal
        open={Boolean(revOpen)}
        onClose={() => setRevOpen(null)}
        title="Revisión técnica"
        sub={revOpen ? `${revOpen.inscripcion?.piloto?.usuario?.nombre || ""} ${revOpen.inscripcion?.piloto?.usuario?.apellido || ""} · #${revOpen.inscripcion?.dorsal_asignado || "—"}`.trim() : undefined}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setRevOpen(null)}>Cancelar</Btn>
            <Btn variant="gradient" onClick={() => guardarRevision(revOpen)} disabled={saving}>
              {saving ? "Guardando..." : "Guardar revisión"}
            </Btn>
          </>
        }
      >
        {revOpen ? (
          <div className="space-y-4">
            <Field label="Estado">
              <select
                className={selectCls}
                value={revDetalles[revOpen.id]?.estado || revOpen.estado}
                onChange={(e) => setRevDetalles((d) => ({ ...d, [revOpen.id]: { ...d[revOpen.id], estado: e.target.value } }))}
              >
                {Object.keys(EST_REVISION).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Observaciones">
              <textarea
                rows={2}
                className={inputCls}
                value={revDetalles[revOpen.id]?.observaciones || ""}
                onChange={(e) => setRevDetalles((d) => ({ ...d, [revOpen.id]: { ...d[revOpen.id], observaciones: e.target.value } }))}
              />
            </Field>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 mb-2">Checklist técnico</div>
              <div className="space-y-1.5">
                {(revDetalles[revOpen.id]?.checklist || []).map((c, i) => (
                  <label key={c.item_id} className="flex items-center gap-3 rounded-[10px] border border-border px-3 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.esta_bien}
                      onChange={(e) => {
                        const next = (revDetalles[revOpen.id]?.checklist || []).map((x, xi) => (xi === i ? { ...x, esta_bien: e.target.checked } : x));
                        setRevDetalles((d) => ({ ...d, [revOpen.id]: { ...d[revOpen.id], checklist: next } }));
                      }}
                      className="accent-blue-600"
                    />
                    <span className={`text-xs font-bold ${c.esta_bien ? "text-emerald-600" : "text-foreground"}`}>{c.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* WIZARD NUEVA INFRACCIÓN */}
      <Modal
        open={wizard}
        onClose={() => setWizard(false)}
        title="Nueva infracción"
        sub={`Paso ${step + 1} de 4 · ${STEPS[step]}`}
        size="lg"
        footer={
          step < 3 ? (
            <>
              <Btn variant="secondary" onClick={() => (step === 0 ? setWizard(false) : setStep(step - 1))}>Atrás</Btn>
              <Btn variant="gradient" disabled={saving} onClick={() => {
                if (step === 2) { setStep(3); iniciarIA(); } else setStep(step + 1);
              }}>Continuar</Btn>
            </>
          ) : null
        }
      >
        {step === 0 ? (
          <div className="space-y-3">
            <Field label="Tipo de infracción">
              <select
                className={selectCls}
                value={wDraft.tipo_sancion_id || ""}
                onChange={(e) => setWDraft({ ...wDraft, tipo_sancion_id: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </Field>
            <Field label="Inscripción involucrada" hint="Busca por evento, categoría y dorsal.">
              <select
                className={selectCls}
                value={wDraft.inscripcion_id || ""}
                onChange={(e) => setWDraft({ ...wDraft, inscripcion_id: e.target.value })}
              >
                <option value="">Seleccionar inscripción</option>
                {inscripciones.map((ins) => <option key={ins.id} value={ins.id}>{inscriptoLabel(ins)}</option>)}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <Field label="Artículo del reglamento infringido">
              <input className={inputCls} value={wDraft.articulo || ""} onChange={(e) => setWDraft({ ...wDraft, articulo: e.target.value })} placeholder="Ej. Art. 4.2 Adelantamientos" />
            </Field>
            <Field label="Descripción detallada">
              <textarea rows={4} className={inputCls} value={wDraft.motivo || ""} onChange={(e) => setWDraft({ ...wDraft, motivo: e.target.value })} placeholder="Describí el incidente..." />
            </Field>
            <Field label="Penalización sugerida">
              <input className={inputCls} value={wDraft.penalizacion || ""} onChange={(e) => setWDraft({ ...wDraft, penalizacion: e.target.value })} placeholder="Ej. +3 segundos / 2 posiciones / DQ" />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Adjuntá evidencia del incidente (imágenes o video).</p>
            <div className="flex gap-2">
              <Btn variant="secondary" sm onClick={() => { setEvidencias((e) => [...e, `foto_${e.length + 1}.jpg`]); }}>📷 Cámara</Btn>
              <Btn variant="secondary" sm onClick={() => { setEvidencias((e) => [...e, `video_${e.length + 1}.mp4`]); }}>🖼️ Galería</Btn>
            </div>
            {evidencias.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {evidencias.map((ev, i) => (
                  <span key={i} className="inline-flex items-center gap-2 rounded-[10px] border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-700">
                    {ev}
                    <button onClick={() => setEvidencias(evidencias.filter((_, x) => x !== i))}>✕</button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-indigo-400/30 bg-indigo-500/5 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500 mb-2">Comisario Inteligente · RNA</div>
              {aiLoading ? (
                <div className="text-xs text-slate-500 animate-pulse">Analizando evidencia y reglamento...</div>
              ) : wDraft.ai ? (
                <>
                  <div className="text-sm font-black text-foreground mb-2">{wDraft.ai.recomendacion}</div>
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      <span>Confianza</span><span>{wDraft.ai.confianza}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${wDraft.ai.confianza}%` }} />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">Tipo de sanción: <strong className="text-foreground">{wDraft.penalizacion || "tiempo"}</strong></div>
                </>
              ) : null}
            </div>
            <form onSubmit={nuevaSancion} className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => { setStep(2); }}>Modificar</Btn>
              <Btn variant="gradient" type="submit" disabled={saving || aiLoading || !wDraft.motivo || !wDraft.inscripcion_id}>
                {saving ? "Registrando..." : "Aceptar y aplicar sanción"}
              </Btn>
            </form>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}