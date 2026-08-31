"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, ChevronDown } from "lucide-react";
import AccessWrap from "@/components/AccessWrap";
import { registerRequest } from "@/lib/auth";
import { formatCui, maskPhone, onlyDigits, normalizeTitleCase, onlyLetters, fullPhone } from "@/lib/formats";

const SANGRE = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const TEL_PAIS = "GT";

export default function RegisterPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [cui, setCui] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [tipoSangre, setTipoSangre] = useState("");
  const [contactoEmergencia, setContactoEmergencia] = useState("");
  const [telEmergencia, setTelEmergencia] = useState("");
  const [licencia, setLicencia] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPiloto, setShowPiloto] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await registerRequest({
        nombre: normalizeTitleCase(nombre),
        apellido: normalizeTitleCase(apellido),
        email,
        password,
        cui: cui || undefined,
        fecha_nacimiento: fechaNacimiento || undefined,
        telefono_personal: telefono ? fullPhone(TEL_PAIS, telefono) : undefined,
        direccion: direccion || undefined,
        dorsal_preferido: dorsal ? Number(dorsal) : undefined,
        tipo_sangre: tipoSangre || undefined,
        nombre_contacto_emergencia: normalizeTitleCase(contactoEmergencia) || undefined,
        telefono_emergencia: telEmergencia ? fullPhone(TEL_PAIS, telEmergencia) : undefined,
        licencia_federacion: licencia || undefined,
      });
      router.push("/login");
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const field = (icon, value, set, placeholder, type = "text") => (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50 focus-within:bg-white/[0.06] transition-all">
      {icon}
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={type === "password" ? "new-password" : undefined}
        required={set === setNombre || set === setApellido || set === setEmail || set === setPassword || set === setConfirm}
        className="flex-1 bg-transparent outline-none placeholder-slate-500 text-sm text-white font-semibold"
      />
    </div>
  );

  const plain = (value, set, placeholder, type = "text") => (
    <input
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="flex-1 bg-transparent outline-none placeholder-slate-500 text-sm text-white font-semibold"
    />
  );

  return (
    <AccessWrap
      title="Crear cuenta"
      sub="Registrate para acceder al sistema"
      onBack={() => router.push("/login")}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {field(<User size={15} className="text-slate-500 shrink-0" />, nombre, (v) => setNombre(onlyLetters(v)), "nombre")}
          {field(<User size={15} className="text-slate-500 shrink-0" />, apellido, (v) => setApellido(onlyLetters(v)), "apellido")}
        </div>
        {field(<Mail size={15} className="text-slate-500 shrink-0" />, email, setEmail, "correo electrónico", "email")}
        {field(<Lock size={15} className="text-slate-500 shrink-0" />, password, setPassword, "contraseña", "password")}
        {field(<Lock size={15} className="text-slate-500 shrink-0" />, confirm, setConfirm, "repetir contraseña", "password")}

        <button
          type="button"
          onClick={() => setShowPiloto((v) => !v)}
          className="w-full flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span className="font-bold uppercase tracking-[0.1em]">Datos del piloto (opcional)</span>
          <ChevronDown size={14} className={`transition-transform ${showPiloto ? "rotate-180" : ""}`} />
        </button>

        {showPiloto ? (
          <div className="grid grid-cols-2 gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(cui, (v) => setCui(formatCui(v)), "DPI / CUI (13 dígitos)")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(fechaNacimiento, setFechaNacimiento, "Fecha de nacimiento", "date")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(telefono, (v) => setTelefono(maskPhone(TEL_PAIS, v)), "Teléfono (8 dígitos)")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(dorsal, (v) => setDorsal(onlyDigits(v, 2)), "Dorsal preferido (1-99)")}
            </div>
            <div className="col-span-2 flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(direccion, setDireccion, "Dirección")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              <select
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-white font-semibold [&>option]:text-black"
              >
                {SANGRE.map((s) => (
                  <option key={s || "x"} value={s}>{s ? `Grupo sanguíneo: ${s}` : "Grupo sanguíneo"}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(licencia, setLicencia, "N° licencia federación")}
            </div>
            <div className="col-span-2 flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(contactoEmergencia, (v) => setContactoEmergencia(onlyLetters(v)), "Contacto de emergencia (nombre)")}
            </div>
            <div className="col-span-2 flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50">
              {plain(telEmergencia, (v) => setTelEmergencia(maskPhone(TEL_PAIS, v)), "Tel. de emergencia (8 dígitos)")}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-[12px] border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300 leading-relaxed">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-[0.12em] py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "CREANDO..." : "Registrarme"}
          <ArrowRight size={13} />
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-white/[0.06] text-center text-xs text-slate-500">
        <span>¿Ya tenés cuenta? </span>
        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">Ingresar</Link>
      </div>
    </AccessWrap>
  );
}
