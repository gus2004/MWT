"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import AccessWrap from "@/components/AccessWrap";
import { getToken, loginRequest, setAuthSession } from "@/lib/auth";

const FIELD = "flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 sm:py-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all";
const INPUT = "flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-[15px] font-semibold";
const BTN = "w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-[0.12em] py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token, user } = await loginRequest({ username: email, password });
      setAuthSession(token, user, remember);

      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      router.replace(next || "/dashboard");
    } catch {
      setError("El usuario o la contraseña no son correctas. Inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessWrap
      title="Ingresar"
      sub="Acceso exclusivo para personal autorizado"
      onBack={() => router.push("/")}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className={FIELD}>
          <Mail size={18} className="text-slate-400 shrink-0" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario o correo electrónico"
            autoComplete="email"
            required
            className={INPUT}
          />
        </div>

        <div className={FIELD}>
          <Lock size={18} className="text-slate-400 shrink-0" />
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña"
            autoComplete="current-password"
            required
            className={INPUT}
          />
          <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5" tabIndex={-1}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error ? (
          <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm text-rose-600 leading-relaxed whitespace-pre-line">
            {error}
          </p>
        ) : null}

        <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-blue-600 w-4 h-4"
          />
          recordarme en este equipo
        </label>

        <button
          type="submit"
          disabled={loading}
          className={BTN}
        >
          {loading ? "INGRESANDO..." : "Ingresar"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-slate-200 text-center text-sm text-slate-500 space-y-2">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href="/recovery" className="text-slate-600 hover:text-blue-600 font-semibold transition-colors">¿Olvidaste tu contraseña?</Link>
          <Link href="/register" className="text-slate-600 hover:text-blue-600 font-semibold transition-colors">Crear cuenta</Link>
        </div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Sistema MWT · Acceso restringido</p>
      </div>
    </AccessWrap>
  );
}