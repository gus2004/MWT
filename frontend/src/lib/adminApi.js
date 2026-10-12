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

  // Try to read response as text then JSON for better error messages
  let text = null;
  try {
    text = await res.clone().text();
  } catch {
    text = null;
  }

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const serverMessage = (data && data.message) || (typeof text === 'string' && text.length ? text : res.statusText);
    const error = new Error(serverMessage || `HTTP ${res.status}`);
    error.status = res.status;
    error.details = data || text;
    throw error;
  }

  // Return parsed JSON if possible, otherwise raw text
  return data !== null ? data : text;
}

export async function listEventos() {
  return request('/api/eventos');
}

export async function publishEvento(payload) {
  try {
    return await request('/api/admin/eventos/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // If running in development, try the public (unauthenticated) publish route
    if (process.env.NODE_ENV !== 'production') {
      const res = await fetch(`${API_URL}/api/admin/eventos/publish/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let data = null;
        try { data = await res.json(); } catch {};
        throw new Error(data?.message || 'Error publicando evento (dev public).');
      }
      return res.json();
    }

    throw err;
  }
}

export async function saveDraftEvento(payload) {
  try {
    return await request('/api/admin/eventos/draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const res = await fetch(`${API_URL}/api/admin/eventos/draft/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let data = null;
        try { data = await res.json(); } catch {}
        throw new Error(data?.message || 'Error guardando borrador (dev public).');
      }
      return res.json();
    }

    throw err;
  }
}

export async function deleteEvento(eventoId) {
  try {
    return await request(`/api/admin/eventos/${eventoId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const res = await fetch(`${API_URL}/api/admin/eventos/${eventoId}/public`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        let data = null;
        try { data = await res.json(); } catch {}
        throw new Error(data?.message || 'Error eliminando evento (dev public).');
      }
      return res.json();
    }

    throw err;
  }
}

export async function createInscripcion(payload) {
  if (process.env.NODE_ENV !== 'production') {
    const res = await fetch(`${API_URL}/api/admin/inscripciones/create/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let data = null;
      try {
        data = await res.json();
      } catch {}
      throw new Error(data?.message || 'Error creando inscripcion (dev public).');
    }
    return res.json();
  }

  return request('/api/admin/inscripciones/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPiloto(payload) {
  return request('/api/pilotos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePiloto(pilotoId, usuarioId) {
  return request(`/api/pilotos/${pilotoId}`, {
    method: 'DELETE',
    body: JSON.stringify({ usuario_id: usuarioId }),
  });
}

export async function createMotocicleta(pilotoId, payload) {
  return request(`/api/pilotos/${pilotoId}/motocicletas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePiloto(pilotoId, payload) {
  return request(`/api/pilotos/${pilotoId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateInscripcion(inscripcionId, payload) {
  try {
    return await request(`/api/admin/inscripciones/${inscripcionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // In development try a few unauthenticated public route fallbacks
    if (process.env.NODE_ENV !== 'production') {
      const tryUrls = [
        `${API_URL}/api/admin/inscripciones/${inscripcionId}/public`,
        `${API_URL}/api/admin/inscripciones/${inscripcionId}/public`,
      ];

      let lastError = null;
      console.warn('[adminApi] updateInscripcion fallback attempts:', tryUrls);
      for (const url of tryUrls) {
        try {
          const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => null);
            lastError = new Error(txt || `HTTP ${res.status}`);
            continue;
          }
          return await res.json();
        } catch (e) {
          lastError = e;
          continue;
        }
      }
      throw lastError || err;
    }

    throw err;
  }
}

export async function deleteInscripcion(inscripcionId) {
  try {
    return await request(`/api/admin/inscripciones/${inscripcionId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const tryUrls = [
        `${API_URL}/api/admin/inscripciones/${inscripcionId}/public`,
        `${API_URL}/api/admin/inscripciones/${inscripcionId}/public`,
      ];

      let lastError = null;
      console.warn('[adminApi] deleteInscripcion fallback attempts:', tryUrls);
      for (const url of tryUrls) {
        try {
          const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => null);
            lastError = new Error(txt || `HTTP ${res.status}`);
            continue;
          }

          const text = await res.text();
          if (!text) return { ok: true };
          try {
            return JSON.parse(text);
          } catch {
            return { ok: true, raw: text };
          }
        } catch (e) {
          lastError = e;
          continue;
        }
      }

      throw lastError || err;
    }

    throw err;
  }
}

export async function getPilotoPublicDetail(pilotoId) {
  const res = await fetch(`${API_URL}/api/public/pilotos/${pilotoId}`);
  const raw = await res.text();
  if (!res.ok) {
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {}
    throw new Error(data?.error || data?.message || raw || 'No se pudo obtener el detalle del piloto.');
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
export async function listCampeonatos() {
  const res = await fetch(`${API_URL}/api/mantenimiento/campeonatos`, {
    headers: {
      Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}`,
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "No se pudieron cargar los campeonatos.");
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export async function listCircuitos() {
  const res = await fetch(`${API_URL}/api/mantenimiento/circuitos`, {
    headers: {
      Authorization: `Bearer ${typeof document !== "undefined" ? decodeURIComponent((document.cookie.match(/(^| )mwt_token=([^;]+)/) || [])[2] || "") : ""}`,
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "No se pudieron cargar los circuitos.");
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}
