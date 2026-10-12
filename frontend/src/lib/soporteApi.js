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
};

export default soporteApi;