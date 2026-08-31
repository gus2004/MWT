"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, Paginator, Table, inputCls, selectCls } from "@/components/kit";
import { NumberField } from "@/components/fields";
import { getPilotoPublicDetail, createMotocicleta } from "@/lib/adminApi";
import { getCurrentUser } from "@/lib/soporteApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function MotosPage() {
  const [pilotos, setPilotos] = useState([]);
  const [motos, setMotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [marcas, setMarcas] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [modal, setModal] = useState(null); // piloto al que se le agrega moto
  const [saving, setSaving] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}`,
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/pilotos`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `HTTP ${res.status}`);
      const data = await res.json();
      const pilotosArr = Array.isArray(data.items) ? data.items : [];
      setPilotos(pilotosArr);

      const all = [];
      await Promise.all(pilotosArr.slice(0, 60).map(async (p) => {
        try {
          const detail = await getPilotoPublicDetail(p.id);
          const motosPiloto = (Array.isArray(detail.motocicletas) ? detail.motocicletas : []).map((m) => ({
            ...m,
            piloto_id: p.id,
            piloto_nombre: `${p.usuario?.nombre || ""} ${p.usuario?.apellido || ""}`.trim(),
          }));
          all.push(...motosPiloto);
        } catch {
          // piloto sin detalle: ignorar
        }
      }));
      setMotos(all);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar las motocicletas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/mantenimiento/marcas`, { headers: authHeaders() })
      .then(async (r) => (r.ok ? (await r.json())?.items || [] : []))
      .then(setMarcas)
      .catch(() => setMarcas([]));
  }, []);

  const agregarMoto = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const f = new FormData(e.target);
      const created = await createMotocicleta(modal.id, {
        marca_id: f.get("marca_id"),
        modelo: f.get("modelo"),
        anio: Number(f.get("anio")),
        cilindrada_real: Number(f.get("cilindrada")),
        vin: f.get("vin") || undefined,
        color: f.get("color") || undefined,
        apodo_moto: f.get("apodo") || undefined,
      });
      setMotos((cur) => [{
        ...created,
        marca_nombre: created?.marca?.nombre || "",
        piloto_id: modal.id,
        piloto_nombre: `${modal.usuario?.nombre || ""} ${modal.usuario?.apellido || ""}`.trim(),
      }, ...cur]);
      setModal(null);
    } catch (err) {
      setError(err?.message || "No se pudo registrar la motocicleta.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return motos.filter((m) => {
      const okQ = !qq || `${m.piloto_nombre || ""} ${m.marca_nombre || ""} ${m.modelo || ""}`.toLowerCase().includes(qq);
      const okMarca = !filtroMarca || String(m.marca_id) === filtroMarca;
      return okQ && okMarca;
    });
  }, [motos, q, filtroMarca]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Parque de motos</div>
          <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">MOTOS</h1>
          <p className="text-xs text-slate-500 mt-1">{motos.length} motocicleta(s) registrada(s) · fichas técnicas de los pilotos.</p>
          {error ? <p className="text-xs text-rose-500 mt-2">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-border px-4 py-2.5">
          <Zap size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Fichas por vencer</span>
          <Badge variant="warning">{motos.filter((m) => m.ficha_por_vencer).length}</Badge>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar por piloto, marca o modelo..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className={`${selectCls} max-w-[180px]`} value={filtroMarca} onChange={(e) => { setFiltroMarca(e.target.value); setPage(1); }}>
          <option value="">Todas las marcas</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <Btn variant="ghost" onClick={() => { setQ(""); setFiltroMarca(""); setPage(1); }}>Limpiar</Btn>
      </div>

      {loading ? <Empty title="Cargando motocicletas..." /> : filtered.length === 0 ? (
        <Empty title="Sin resultados" sub="No hay motocicletas que coincidan." />
      ) : (
        <Card>
          <Table head={["Piloto", "Marca / Modelo", "Año", "CC", "Motor", "Chasis", "Apodo"]}>
            {pageItems.map((m) => (
              <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-foreground">{m.piloto_nombre || "—"}</div>
                  <div className="text-[10px] text-slate-400">Dorsal {m.dorsal_preferido ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-foreground">{m.marca_nombre || m.marca?.nombre || "—"}</div>
                  <div className="text-[11px] text-slate-500">{m.modelo}</div>
                </td>
                <td className="px-4 py-3 text-sm">{m.anio}</td>
                <td className="px-4 py-3 text-sm font-black text-blue-600">{m.cilindrada_real} cc</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{m.motor || "—"}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{m.vin || "—"}</td>
                <td className="px-4 py-3 text-xs">{m.apodo_moto || "—"}</td>
              </tr>
            ))}
          </Table>
          <Paginator page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} shown={pageItems.length} />
        </Card>
      )}

      <Card title="Registrar motocicleta" sub="Se asigna al piloto seleccionado y queda disponible para inscripciones.">
        {pilotos.length === 0 ? (
          <Empty title="No hay pilotos" sub="Registrá pilotos primero." />
        ) : (
          <form onSubmit={agregarMoto} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Piloto">
              <select
                className={selectCls}
                value={modal?.id || ""}
                onChange={(e) => {
                  const p = pilotos.find((x) => x.id === e.target.value);
                  setModal(p || null);
                }}
                required
              >
                <option value="">Seleccionar piloto</option>
                {pilotos.map((p) => (
                  <option key={p.id} value={p.id}>{p.usuario?.nombre} {p.usuario?.apellido} · dorsal {p.dorsal_preferido ?? "—"}</option>
                ))}
              </select>
            </Field>
            <Field label="Marca">
              <select name="marca_id" className={selectCls} required>
                <option value="">Seleccionar</option>
                {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </Field>
            <Field label="Modelo"><input name="modelo" className={inputCls} required placeholder="Ej. CBR 600RR" /></Field>
            <NumberField name="anio" label="Año" min={1900} max={2030} maxLength={4} required />
            <NumberField name="cilindrada" label="Cilindrada real (cc)" min={50} max={2500} maxLength={4} required />
            <Field label="VIN"><input name="vin" className={inputCls} /></Field>
            <Field label="Color"><input name="color" className={inputCls} /></Field>
            <Field label="Apodo"><input name="apodo" className={inputCls} /></Field>
            <div className="flex items-end">
              <Btn variant="gradient" type="submit" disabled={saving || !modal} className="w-full">
                {saving ? "Guardando..." : "+ Registrar moto"}
              </Btn>
            </div>
          </form>
        )}
      </Card>

      <Modal
        open={Boolean(modal && modal._motoOpen)}
        onClose={() => setModal((m) => (m ? { ...m, _motoOpen: false } : null))}
        title={`Agregar moto · ${modal?.usuario?.nombre || ""} ${modal?.usuario?.apellido || ""}`.trim()}
      >
        <form onSubmit={agregarMoto} className="space-y-3">
          <Field label="Marca">
            <select name="marca_id" className={selectCls} required>
              <option value="">Seleccionar</option>
              {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Modelo"><input name="modelo" className={inputCls} required /></Field>
            <NumberField name="anio" label="Año" min={1900} max={2030} maxLength={4} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField name="cilindrada" label="Cilindrada (cc)" min={50} max={2500} maxLength={4} required />
            <Field label="VIN"><input name="vin" className={inputCls} /></Field>
          </div>
          <Field label="Apodo"><input name="apodo" className={inputCls} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setModal((m) => (m ? { ...m, _motoOpen: false } : null))}>Cancelar</Btn>
            <Btn variant="gradient" type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Btn>
          </div>
        </form>
      </Modal>
    </main>
  );
}