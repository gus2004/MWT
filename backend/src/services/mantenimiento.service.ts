import prisma from '../../prisma.config';

export async function createMarca(input: { nombre: string }) {
  const nombre = input.nombre.trim();

  const existing = await prisma.marcaMoto.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });

  if (existing) {
    throw new Error('Ya existe una marca con ese nombre.');
  }

  return prisma.marcaMoto.create({
    data: { nombre },
  });
}

export async function listMarcas() {
  return prisma.marcaMoto.findMany({
    orderBy: { nombre: 'asc' },
  });
}

export async function createCampeonato(input: { nombre: string; anio: number; descripcion?: string }) {
  return prisma.campeonato.create({
    data: {
      nombre: input.nombre.trim(),
      anio: input.anio,
      descripcion: input.descripcion?.trim() || null,
      esta_activo: true,
    },
  });
}

export async function listCampeonatosActivos() {
  return prisma.campeonato.findMany({
    where: { esta_activo: true },
    orderBy: [{ anio: 'desc' }, { nombre: 'asc' }],
  });
}

export async function createCategoria(input: {
  campeonato_id: string;
  nombre: string;
  cilindrada_min: number;
  cilindrada_max: number;
  descripcion?: string;
  precio_inscripcion?: number;
}) {
  const campeonato = await prisma.campeonato.findUnique({
    where: { id: input.campeonato_id },
    select: { id: true },
  });

  if (!campeonato) {
    throw new Error('El campeonato especificado no existe.');
  }

  return prisma.categoria.create({
    data: {
      campeonato_id: input.campeonato_id,
      nombre: input.nombre.trim(),
      cilindrada_min: input.cilindrada_min,
      cilindrada_max: input.cilindrada_max,
      descripcion: input.descripcion?.trim() || null,
      precio_inscripcion: input.precio_inscripcion ?? 0,
    },
  });
}

export async function listCategoriasByCampeonato(campeonatoId: string) {
  return prisma.categoria.findMany({
    where: { campeonato_id: campeonatoId },
    orderBy: { nombre: 'asc' },
  });
}

export async function createCircuito(input: {
  nombre: string;
  ubicacion_url?: string;
  longitud_km?: number;
  numero_curvas?: number;
}) {
  const nombre = input.nombre.trim();

  const existing = await prisma.circuito.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });

  if (existing) {
    throw new Error('Ya existe un circuito con ese nombre.');
  }

  return prisma.circuito.create({
    data: {
      nombre,
      ubicacion_url: input.ubicacion_url?.trim() || null,
      longitud_km: input.longitud_km ?? null,
      numero_curvas: input.numero_curvas ?? null,
      esta_activo: true,
    },
  });
}

export async function listCircuitosActivos() {
  return prisma.circuito.findMany({
    where: { esta_activo: true },
    orderBy: { nombre: 'asc' },
  });
}
