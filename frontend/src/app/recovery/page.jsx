"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Mail, CheckCircle2 } from "lucide-react";
import AccessWrap from "@/components/AccessWrap";

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
        <form onSubmit={send} className="space-y-3">
          <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50 focus-within:bg-white/[0.06] transition-all">
            <Mail size={15} className="text-slate-500 shrink-0" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo electrónico"
              type="email"
              autoComplete="email"
              required
              className="flex-1 bg-transparent outline-none placeholder-slate-500 text-sm text-white font-semibold"
            />
          </div>

          {error ? (
            <p className="rounded-[12px] border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">{error}</p>
          ) : null}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-[0.12em] py-3.5 transition-all"
          >
            Enviar código
            <ChevronRight size={13} />
          </button>
        </form>
      ) : step === 2 ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Hemos enviado un enlace a <strong className="text-white">{email}</strong>. Hacé clic en el enlace y seguí los pasos
            o usá el botón siguiente para simular el restablecimiento en este prototipo.
          </p>
          <button
            onClick={finish}
            className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-[0.12em] py-3.5 transition-all"
          >
            Restablecer contraseña
            <ChevronRight size={13} />
          </button>
          <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft size={13} /> Corregir correo
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={26} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white mb-1">Contraseña restablecida</p>
            <p className="text-xs text-slate-400">Ya podés ingresar con tu nueva credencial.</p>
          </div>
          <Link
            href="/login"
            className="block w-full rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-[0.12em] py-3.5 transition-all"
          >
            Ir a ingresar
          </Link>
        </div>
      )}
    </AccessWrap>
  );
}