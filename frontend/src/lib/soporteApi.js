const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )mwt_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mwt_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function requestFormData(path, formData) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      // Sin Content-Type: el navegador lo fija con el boundary del multipart.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const error = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

/** URL absoluta de un archivo de evidencia servido por el backend. */
export function fileUrl(rutaArchivo) {
  if (!rutaArchivo) return "";
  if (String(rutaArchivo).startsWith("http")) return rutaArchivo;
  return `${API_URL}${rutaArchivo}`;
}

/** Descarga binaria autenticada (blob) de reportes: CSV / PDF del comisariato. */
export async function descargarReporteComisariato(eventoId, formato) {
  const token = getToken();
  const qs = eventoId ? `?evento_id=${encodeURIComponent(eventoId)}` : "";
  const res = await fetch(`${API_URL}/api/soporte/comisariato/export/${formato}${qs}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      message = j?.message || message;
    } catch { /* respuesta binaria */ }
    throw new Error(message);
  }
  return res.blob();
}

/** Nombre del archivo desde el header Content-Disposition del backend. */
export function nombreDesdeHeader(res) {
  const cd = res.headers?.get?.("content-disposition") || "";
  const m = cd.match(/filename="?([^"]+)"?/i);
  return m ? m[1] : null;
}

export const soporteApi = {
  // Sanciones
  listSanciones: () => request("/api/soporte/sanciones").then((d) => d?.items || []),
  createSancion: (payload) => request("/api/soporte/sanciones", { method: "POST", body: JSON.stringify(payload) }),
  updateSancion: (id, payload) => request(`/api/soporte/sanciones/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // Tipos de sanción
  listTiposSancion: () => request("/api/soporte/tipos-sancion").then((d) => d?.items || []),

  // Apelaciones
  listApelaciones: () => request("/api/soporte/apelaciones").then((d) => d?.items || []),
  createApelacion: (payload) => request("/api/soporte/apelaciones", { method: "POST", body: JSON.stringify(payload) }),
  updateApelacion: (id, payload) => request(`/api/soporte/apelaciones/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // Revisión técnica
  listItemsChecklist: () => request("/api/soporte/items-checklist").then((d) => d?.items || []),
  listRevisionesTecnicas: () => request("/api/soporte/revisiones-tecnicas").then((d) => d?.items || []),
  updateRevisionTecnica: (id, payload) => request(`/api/soporte/revisiones-tecnicas/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // Notificaciones
  listNotificaciones: () => request("/api/soporte/notificaciones").then((d) => d?.items || []),
  createNotificacion: (payload) => request("/api/soporte/notificaciones", { method: "POST", body: JSON.stringify(payload) }),
  markNotificacionLeida: (id, leida = true) => request(`/api/soporte/notificaciones/${id}`, { method: "PATCH", body: JSON.stringify({ leida }) }),

  // Plantillas
  listPlantillas: () => request("/api/soporte/plantillas").then((d) => d?.items || []),
  savePlantilla: (payload) => request("/api/soporte/plantillas", { method: "POST", body: JSON.stringify(payload) }),

  // Preferencias
  listPreferencias: () => request("/api/soporte/preferencias").then((d) => d?.items || []),
  updatePreferencia: (clave, valor) => request(`/api/soporte/preferencias/${clave}`, { method: "PUT", body: JSON.stringify({ valor }) }),

  // Auditoría
  listAuditoria: () => request("/api/soporte/auditoria").then((d) => d?.items || []),

  // Reportes
  getResumenReportes: () => request("/api/soporte/reportes/resumen"),

  // Asistente IA del comisariato
  calificarIA: (payload) => request("/api/soporte/ia/calificar", { method: "POST", body: JSON.stringify(payload) }),

  // ── Reglamento del evento en PDF (el sistema LO LEE y carga sus artículos) ──
  subirReglamentoPdf: (file, eventoId) => {
    const fd = new FormData();
    fd.append("archivo", file);
    fd.append("evento_id", eventoId);
    return requestFormData("/api/soporte/reglamento/pdf", fd);
  },
  listReglamentoDocumentos: () => request("/api/soporte/reglamento/documentos").then((d) => d?.items || []),
  borrarReglamentoPdf: (eventoId) => request(`/api/soporte/reglamento/pdf/${eventoId}`, { method: "DELETE" }),
  alertasIA: () => request("/api/soporte/ia/alertas").then((d) => d?.items || []),
  usoIA: () => request("/api/soporte/ia/uso").then((d) => d || { total: 0, iaCount: 0, localCount: 0, porcentaje: 0 }),

  // Catálogo del reglamento (alimenta la sugerencia de artículo de la IA)
  listReglamento: () => request("/api/soporte/reglamento").then((d) => d?.items || []),
  createArticuloReglamento: (payload) => request("/api/soporte/reglamento", { method: "POST", body: JSON.stringify(payload) }),
  deleteArticuloReglamento: (id) => request(`/api/soporte/reglamento/${id}`, { method: "DELETE" }),

  // Evidencias de incidencias (imágenes/videos: solo respaldo, sin análisis IA)
  subirEvidencia: (archivo, inscripcionId) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    if (inscripcionId) fd.append("inscripcion_id", inscripcionId);
    return requestFormData("/api/soporte/evidencias", fd);
  },
  listEvidencias: (opt = {}) => {
    const qs = new URLSearchParams();
    if (opt.inscripcion_id) qs.set("inscripcion_id", opt.inscripcion_id);
    if (opt.sancion_id) qs.set("sancion_id", opt.sancion_id);
    if (opt.soloSinSancion) qs.set("soloSinSancion", "1");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/api/soporte/evidencias${suffix}`).then((d) => d?.items || []);
  },
  borrarEvidencia: (id) => request(`/api/soporte/evidencias/${id}`, { method: "DELETE" }),

  // Resumen estructurado del comisariato por evento (CSV y PDF vía descargarReporteComisariato)
  resumenComisariato: (eventoId) =>
    request(`/api/soporte/comisariato/resumen${eventoId ? `?evento_id=${encodeURIComponent(eventoId)}` : ""}`),
};

export default soporteApi;