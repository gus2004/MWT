"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Mail, CheckCircle2 } from "lucide-react";
import AccessWrap from "@/components/AccessWrap";

const FIELD = "flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 sm:py-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all";
const INPUT = "flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-[15px] font-semibold";
const BTN = "w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-[0.12em] py-4 transition-all";

export default function RecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const send = (e) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }
    setStep(2);
  };

  const finish = () => {
    setStep(3);
  };

  return (
    <AccessWrap
      title="Recuperar contraseña"
      sub={step === 1 ? "Ingresá tu correo para restablecerla" : step === 2 ? "Último paso" : "Listo"}
      onBack={() => router.push("/login")}
    >
      {step === 1 ? (
        <form onSubmit={send} className="space-y-4">
          <div className={FIELD}>
            <Mail size={18} className="text-slate-400 shrink-0" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo electrónico"
              type="email"
              autoComplete="email"
              required
              className={INPUT}
            />
          </div>

          {error ? (
            <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm text-rose-600 leading-relaxed">{error}</p>
          ) : null}

          <button
            type="submit"
            className={BTN}
          >
            Enviar código
            <ChevronRight size={16} />
          </button>
        </form>
      ) : step === 2 ? (
        <div className="space-y-4">
          <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
            Hemos enviado un enlace a <strong className="text-slate-900">{email}</strong>. Hacé clic en el enlace y seguí los pasos
            o usá el botón siguiente para simular el restablecimiento en este prototipo.
          </p>
          <button
            onClick={finish}
            className={BTN}
          >
            Restablecer contraseña
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 font-semibold transition-colors">
            <ChevronLeft size={15} /> Corregir correo
          </button>
        </div>
      ) : (
        <div className="text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 mb-1">Contraseña restablecida</p>
            <p className="text-sm text-slate-500">Ya podés ingresar con tu nueva credencial.</p>
          </div>
          <Link
            href="/login"
            className="block w-full rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-[0.12em] py-4 transition-all"
          >
            Ir a ingresar
          </Link>
        </div>
      )}
    </AccessWrap>
  );
}