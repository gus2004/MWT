"use client";

import { useEffect, useState } from "react";
import { Field, inputCls, selectCls } from "@/components/kit";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  maskPhone,
  normalizeTitleCase,
  onlyLetters,
  onlyDigits,
  formatCui,
  fullPhone,
  validYearRange,
  normalizeDate,
} from "@/lib/formats";

// Exit mode: cuándo aplicar el autoformato/validación.
const MODE = { OFF: "off", CHANGE: "change", BLUR: "blur", ON: "on" };

function useFormatted(initial, formatter, maxLength) {
  const [value, setValue] = useState(initial || "");
  const onChange = (v) => setValue(formatter ? formatter(v, maxLength) : v);
  return [value, onChange, setValue];
}

export function NameField({ name, label = "Nombre", defaultValue = "", required = false, maxLength = 60 }) {
  const [value, setValue] = useState(defaultValue || "");
  const [error, setError] = useState("");
  const validate = () => {
    const v = value.trim();
    if (!v) { setError(required ? "Este campo es obligatorio." : ""); return; }
    if (!/[\p{L}]/u.test(v)) { setError("Solo se permiten letras."); return; }
    setError("");
  };
  return (
    <Field label={label} error={error}>
      <input
        name={name}
        className={inputCls}
        value={value}
        onChange={(e) => setValue(onlyLetters(e.target.value, maxLength))}
        onBlur={() => { setValue(normalizeTitleCase(value)); validate(); }}
        required={required}
        maxLength={maxLength}
        autoComplete="off"
      />
    </Field>
  );
}

export function TextField({
  name, label, defaultValue = "", required = false, maxLength = 100,
  title = false, lettersOnly = false, digitsOnly = false, placeholder,
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [error, setError] = useState("");
  const apply = (v) => {
    let out = v;
    if (digitsOnly) out = onlyDigits(v, maxLength);
    else if (lettersOnly) out = onlyLetters(v, maxLength);
    else out = String(v).slice(0, maxLength);
    return out;
  };
  const onBlur = () => {
    if (title) setValue(normalizeTitleCase(value));
    if (required && !value.trim()) setError("Este campo es obligatorio.");
    else setError("");
  };
  return (
    <Field label={label} error={error}>
      <input
        name={name}
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(apply(e.target.value))}
        onBlur={onBlur}
        required={required}
        maxLength={maxLength}
      />
    </Field>
  );
}

export function TelField({
  name, label = "Teléfono", defaultValue = "", countryDefault = DEFAULT_COUNTRY,
  required = false,
}) {
  const parsed = (() => {
    const digits = String(defaultValue || "").replace(/\D/g, "");
    const codeGuess = digits.startsWith(countryDefault.replace("GT", "")) ? DEFAULT_COUNTRY : countryDefault;
    return { code: countryDefault, number: digits };
  })();
  const [country, setCountry] = useState(parsed.code);
  const [number, setNumber] = useState(maskPhone(parsed.code, parsed.number));
  const [error, setError] = useState("");

  const active = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  const onValidate = () => {
    const digits = number.replace(/\D/g, "");
    if (!digits) { setError(required ? "Este campo es obligatorio." : ""); return; }
    setError(digits.length === active.national ? "" : `El número debe tener ${active.national} dígitos.`);
  };

  return (
    <Field label={label} error={error}>
      <div className="flex gap-2">
        <select
          className={`${selectCls.replace(" w-full", "").trim()} shrink-0`}
          style={{ width: 132 }}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Código de país"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.dial} {c.name}</option>
          ))}
        </select>
        <input
          name={name}
          className={inputCls}
          value={number}
          placeholder={active.placeholder}
          inputMode="tel"
          onChange={(e) => setNumber(maskPhone(country, e.target.value))}
          onBlur={onValidate}
          required={required}
        />
      </div>
      <input type="hidden" name={name ? `${name}_pais` : undefined} value={country} />
      <input type="hidden" name={name ? `${name}_completo` : undefined} value={fullPhone(country, number)} />
    </Field>
  );
}

export function CuiField({ name, label = "CUI / DPI", defaultValue = "", required = false }) {
  const [value, setValue] = useState(formatCui(defaultValue || ""));
  const [error, setError] = useState("");
  return (
    <Field label={label} error={error} hint="13 dígitos (formato 0000 00000 0000)">
      <input
        name={name}
        className={inputCls}
        value={value}
        inputMode="numeric"
        placeholder="0000 00000 0000"
        onChange={(e) => setValue(formatCui(e.target.value))}
        onBlur={() => {
          const digits = value.replace(/\s/g, "");
          if (!digits) setError(required ? "Este campo es obligatorio." : "");
          else if (digits.length !== 13) setError("El CUI debe tener 13 dígitos.");
          else setError("");
        }}
        required={required}
        maxLength={17}
      />
    </Field>
  );
}

export function NumberField({
  name, label, defaultValue = "", required = false, min, max, maxLength = 6,
  prefix, suffix,
}) {
  const [value, setValue] = useState(String(defaultValue ?? ""));
  const [error, setError] = useState("");
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-2">
        {prefix ? <span className="text-xs text-slate-500 font-bold shrink-0">{prefix}</span> : null}
        <input
          name={name}
          className={inputCls}
          value={value}
          inputMode="numeric"
          placeholder={min !== undefined && max !== undefined ? `${min}–${max}` : undefined}
          onChange={(e) => setValue(onlyDigits(e.target.value, maxLength))}
          onBlur={() => {
            const n = value ? Number(value) : null;
            if (!value) { setError(required ? "Este campo es obligatorio." : ""); return; }
            if (!Number.isFinite(n)) { setError("Ingrese un número válido."); return; }
            if (min !== undefined && n < min) setError(`Mínimo ${min}.`);
            else if (max !== undefined && n > max) setError(`Máximo ${max}.`);
            else setError("");
          }}
          required={required}
        />
        {suffix ? <span className="text-xs text-slate-500 font-bold shrink-0">{suffix}</span> : null}
      </div>
    </Field>
  );
}

export function YearField({ name, label = "Año", defaultValue = "", required = false }) {
  const { min, max } = validYearRange();
  return (
    <NumberField
      name={name}
      label={label}
      defaultValue={defaultValue}
      required={required}
      min={min}
      max={max}
      maxLength={4}
      prefix={undefined}
    />
  );
}

export function DateField({ name, label = "Fecha", defaultValue = "", required = false, future = false, past = false }) {
  const [value, setValue] = useState(normalizeDate(defaultValue));
  const [error, setError] = useState("");
  return (
    <Field label={label} error={error}>
      <input
        name={name}
        type="date"
        className={inputCls}
        value={value}
        max={future ? undefined : new Date().toISOString().slice(0, 10)}
        min={past ? undefined : undefined}
        onChange={(e) => setValue(normalizeDate(e.target.value))}
        onBlur={() => {
          if (!value) { setError(required ? "Este campo es obligatorio." : ""); return; }
          const d = new Date(`${value}T00:00:00`);
          if (Number.isNaN(d.getTime())) { setError("Fecha inválida."); return; }
          if (past && d >= new Date(new Date().toDateString())) setError("La fecha debe ser anterior a hoy.");
          else if (future && d < new Date(new Date().toDateString())) setError("La fecha debe ser posterior a hoy.");
          else setError("");
        }}
        required={required}
      />
    </Field>
  );
}

// Convierte el nombre de un campo de teléfono a su valor completo para el payload.
export { fullPhone };
