"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, ChevronDown, Eye, EyeOff } from "lucide-react";
import AccessWrap from "@/components/AccessWrap";
import { registerRequest } from "@/lib/auth";
import { formatCui, maskPhone, onlyDigits, normalizeTitleCase, onlyLetters, fullPhone } from "@/lib/formats";

const SANGRE = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const TEL_PAIS = "GT";

function PwdField({ value, setter, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 sm:py-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
      <Lock size={18} className="text-slate-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        required
        className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-[15px] font-semibold"
      />
      <button type="button" onClick={() => setShow((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5" tabIndex={-1}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

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
    <div className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 sm:py-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all min-w-0">
      {icon}
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={type === "password" ? "new-password" : undefined}
        required={set === setNombre || set === setApellido || set === setEmail || set === setPassword || set === setConfirm}
        className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-[15px] font-semibold"
      />
    </div>
  );

  const plain = (value, set, placeholder, type = "text") => (
    <input
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-[15px] font-semibold"
    />
  );

  return (
    <AccessWrap
      title="Crear cuenta"
      sub="Registrate para acceder al sistema"
      onBack={() => router.push("/login")}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field(<User size={18} className="text-slate-400 shrink-0" />, nombre, (v) => setNombre(onlyLetters(v)), "nombre")}
          {field(<User size={18} className="text-slate-400 shrink-0" />, apellido, (v) => setApellido(onlyLetters(v)), "apellido")}
        </div>
        {field(<Mail size={18} className="text-slate-400 shrink-0" />, email, setEmail, "correo electrónico", "email")}
        <PwdField value={password} setter={setPassword} placeholder="contraseña" />
        <PwdField value={confirm} setter={setConfirm} placeholder="repetir contraseña" />

        <button
          type="button"
          onClick={() => setShowPiloto((v) => !v)}
          className="w-full flex items-center justify-between rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 sm:py-4 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="font-bold uppercase tracking-[0.1em]">Datos del piloto (opcional)</span>
          <ChevronDown size={16} className={`transition-transform ${showPiloto ? "rotate-180" : ""}`} />
        </button>

        {showPiloto ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[16px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(cui, (v) => setCui(formatCui(v)), "DPI / CUI (13 dígitos)")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(fechaNacimiento, setFechaNacimiento, "Fecha de nacimiento", "date")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(telefono, (v) => setTelefono(maskPhone(TEL_PAIS, v)), "Teléfono (8 dígitos)")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(dorsal, (v) => setDorsal(onlyDigits(v, 2)), "Dorsal preferido (1-99)")}
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(direccion, setDireccion, "Dirección")}
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <select
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm sm:text-[15px] text-slate-900 font-semibold"
              >
                {SANGRE.map((s) => (
                  <option key={s || "x"} value={s}>{s ? `Grupo sanguíneo: ${s}` : "Grupo sanguíneo"}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(licencia, setLicencia, "N° licencia federación")}
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(contactoEmergencia, (v) => setContactoEmergencia(onlyLetters(v)), "Contacto de emergencia (nombre)")}
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              {plain(telEmergencia, (v) => setTelEmergencia(maskPhone(TEL_PAIS, v)), "Tel. de emergencia (8 dígitos)")}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm text-rose-600 leading-relaxed">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-[0.12em] py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "CREANDO..." : "Registrarme"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
        <span>¿Ya tenés cuenta? </span>
        <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors font-semibold">Ingresar</Link>
      </div>
    </AccessWrap>
  );
}
