"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Eye, Pencil, Users } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, Paginator, Table, Tabs, inputCls, selectCls } from "@/components/kit";
import { NameField, CuiField, TelField, NumberField, DateField } from "@/components/fields";
import { createPiloto, createMotocicleta, updatePiloto, getPilotoPublicDetail } from "@/lib/adminApi";
import { getCurrentUser } from "@/lib/soporteApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const SANGRE = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function PilotosPage() {
  const [pilotos, setPilotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [modal, setModal] = useState(null); // {piloto|null}
  const [tab, setTab] = useState("perfil");
  const [saving, setSaving] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [marcas, setMarcas] = useState([]);
  const [motocicletas, setMotocicletas] = useState([]);
  const [motoDraft, setMotoDraft] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`${API_URL}/api/pilotos${params}`, {
        headers: { Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      const data = await res.json();
      setPilotos(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los pilotos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/mantenimiento/marcas`, {
      headers: { Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}` },
    })
      .then(async (r) => (r.ok ? (await r.json())?.items || [] : []))
      .then(setMarcas)
      .catch(() => setMarcas([]));
  }, []);

  const buscar = () => { setPage(1); load(); };

  const abrirDetalle = async (piloto) => {
    setDetalle({ ...piloto, _loading: true });
    try {
      const detail = await getPilotoPublicDetail(piloto.id);
      setDetalle(detail);
      setMotocicletas(Array.isArray(detail.motocicletas) ? detail.motocicletas : []);
    } catch (err) {
      setError(err?.message || "No se pudo obtener el detalle.");
      setDetalle(null);
    }
  };

  const abrirModal = async (piloto) => {
    setTab("perfil");
    setModal(piloto);
    setMotocicletas([]);
    if (piloto) {
      setModal({ ...piloto, _loading: true });
      try {
        const detail = await getPilotoPublicDetail(piloto.id);
        setModal(detail);
        setMotocicletas(Array.isArray(detail.motocicletas) ? detail.motocicletas : []);
      } catch {
        setModal(piloto);
      }
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const usuario = getCurrentUser();
      const f = new FormData(e.target);
      const nombre = f.get("nombre"), apellido = f.get("apellido");
      const base = {
        nombre, apellido,
        cui: f.get("cui"),
        fecha_nacimiento: f.get("fecha_nacimiento") || undefined,
        genero: f.get("genero") || undefined,
        telefono_personal: f.get("telefono_completo") || f.get("telefono") || undefined,
        direccion: f.get("direccion") || undefined,
        dorsal_preferido: f.get("dorsal") ? Number(f.get("dorsal")) : undefined,
        tipo_sangre: f.get("sangre") || undefined,
        alergias: f.get("alergias") || undefined,
        condiciones_medicas: f.get("condiciones") || undefined,
        nombre_contacto_emergencia: f.get("contacto") || undefined,
        telefono_emergencia: f.get("tel_contacto_completo") || f.get("tel_contacto") || undefined,
        licencia_federacion: f.get("licencia") || undefined,
      };
      if (modal) {
        await updatePiloto(modal.id, { ...base, usuario_id: usuario?.id || "" });
      } else {
        await createPiloto({ ...base, email: f.get("email"), password: f.get("password"), usuario_id: usuario?.id || "" });
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el piloto.");
    } finally {
      setSaving(false);
    }
  };

  const agregarMoto = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const f = new FormData(e.target);
      const created = await createMotocicleta(detalle?.id || modal?.id, {
        marca_id: f.get("marca_id"),
        modelo: f.get("modelo"),
        anio: Number(f.get("anio")),
        cilindrada_real: Number(f.get("cilindrada")),
        vin: f.get("vin") || undefined,
        color: f.get("color") || undefined,
        apodo_moto: f.get("apodo") || undefined,
      });
      setMotocicletas((cur) => [created, ...cur]);
      e.target.reset();
    } catch (err) {
      setError(err?.message || "No se pudo registrar la motocicleta.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return pilotos;
    return pilotos.filter((p) =>
      `${p.usuario?.nombre || ""} ${p.usuario?.apellido || ""} ${p.usuario?.email || ""} ${p.usuario?.perfil_personal?.cui || ""} ${p.licencia_federacion || ""} ${p.dorsal_preferido || ""}`.toLowerCase().includes(qq)
    );
  }, [pilotos, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const porVencer = filtered.filter((p) => p.licencia_por_vencer).length;

  const [detTab, setDetTab] = useState("perfil");

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Registro</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">PILOTOS</h1>
          <p className="text-xs text-slate-500 mt-1">{filtered.length} piloto(s) · búsqueda por nombre, licencia o dorsal.</p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
        </div>
        <Btn variant="gradient" onClick={() => abrirModal(null)}><Plus size={13} /> Nuevo piloto</Btn>
      </div>

      {porVencer > 0 ? (
        <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
          <span className="font-black">⚠</span> {porVencer} piloto(s) con licencia por vencer o vencida.
        </div>
      ) : null}

      <div className="flex gap-2 flex-wrap items-center">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar por nombre, licencia, dorsal..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscar()} />
        <Btn variant="secondary" onClick={buscar}>Buscar</Btn>
        <Btn variant="ghost" onClick={() => { setQ(""); setPage(1); load(); }}>Limpiar</Btn>
      </div>

      {loading ? <Empty title="Cargando pilotos..." /> : filtered.length === 0 ? (
        <Empty title="Sin resultados" sub="No hay pilotos que coincidan con la búsqueda." />
      ) : (
        <Card>
          <Table head={["#", "Piloto", "Licencia", "Dorsal", "Acciones"]}>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                    {`${(p.usuario?.nombre || "?")[0]}${(p.usuario?.apellido || "")[0] || ""}`.toUpperCase()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-foreground">{p.usuario?.nombre} {p.usuario?.apellido}</div>
                  <div className="text-[11px] text-slate-500">{p.usuario?.email || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  {p.licencia_federacion ? <Badge variant="success">Vigente</Badge> : <Badge variant="warning">Sin licencia</Badge>}
                  <div className="text-[10px] text-slate-400 mt-1">{p.licencia_federacion || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center min-w-[34px] h-[26px] rounded-[8px] bg-blue-600 text-white text-xs font-black px-2">{p.dorsal_preferido || "–"}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Btn variant="secondary" sm onClick={() => abrirDetalle(p)}><Eye size={11} /></Btn>
                    <Btn variant="secondary" sm onClick={() => abrirModal(p)}><Pencil size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Paginator page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} shown={pageItems.length} />
        </Card>
      )}

      {/* Modal ver detalle */}
      <Modal
        open={Boolean(detalle && detalle._loading === undefined)}
        onClose={() => setDetalle(null)}
        title="Detalle del piloto"
        sub={detalle?.usuario ? `${detalle.usuario.nombre || ""} ${detalle.usuario.apellido || ""}`.trim() : undefined}
        size="lg"
      >
        {detalle ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ["CUI", detalle.perfil_personal?.cui],
                ["Teléfono", detalle.perfil_personal?.telefono_personal],
                ["Dirección", detalle.perfil_personal?.direccion],
                ["Dorsal preferido", detalle.dorsal_preferido],
                ["Tipo de sangre", detalle.tipo_sangre],
                ["Contacto emergencia", detalle.nombre_contacto_emergencia ? `${detalle.nombre_contacto_emergencia} (${detalle.telefono_emergencia || "—"})` : "—"],
                ["Seguro médico", detalle.seguro_medico_empresa || "—"],
                ["Póliza", detalle.poliza_seguro || "—"],
                ["Licencia", detalle.licencia_federacion || "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[12px] border border-border p-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">{k}</div>
                  <div className="text-xs font-bold text-foreground">{v || "—"}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-[0.1em] text-foreground">{motocicletas.length} moto(s) registrada(s)</h4>
                {marcas.length > 0 ? <Btn variant="secondary" sm onClick={() => setDetTab("moto")}>+ Agregar moto</Btn> : null}
              </div>
              {motocicletas.length === 0 ? (
                <Empty title="Sin motocicletas" sub="Este piloto aún no registró motos." />
              ) : (
                <Table head={["Marca", "Modelo", "Año", "CC", "VIN", "Apodo"]}>
                  {motocicletas.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5 text-xs font-bold text-foreground">{m.marca_nombre || m.marca?.nombre || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{m.modelo}</td>
                      <td className="px-4 py-2.5 text-xs">{m.anio}</td>
                      <td className="px-4 py-2.5 text-xs font-black text-blue-600">{m.cilindrada_real} cc</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{m.vin || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{m.apodo_moto || "—"}</td>
                    </tr>
                  ))}
                </Table>
              )}

              {detTab === "moto" ? (
                <form onSubmit={agregarMoto} className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 rounded-[14px] border border-blue-400/30 bg-blue-500/5 p-4">
                  <Field label="Marca"><select name="marca_id" className={selectCls} required><option value="">Seleccionar</option>{marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></Field>
                  <Field label="Modelo"><input name="modelo" className={inputCls} required placeholder="CBR 600RR" /></Field>
                  <Field label="Año"><input name="anio" type="number" className={inputCls} required /></Field>
                  <Field label="Cilindrada (cc)"><input name="cilindrada" type="number" className={inputCls} required /></Field>
                  <Field label="VIN"><input name="vin" className={inputCls} /></Field>
                  <Field label="Apodo"><input name="apodo" className={inputCls} /></Field>
                  <div className="col-span-full flex justify-end gap-2">
                    <Btn variant="secondary" sm onClick={() => setDetTab("perfil")}>Cancelar</Btn>
                    <Btn variant="gradient" sm type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar moto"}</Btn>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        ) : (
          <Empty title="Cargando detalle..." />
        )}
      </Modal>

      {/* Modal crear/editar */}
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal ? "Editar piloto" : "Nuevo piloto"}
        sub="Perfil personal y datos deportivos."
        size="lg"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" form="pilForm" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Btn>
          </>
        }
      >
        <Tabs
          tabs={[{ key: "perfil", label: "Perfil" }, { key: "deportivo", label: "Deportivo" }]}
          active={tab}
          onChange={setTab}
        />
        <form id="pilForm" onSubmit={guardar} className="mt-4 space-y-3.5">
          {tab === "perfil" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <NameField name="nombre" label="Nombre" defaultValue={modal?.usuario?.nombre || modal?.nombre || ""} required />
                <NameField name="apellido" label="Apellido" defaultValue={modal?.usuario?.apellido || modal?.apellido || ""} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DateField name="fecha_nacimiento" label="Fecha de nacimiento" defaultValue={modal?.usuario?.perfil_personal?.fecha_nacimiento?.slice(0, 10) || modal?.fecha_nacimiento?.slice(0, 10) || ""} past />
                <CuiField name="cui" label="DPI / Documento" defaultValue={modal?.usuario?.perfil_personal?.cui || modal?.cui || ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TelField name="telefono" label="Teléfono" defaultValue={modal?.usuario?.perfil_personal?.telefono_personal || modal?.telefono_personal || ""} />
                <Field label="Correo electrónico">{modal ? <input className={inputCls} defaultValue={modal?.usuario?.email || ""} disabled /> : <input name="email" type="email" className={inputCls} required />}</Field>
              </div>
              <Field label="Contacto de emergencia"><input name="contacto" className={inputCls} defaultValue={modal?.nombre_contacto_emergencia || ""} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <TelField name="tel_contacto" label="Tel. emergencia" defaultValue={modal?.telefono_emergencia || ""} />
                <Field label="Grupo sanguíneo">
                  <select name="sangre" className={selectCls} defaultValue={modal?.tipo_sangre || ""}>
                    {SANGRE.map((s) => <option key={s || "x"} value={s}>{s || "—"}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Alergias conocidas"><textarea name="alergias" rows={2} className={inputCls} defaultValue={modal?.alergias || ""} /></Field>
              {!modal ? (
                <Field label="Contraseña inicial" hint="Se creará una cuenta de usuario con rol PILOTO.">
                  <input name="password" type="password" className={inputCls} required minLength={6} />
                </Field>
              ) : null}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número de licencia"><input name="licencia" className={inputCls} defaultValue={modal?.licencia_federacion || ""} /></Field>
                <NumberField name="dorsal" label="Dorsal preferido" defaultValue={modal?.dorsal_preferido ?? ""} min={1} max={99} maxLength={2} />
              </div>
              <Field label="Dirección"><input name="direccion" className={inputCls} defaultValue={modal?.usuario?.perfil_personal?.direccion || modal?.direccion || ""} /></Field>
              <Field label="Condiciones médicas"><textarea name="condiciones" rows={2} className={inputCls} defaultValue={modal?.condiciones_medicas || ""} /></Field>
            </>
          )}
        </form>
      </Modal>
    </main>
  );
}