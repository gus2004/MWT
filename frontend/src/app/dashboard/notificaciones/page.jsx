"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellRing, CheckCheck, Pencil, Plus, Save } from "lucide-react";
import { Badge, Btn, Empty, Field, Modal, SearchSelect, Tabs, inputCls, selectCls } from "@/components/kit";
import { soporteApi, getCurrentUser } from "@/lib/soporteApi";
import { listEventos } from "@/lib/adminApi";

const TIPOS = ["general", "inscripcion", "documento", "horario", "resultados", "sancion", "pago", "evento", "sistema"];

const TIPO_BADGE = {
  inscripcion: ["indigo", "Inscripción"],
  documento: ["warning", "Documento"],
  horario: ["blue", "Horario"],
  resultados: ["success", "Resultados"],
  sancion: ["error", "Sanción"],
  pago: ["cyan", "Pago"],
  evento: ["violet", "Evento"],
  sistema: ["slate", "Sistema"],
  general: ["slate", "General"],
};

export default function NotificacionesPage() {
  const [tab, setTab] = useState("centro");
  const [notis, setNotis] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [nueva, setNueva] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null);

  const eventoGroups = useMemo(() => {
    const evs = Array.isArray(eventos) ? eventos : Array.isArray(eventos?.items) ? eventos.items : [];
    const map = {};
    evs.forEach((ev) => {
      const key = ev.campeonato?.nombre || "Sin campeonato";
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
  }, [eventos]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [n, p, ev, ins] = await Promise.all([
        soporteApi.listNotificaciones().catch(() => []),
        soporteApi.listPlantillas().catch(() => []),
        listEventos().catch(() => []),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/public/inscripciones?options=1`).then((r) => r.ok ? r.json() : []).catch(() => []),
      ]);
      setNotis(n);
      setPlantillas(p);
      setEventos(ev);
      const seen = new Set();
      const opts = Array.isArray(ins) ? ins : ins?.items || [];
      setDestinos(opts.filter((x) => x?.usuario_id && !seen.has(x.usuario_id) && seen.add(x.usuario_id)));
    } catch (err) {
      setError(err?.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const noLeidas = notis.filter((n) => !n.leida).length;
  const visibles = filtro === "no_leidas" ? notis.filter((n) => !n.leida) : notis;

  const marcar = async (n) => {
    if (!n || n.leida) return;
    try {
      await soporteApi.markNotificacionLeida(n.id, true);
      setNotis(notis.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    } catch (err) {
      setError(err?.message || "No se pudo marcar la notificación.");
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await soporteApi.createNotificacion({
        usuario_id: draft.a_todos ? undefined : draft.usuario_id || undefined,
        evento_id: draft.evento_id || undefined,
        tipo: draft.tipo || "general",
        titulo: draft.titulo,
        mensaje: draft.mensaje,
      });
      setNotice("Notificación enviada.");
      setNueva(false);
      setDraft({});
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo enviar la notificación.");
    } finally {
      setSaving(false);
    }
  };

  const aplicarPlantilla = (t) => {
    setDraft((d) => ({ ...d, tipo: t.tipo || "general", titulo: t.titulo.replace(/\{[^}]*\}/g, "").trim(), mensaje: t.cuerpo }));
  };

  const guardarPlantilla = async (p) => {
    setSaving(true);
    setError("");
    try {
      await soporteApi.savePlantilla({
        clave: p.clave,
        titulo: p.titulo,
        cuerpo: p.cuerpo,
        tipo: p.tipo,
        descripcion: p.descripcion || "Editada desde el centro de notificaciones",
      });
      setNotice(`Plantilla "${p.clave}" guardada.`);
      setEditando(null);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const destinatarioLabel = (n) => {
    if (!n?.usuario_id) return "Todos los usuarios";
    return n.usuario ? `${n.usuario.nombre} ${n.usuario.apellido}`.trim() : "Usuario específico";
  };

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Centro de avisos</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">NOTIFICACIONES</h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            {noLeidas > 0 ? <BellRing size={12} className="text-blue-600" /> : <Bell size={12} />}
            {noLeidas} sin leer de {notis.length} en total.
          </p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
          {notice ? <p className="text-xs text-emerald-600 mt-2">{notice}</p> : null}
        </div>
        <Btn variant="gradient" onClick={() => setNueva(true)}><Plus size={13} /> Nueva notificación</Btn>
      </div>

      <Tabs
        tabs={[
          { key: "centro", label: "Centro" },
          { key: "plantillas", label: "Plantillas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <Empty title="Cargando notificaciones..." /> : null}

      {tab === "centro" && !loading ? (
        notis.length === 0 ? (
          <Empty title="Sin notificaciones" sub="Las notificaciones enviadas aparecerán aquí." />
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Btn sm variant={filtro === "todas" ? "gradient" : "secondary"} onClick={() => setFiltro("todas")}>Todas ({notis.length})</Btn>
              <Btn sm variant={filtro === "no_leidas" ? "gradient" : "secondary"} onClick={() => setFiltro("no_leidas")}>No leídas ({noLeidas})</Btn>
            </div>
            <div className="space-y-2">
              {visibles.map((n) => {
                const [bv, bl] = TIPO_BADGE[n.tipo] || TIPO_BADGE.general;
                return (
                  <div key={n.id} className={`bg-card border rounded-[14px] p-4 ${n.leida ? "border-border" : "border-blue-400/40 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${n.leida ? "bg-slate-500/10 text-slate-400" : "bg-blue-500/10 text-blue-600"}`}>
                        <Bell size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-black ${n.leida ? "text-slate-400" : "text-foreground"}`}>{n.titulo}</span>
                          <Badge variant={bv}>{bl}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.mensaje}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 flex-wrap">
                          <span><strong className="text-slate-500">Para:</strong> {destinatarioLabel(n)}</span>
                          {n.evento ? <span>· <strong className="text-slate-500">Evento:</strong> {n.evento.nombre}</span> : null}
                          <span>· <strong className="text-slate-500">Fecha:</strong> {new Date(n.fecha_envio).toLocaleString("es-GT")}</span>
                        </div>
                      </div>
                      {!n.leida ? (
                        <Btn sm variant="secondary" onClick={() => marcar(n)}>
                          <CheckCheck size={13} /> Leída
                        </Btn>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : null}

      {tab === "plantillas" && !loading ? (
        plantillas.length === 0 ? (
          <Empty title="Sin plantillas" sub="Se restablecerán las plantillas por defecto al consultarlas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-3 py-2">Clave</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Cuerpo</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {plantillas.map((p) => {
                  const [bv, bl] = TIPO_BADGE[p.tipo] || TIPO_BADGE.general;
                  const editandoEsta = editando === p.id;
                  return (
                    <tr key={p.id} className="bg-card border border-border rounded-[14px]">
                      <td className="px-3 py-3 text-xs font-black text-foreground whitespace-nowrap">{p.clave}</td>
                      <td className="px-3 py-3">
                        {editandoEsta ? (
                          <input
                            className={inputCls}
                            value={p.tipo}
                            onChange={(e) => setPlantillas(plantillas.map((x) => (x.id === p.id ? { ...x, tipo: e.target.value } : x)))}
                          />
                        ) : (
                          <Badge variant={bv}>{bl}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold text-foreground max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {editandoEsta ? (
                          <input
                            className={inputCls}
                            value={p.titulo}
                            onChange={(e) => setPlantillas(plantillas.map((x) => (x.id === p.id ? { ...x, titulo: e.target.value } : x)))}
                          />
                        ) : p.titulo}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500 max-w-[260px]">
                        {editandoEsta ? (
                          <textarea
                            rows={2}
                            className={inputCls}
                            value={p.cuerpo}
                            onChange={(e) => setPlantillas(plantillas.map((x) => (x.id === p.id ? { ...x, cuerpo: e.target.value } : x)))}
                          />
                        ) : <span className="whitespace-nowrap overflow-hidden text-ellipsis block max-w-[240px]">{p.cuerpo}</span>}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {editandoEsta ? (
                          <Btn sm variant="gradient" disabled={saving} onClick={() => guardarPlantilla(p)}><Save size={12} /> Guardar</Btn>
                        ) : (
                          <>
                            <Btn sm variant="secondary" onClick={() => setEditando(p.id)}><Pencil size={12} /> Editar</Btn>
                            <Btn sm variant="secondary" className="ml-1" onClick={() => { aplicarPlantilla(p); setTab("centro"); setNueva(true); }}>
                              <Bell size={12} /> Usar
                            </Btn>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      <Modal
        open={nueva}
        onClose={() => setNueva(false)}
        title="Nueva notificación"
        sub="Se enviará a todos los usuarios o a un destinatario específico."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setNueva(false)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" form="noti-form" disabled={saving || !draft.titulo || !draft.mensaje}>
              {saving ? "Enviando..." : "Enviar"}
            </Btn>
          </>
        }
      >
        <form id="noti-form" onSubmit={enviar} className="space-y-3">
          <Field label="Destinatario">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-2">
              <input
                type="checkbox"
                checked={draft.a_todos || false}
                onChange={(e) => setDraft({ ...draft, a_todos: e.target.checked, usuario_id: undefined })}
                className="accent-blue-600"
              />
              Enviar a todos los usuarios
            </label>
            {!draft.a_todos ? (
              <select className={selectCls} value={draft.usuario_id || ""} onChange={(e) => setDraft({ ...draft, usuario_id: e.target.value })}>
                <option value="">Seleccionar destinatario</option>
                {destinos.map((d) => (
                  <option key={d.usuario_id} value={d.usuario_id}>{d.usuario?.nombre || d.nombre || ""} {d.usuario?.apellido || d.apellido || ""}</option>
                ))}
              </select>
            ) : null}
          </Field>
          <Field label="Evento relacionado (opcional)">
            <SearchSelect clearable groups={eventoGroups} value={draft.evento_id || ""} onChange={(v) => setDraft({ ...draft, evento_id: v })} placeholder="Sin evento" searchPlaceholder="Buscar evento..." />
          </Field>
          <Field label="Tipo">
            <select className={selectCls} value={draft.tipo || "general"} onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Título">
            <input className={inputCls} value={draft.titulo || ""} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ej. Licencia por vencer" required />
          </Field>
          <Field label="Mensaje">
            <textarea rows={3} className={inputCls} value={draft.mensaje || ""} onChange={(e) => setDraft({ ...draft, mensaje: e.target.value })} placeholder="Redactá el aviso..." required />
          </Field>
        </form>
      </Modal>
    </main>
  );
}