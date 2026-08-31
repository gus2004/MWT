// Utilidades de formato y validación reutilizables.

// ---------------------------------------------------------------------------
// Texto (nombres, apellidos, ciudades, marcas, etc.)
// ---------------------------------------------------------------------------

// Normaliza un texto: espacios simples, primera letra de cada palabra en mayúscula.
export function normalizeTitleCase(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

// Mantiene solo letras (incl. acentos) y espacios; bloquea números/símbolos.
export function onlyLetters(value, maxLength = 60) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function isValidName(value) {
  return /^[\p{L}][\p{L}\s']{1,59}$/u.test((value || "").trim());
}

// ---------------------------------------------------------------------------
// CUI / DPI (Guatemala): 13 dígitos
// ---------------------------------------------------------------------------

// Deja solo dígitos, formato 0000 00000 0000 con espacios.
export function formatCui(value) {
  if (value === null || value === undefined) return "";
  const digits = String(value).replace(/\D/g, "").slice(0, 13);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 9));
  if (digits.length > 9) parts.push(digits.slice(9, 13));
  return parts.join(" ");
}

export function isValidCui(value) {
  return /^\d{13}$/.test((value || "").replace(/\s/g, ""));
}

// ---------------------------------------------------------------------------
// Números (dorsal, año, vueltas, cilindrada, monto, etc.)
// ---------------------------------------------------------------------------

export function onlyDigits(value, maxLength = 12) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "").slice(0, maxLength);
}

export function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------------
// Teléfono: máscara por país + validación de dígitos
// ---------------------------------------------------------------------------

// País clave primaria (primero que se preselecciona).
export const DEFAULT_COUNTRY = "GT";

export const COUNTRIES = [
  { code: "GT", name: "Guatemala", dial: "+502", national: 8, local: /^(?:[2-8]\d{7})$/, placeholder: "0000 0000", mask: (d) => `${d.slice(0, 4)} ${d.slice(4)}`.trim() },
  { code: "SV", name: "El Salvador", dial: "+503", national: 8, local: /^(?:[267]\d{7})$/, placeholder: "0000 0000", mask: (d) => `${d.slice(0, 4)} ${d.slice(4)}`.trim() },
  { code: "HN", name: "Honduras", dial: "+504", national: 8, local: /^(?:[2389]\d{7})$/, placeholder: "0000 0000", mask: (d) => `${d.slice(0, 4)} ${d.slice(4)}`.trim() },
  { code: "NI", name: "Nicaragua", dial: "+505", national: 8, local: /^(?:[2578]\d{7})$/, placeholder: "0000 0000", mask: (d) => `${d.slice(0, 4)} ${d.slice(4)}`.trim() },
  { code: "CR", name: "Costa Rica", dial: "+506", national: 8, local: /^(?:[2-8]\d{7})$/, placeholder: "0000 0000", mask: (d) => `${d.slice(0, 4)} ${d.slice(4)}`.trim() },
  { code: "PA", name: "Panamá", dial: "+507", national: 8, local: /^(?:[2-8]\d{7})$/, placeholder: "0000 0000", mask: (d) => `${d.slice(0, 4)} ${d.slice(4)}`.trim() },
  { code: "MX", name: "México", dial: "+52", national: 10, local: /^(?:[1-9]\d{9})$/, placeholder: "00 0000 0000", mask: (d) => `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`.trim() },
  { code: "US", name: "Estados Unidos", dial: "+1", national: 10, local: /^(?:[1-9]\d{9})$/, placeholder: "(000) 000-0000", mask: (d) => (d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d) },
];

/**
 * Separar un número de teléfono que ya trae prefijo (ej. "+50212345678").
 * Devuelve { code, number } o null si no matchea ningún país.
 */
export function splitPhone(raw, countryCode = null) {
  if (!raw) return { code: countryCode || DEFAULT_COUNTRY, number: "" };
  const cleaned = String(raw).replace(/^\+/, "").replace(/[\s()-]/g, "").replace(/^0+/, "");
  if (countryCode) {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country && cleaned.startsWith(country.dial.replace("+", ""))) {
      return { code: country.code, number: cleaned.slice(country.dial.length - 1) };
    }
  }
  for (const c of COUNTRIES) {
    if (cleaned.startsWith(c.dial.replace("+", ""))) {
      return { code: c.code, number: cleaned.slice(c.dial.length - 1) };
    }
  }
  const last = cleaned.slice(-8);
  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY);
  return { code: country.code, number: last || "" };
}

/**
 * Aplica máscara al número local según país.
 */
export function maskPhone(countryCode, value) {
  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const digits = onlyDigits(value, Math.max(8, country.national)).slice(0, country.national);
  return country.mask(digits);
}

export function isValidPhone(countryCode, value) {
  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const digits = String(value || "").replace(/\D/g, "");
  return country.local.test(digits);
}

export function fullPhone(countryCode, value) {
  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const digits = String(value || "").replace(/\D/g, "");
  return `${country.dial}${digits}`;
}

// ---------------------------------------------------------------------------
// Fecha
// ---------------------------------------------------------------------------

export function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export function isValidDate(value) {
  if (!value) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

export function isDateInPast(value) {
  if (!isValidDate(value)) return false;
  return new Date(`${value}T00:00:00`) < new Date(new Date().toDateString());
}

export function isDateInFuture(value) {
  if (!isValidDate(value)) return false;
  return new Date(`${value}T00:00:00`) > new Date(new Date().toDateString());
}

// Rango de años válido para vehículos.
export function validYearRange() {
  const current = new Date().getFullYear();
  return { min: current - 45, max: current + 1 };
}

// ---------------------------------------------------------------------------
// Correo
// ---------------------------------------------------------------------------

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((value || "").trim());
}
