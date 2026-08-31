const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function toSafeEvent(e) {
  return {
    id: e.id,
    nombre: e.nombre ?? "Evento",
    fechaInicio: e.fechaInicio ?? e.fecha_inicio ?? null,
    fechaFin: e.fechaFin ?? e.fecha_fin ?? null,
    organizador: e.organizador ?? e.campeonato?.nombre ?? "MWT",
    logoUrl: e.logoUrl ?? null,
  };
}

export async function getProximosEventos(limit = 4) {
  try {
    const res = await fetch(`${API_URL}/api/public/eventos?limit=${limit}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const items =
      (Array.isArray(data) && data) ||
      data?.items ||
      data?.elementos ||
      data?.data ||
      [];

    return Array.isArray(items) ? items.map(toSafeEvent) : [];
  } catch {
    return [];
  }
}

export async function getPublicInscripciones() {
  try {
    const res = await fetch(`${API_URL}/api/public/inscripciones`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const items = (Array.isArray(data) && data) || data?.items || data?.elementos || data?.data || [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function getPublicStats() {
  try {
    const res = await fetch(`${API_URL}/api/public/stats`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getInscripcionOptions(eventoId = "", pilotoId = "") {
  try {
    const params = new URLSearchParams();
    if (eventoId) params.set("evento_id", eventoId);
    if (pilotoId) params.set("piloto_id", pilotoId);

    const url = `${API_URL}/api/public/inscripciones/options${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, { credentials: "include" });

    if (!res.ok) return { eventos: [], categorias: [], pilotos: [], motocicletas: [], marcas: [], seleccionado: { eventoId: null, campeonatoId: null, pilotoId: null } };

    const data = await res.json();
    return {
      eventos: Array.isArray(data.eventos) ? data.eventos : [],
      categorias: Array.isArray(data.categorias) ? data.categorias : [],
      pilotos: Array.isArray(data.pilotos) ? data.pilotos : [],
      motocicletas: Array.isArray(data.motocicletas) ? data.motocicletas : [],
      marcas: Array.isArray(data.marcas) ? data.marcas : [],
      seleccionado: data.seleccionado || { eventoId: null, campeonatoId: null, pilotoId: null },
    };
  } catch {
    return { eventos: [], categorias: [], pilotos: [], motocicletas: [], marcas: [], seleccionado: { eventoId: null, campeonatoId: null, pilotoId: null } };
  }
}