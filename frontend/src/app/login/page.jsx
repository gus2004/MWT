"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import AccessWrap from "@/components/AccessWrap";
import { getToken, loginRequest, setAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50 focus-within:bg-white/[0.06] transition-all">
          <Mail size={15} className="text-slate-500 shrink-0" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario o correo electrónico"
            autoComplete="email"
            required
            className="flex-1 bg-transparent outline-none placeholder-slate-500 text-sm text-white font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-blue-400/50 focus-within:bg-white/[0.06] transition-all">
          <Lock size={15} className="text-slate-500 shrink-0" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña"
            autoComplete="current-password"
            required
            className="flex-1 bg-transparent outline-none placeholder-slate-500 text-sm text-white font-semibold"
          />
        </div>

        {error ? (
          <p className="rounded-[12px] border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300 leading-relaxed whitespace-pre-line">
            {error}
          </p>
        ) : null}

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-blue-500"
          />
          recordarme en este equipo
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-[0.12em] py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "INGRESANDO..." : "Ingresar"}
          <ArrowRight size={13} />
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-white/[0.06] text-center text-xs text-slate-500 space-y-2">
        <div className="flex justify-center gap-6">
          <Link href="/recovery" className="hover:text-slate-300 transition-colors">¿Olvidaste tu contraseña?</Link>
          <Link href="/register" className="hover:text-slate-300 transition-colors">Crear cuenta</Link>
        </div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-700">Sistema MWT · Acceso restringido</p>
      </div>
    </AccessWrap>
  );
}