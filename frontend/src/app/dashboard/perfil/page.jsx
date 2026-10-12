"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Badge, Btn, Card, Field, inputCls, selectCls } from "@/components/kit";
import { NameField, CuiField, TelField, NumberField, DateField, YearField } from "@/components/fields";
import { updateProfile, getToken } from "@/lib/auth";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const SANGRE = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function PwdInput({ className, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} className={`${className} pr-9`} {...props} />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors" tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function PerfilPage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("personal");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo cargar el perfil.");
        return r.json();
      })
      .then((d) => {
        setMe(d);
        localStorage.setItem("mwt_user", JSON.stringify(d));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pp = me?.perfil_personal || {};
  const pf = me?.perfil_piloto || {};

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const f = new FormData(e.target);
    const payload = {
      nombre: f.get("nombre"),
      apellido: f.get("apellido"),
      cui: f.get("cui") || undefined,
      fecha_nacimiento: f.get("fecha_nacimiento") || undefined,
      genero: f.get("genero") || undefined,
      telefono_personal: f.get("telefono_completo") || f.get("telefono") || undefined,
      direccion: f.get("direccion") || undefined,
      dorsal_preferido: f.get("dorsal") ? Number(f.get("dorsal")) : undefined,
      tipo_sangre: f.get("sangre") || undefined,
      alergias: f.get("alergias") || undefined,
      condiciones_medicas: f.get("condiciones") || undefined,
      nombre_contacto_emergencia: f.get("contacto") || undefined,
      parentesco_emergencia: f.get("parentesco") || undefined,
      telefono_emergencia: f.get("tel_contacto_completo") || f.get("tel_contacto") || undefined,
      seguro_medico_empresa: f.get("seguro") || undefined,
      poliza_seguro: f.get("poliza") || undefined,
      licencia_federacion: f.get("licencia") || undefined,
    };
    try {
      const updated = await updateProfile(payload);
      if (updated && updated !== true) setMe(updated);
      setNotice("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const f = new FormData(e.target);
    if (f.get("nueva") !== f.get("confirmar")) {
      setError("Las contraseñas no coinciden.");
      setSaving(false);
      return;
    }
    try {
      await updateProfile({ actual_password: f.get("actual"), password: f.get("nueva") });
      setNotice("Contraseña actualizada correctamente.");
      e.target.reset();
    } catch (err) {
      setError(err?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6 lg:p-8">
        <Card><p className="text-sm text-slate-500 py-6 text-center">Cargando perfil...</p></Card>
      </main>
    );
  }

  const roleOverBadge = me?.roles?.length ? (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {me.roles.map((r) => <Badge key={r}>{r}</Badge>)}
    </div>
  ) : null;

  const fullName = me ? `${me.nombre || ""} ${me.apellido || ""}`.trim() : "Mi cuenta";

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Cuenta</div>
        <h1 className="text-lg font-black uppercase tracking-[0.04em] text-foreground">MI PERFIL</h1>
        <p className="text-xs text-slate-500 mt-1">Configurá tus datos personales, de piloto y de acceso.</p>
      </div>

      {error ? <div className="rounded-[12px] border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-600">{error}</div> : null}
      {notice ? <div className="rounded-[12px] border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-600">{notice}</div> : null}

      <Card
        title={fullName}
        sub={me?.email}
      >
        {roleOverBadge}

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[["Estado", me?.esta_activo ? "Activo" : "Inactivo"], ["Último acceso", me?.ultimo_login ? new Date(me.ultimo_login).toLocaleString() : "—"], ["Dorsal preferido", pf.dorsal_preferido ?? "—"], ["Tipo de sangre", pf.tipo_sangre || "—"], ["Licencia", pf.licencia_federacion || "—"], ["CUI", pp.cui || "—"]].map(([k, v]) => (
            <div key={k} className="rounded-[12px] border border-border p-3">
              <div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">{k}</div>
              <div className="text-xs font-bold text-foreground">{v || "—"}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Datos del perfil" sub="Información personal y de piloto.">
          <div className="space-y-1 mb-4 flex gap-1 bg-muted rounded-[10px] p-1">
            {[{ k: "personal", l: "Personal" }, { k: "piloto", l: "Piloto" }].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex-1 rounded-[8px] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${tab === t.k ? "bg-background text-foreground shadow-sm" : "text-slate-500"}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <form onSubmit={guardar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <NameField name="nombre" label="Nombre" defaultValue={me?.nombre || ""} required />
              <NameField name="apellido" label="Apellido" defaultValue={me?.apellido || ""} required />
            </div>

            {tab === "personal" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <DateField name="fecha_nacimiento" label="Fecha de nacimiento" defaultValue={pp.fecha_nacimiento?.slice(0, 10) || ""} past />
                  <CuiField name="cui" label="CUI / DPI" defaultValue={pp.cui || ""} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TelField name="telefono" label="Teléfono" defaultValue={pp.telefono_personal || ""} />
                  <Field label="Género">
                    <select name="genero" className={selectCls} defaultValue={pp.genero || ""}>
                      <option value="">—</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </Field>
                </div>
                <Field label="Dirección"><input name="direccion" className={inputCls} defaultValue={pp.direccion || ""} /></Field>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField name="dorsal" label="Dorsal preferido" defaultValue={pf.dorsal_preferido ?? ""} min={1} max={99} maxLength={2} />
                  <Field label="Tipo de sangre">
                    <select name="sangre" className={selectCls} defaultValue={pf.tipo_sangre || ""}>
                      {SANGRE.map((s) => <option key={s || "x"} value={s}>{s || "—"}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="N° licencia federación"><input name="licencia" className={inputCls} defaultValue={pf.licencia_federacion || ""} /></Field>
                  <NameField name="contacto" label="Nombre contacto emergencia" defaultValue={pf.nombre_contacto_emergencia || ""} />
                </div>
                <TelField name="tel_contacto" label="Tel. contacto emergencia" defaultValue={pf.telefono_emergencia || ""} />
                <Field label="Alergias"><textarea name="alergias" rows={2} className={inputCls} defaultValue={pf.alergias || ""} /></Field>
                <Field label="Condiciones médicas"><textarea name="condiciones" rows={2} className={inputCls} defaultValue={pf.condiciones_medicas || ""} /></Field>
              </>
            )}

            <div className="flex justify-end">
              <Btn variant="gradient" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Btn>
            </div>
          </form>
        </Card>

        <Card title="Seguridad" sub="Cambiar mi contraseña.">
          <form onSubmit={cambiarPassword} className="space-y-3">
            <Field label="Contraseña actual"><PwdInput name="actual" className={inputCls} required autoComplete="current-password" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nueva contraseña"><PwdInput name="nueva" className={inputCls} required minLength={6} autoComplete="new-password" /></Field>
              <Field label="Confirmar nueva"><PwdInput name="confirmar" className={inputCls} required minLength={6} autoComplete="new-password" /></Field>
            </div>
            <div className="flex justify-end">
              <Btn variant="gradient" type="submit" disabled={saving}>{saving ? "Guardando..." : "Cambiar contraseña"}</Btn>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
