const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )mwt_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
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
    throw new Error(data?.message || "No se pudo completar la operación.");
  }

  return data;
}

export async function listClasificaciones(filters = {}) {
  const params = new URLSearchParams();
  if (filters.campeonatoId) params.set("campeonatoId", filters.campeonatoId);
  if (filters.categoriaId) params.set("categoriaId", filters.categoriaId);

  const data = await request(`/api/clasificaciones${params.toString() ? `?${params.toString()}` : ""}`);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createClasificacion(payload) {
  return request("/api/clasificaciones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateClasificacion(id, payload) {
  return request(`/api/clasificaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteClasificacion(id) {
  return request(`/api/clasificaciones/${id}`, {
    method: "DELETE",
  });
}

export async function saveClasificacionTiempoEvento(eventoId, payload) {
  return request(`/api/clasificaciones/evento/${eventoId}/tiempo`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getParrillaEventoCategoria(eventoId, categoriaId) {
  const data = await request(`/api/clasificaciones/evento/${eventoId}/parrilla?categoria_id=${encodeURIComponent(categoriaId)}`);
  return Array.isArray(data?.items) ? data.items : [];
}