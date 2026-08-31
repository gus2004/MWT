import prisma from '../../prisma.config';

type CrearEventoInput = {
  nombre: string;
  campeonato_id: string;
  circuito_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  usuario_id: string;
};

type CambiarEstadoInput = {
  evento_id: string;
  estado_nuevo: string;
  usuario_id: string;
};

type CrearCronogramaInput = {
  evento_id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion?: string;
  es_pista: boolean;
};

const TRANSICIONES: Record<string, string[]> = {
  BORRADOR: ['ABIERTO'],
  ABIERTO: ['EN_CURSO', 'CANCELADO'],
  EN_CURSO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
};

export async function crearEvento(input: CrearEventoInput) {
  const campeonato = await prisma.campeonato.findFirst({
    where: { id: input.campeonato_id, esta_activo: true },
    select: { id: true },
  });
  if (!campeonato) throw new Error('El campeonato no existe o está inactivo.');

  const circuito = await prisma.circuito.findFirst({
    where: { id: input.circuito_id, esta_activo: true },
    select: { id: true },
  });
  if (!circuito) throw new Error('El circuito no existe o está inactivo.');

  const fechaInicio = input.fecha_inicio ? new Date(input.fecha_inicio) : new Date();
  const fechaFin = input.fecha_fin ? new Date(input.fecha_fin) : fechaInicio;

  const evento = await prisma.evento.create({
    data: {
      nombre: input.nombre.trim(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: 'BORRADOR',
      campeonato: { connect: { id: input.campeonato_id } },
      circuito: { connect: { id: input.circuito_id } },
    },
  });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_id,
      tabla_afectada: 'eventos',
      accion: 'INSERT',
      registro_id: evento.id,
      valor_nuevo: {
        id: evento.id,
        nombre: evento.nombre,
        campeonato_id: input.campeonato_id,
        circuito_id: input.circuito_id,
        estado: evento.estado,
        // convertir fechas a ISO para que sean JSON-validas en campo Json
        fecha_inicio: evento.fecha_inicio instanceof Date ? evento.fecha_inicio.toISOString() : evento.fecha_inicio,
        fecha_fin: evento.fecha_fin instanceof Date ? evento.fecha_fin.toISOString() : evento.fecha_fin,
      },
    },
  });

  return evento;
}

export async function listarEventos(estado?: string) {
  return prisma.evento.findMany({
    // casteamos el estado al tipo esperado por Prisma para evitar errores TS
    where: estado ? ({ estado: estado as any } as any) : undefined,
    include: {
      campeonato: true,
      circuito: true,
    },
    orderBy: [{ fecha_inicio: 'desc' }, { nombre: 'asc' }],
  });
}

export async function obtenerEvento(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: {
      campeonato: true,
      circuito: true,
    },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  const categorias = await prisma.categoria.findMany({
    where: { campeonato_id: evento.campeonato_id },
    orderBy: { nombre: 'asc' },
  });

  const registros = await prisma.inscripcion.findMany({
    where: {
      evento_id: eventoId,
      categoria_id: {
        in: categorias.map((c) => c.id),
      },
    },
    select: {
      categoria_id: true,
    },
  });

  const conteoPorCategoria = registros.reduce<Record<string, number>>((acc, item) => {
    acc[item.categoria_id] = (acc[item.categoria_id] || 0) + 1;
    return acc;
  }, {});

  return {
    ...evento,
    categorias: categorias.map((c) => ({
      ...c,
      total_inscritos: conteoPorCategoria[c.id] || 0,
    })),
  };
}

export async function cambiarEstadoEvento(input: CambiarEstadoInput) {
  const evento = await prisma.evento.findUnique({
    where: { id: input.evento_id },
    select: { id: true, estado: true },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  const actual = evento.estado;
  const nuevo = input.estado_nuevo;
  const permitidos = TRANSICIONES[actual] || [];

  if (!permitidos.includes(nuevo)) {
    throw new Error(`Transición no permitida: ${actual} -> ${nuevo}.`);
  }

  const actualizado = await prisma.evento.update({
    where: { id: input.evento_id },
    // casteamos estado para cumplir el tipo generado por Prisma
    data: { estado: nuevo as any },
  });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_id,
      tabla_afectada: 'eventos',
      accion: 'UPDATE',
      registro_id: input.evento_id,
      // Aseguramos valores JSON-serializables (strings)
      valor_anterior: { estado: String(actual) },
      valor_nuevo: { estado: String(nuevo) },
    },
  });

  return actualizado;
}

export async function crearActividadCronograma(input: CrearCronogramaInput) {
  const evento = await prisma.evento.findUnique({
    where: { id: input.evento_id },
    select: { id: true },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  return prisma.actividadCronograma.create({
    data: {
      evento_id: input.evento_id,
      nombre: input.nombre.trim(),
      hora_inicio: new Date(input.hora_inicio),
      hora_fin: new Date(input.hora_fin),
      descripcion: input.descripcion?.trim() || null,
      es_pista: input.es_pista,
    },
  });
}

export async function listarCronograma(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { id: true },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  return prisma.actividadCronograma.findMany({
    where: { evento_id: eventoId },
    orderBy: { hora_inicio: 'asc' },
  });
}

// -------------------------
// Categorías por evento
// -------------------------

type CrearCategoriaEventoInput = {
  evento_id: string;
  nombre: string;
  cilindrada_min: number;
  cilindrada_max: number;
  descripcion?: string;
  precio_inscripcion?: number;
  usuario_id: string;
};

type ActualizarCategoriaEventoInput = {
  evento_id: string;
  categoria_id: string;
  nombre?: string;
  cilindrada_min?: number;
  cilindrada_max?: number;
  descripcion?: string;
  precio_inscripcion?: number;
  usuario_id: string;
};

type EliminarCategoriaEventoInput = {
  evento_id: string;
  categoria_id: string;
  usuario_id: string;
};

export async function listarCategoriasDeEvento(eventoId: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true, campeonato_id: true } });
  if (!evento) throw new Error('Evento no encontrado.');

  const categorias = await prisma.categoria.findMany({ where: { campeonato_id: evento.campeonato_id }, orderBy: { nombre: 'asc' } });

  const registros = await prisma.inscripcion.findMany({ where: { evento_id: eventoId, categoria_id: { in: categorias.map((c) => c.id) } }, select: { categoria_id: true } });

  const conteoPorCategoria = registros.reduce<Record<string, number>>((acc, item) => {
    acc[item.categoria_id] = (acc[item.categoria_id] || 0) + 1;
    return acc;
  }, {});

  return categorias.map((c) => ({ ...c, total_inscritos: conteoPorCategoria[c.id] || 0 }));
}

export async function crearCategoriaParaEvento(input: CrearCategoriaEventoInput) {
  const evento = await prisma.evento.findUnique({ where: { id: input.evento_id }, select: { id: true, campeonato_id: true } });
  if (!evento) throw new Error('Evento no encontrado.');

  const categoria = await prisma.categoria.create({
    data: {
      campeonato_id: evento.campeonato_id,
      nombre: input.nombre.trim(),
      cilindrada_min: input.cilindrada_min,
      cilindrada_max: input.cilindrada_max,
      descripcion: input.descripcion ?? null,
      precio_inscripcion: input.precio_inscripcion ?? 0.0,
    },
  });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_id,
      tabla_afectada: 'categorias',
      accion: 'INSERT',
      registro_id: categoria.id,
      valor_nuevo: {
        id: categoria.id,
        nombre: categoria.nombre,
        campeonato_id: categoria.campeonato_id,
      },
    },
  });

  return categoria;
}

export async function actualizarCategoriaEnEvento(input: ActualizarCategoriaEventoInput) {
  const evento = await prisma.evento.findUnique({ where: { id: input.evento_id }, select: { id: true, campeonato_id: true } });
  if (!evento) throw new Error('Evento no encontrado.');

  const categoria = await prisma.categoria.findUnique({ where: { id: input.categoria_id } });
  if (!categoria) throw new Error('Categoría no encontrada.');

  if (categoria.campeonato_id !== evento.campeonato_id) throw new Error('La categoría no pertenece al campeonato del evento.');

  const actualizado = await prisma.categoria.update({
    where: { id: input.categoria_id },
    data: {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.cilindrada_min !== undefined ? { cilindrada_min: input.cilindrada_min } : {}),
      ...(input.cilindrada_max !== undefined ? { cilindrada_max: input.cilindrada_max } : {}),
      ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
      ...(input.precio_inscripcion !== undefined ? { precio_inscripcion: input.precio_inscripcion } : {}),
    },
  });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_id,
      tabla_afectada: 'categorias',
      accion: 'UPDATE',
      registro_id: input.categoria_id,
      valor_nuevo: actualizado,
    },
  });

  return actualizado;
}

export async function eliminarCategoriaDeEvento(input: EliminarCategoriaEventoInput) {
  const evento = await prisma.evento.findUnique({ where: { id: input.evento_id }, select: { id: true, campeonato_id: true } });
  if (!evento) throw new Error('Evento no encontrado.');

  const categoria = await prisma.categoria.findUnique({ where: { id: input.categoria_id } });
  if (!categoria) throw new Error('Categoría no encontrada.');

  if (categoria.campeonato_id !== evento.campeonato_id) throw new Error('La categoría no pertenece al campeonato del evento.');

  const asociados = await prisma.inscripcion.findFirst({ where: { evento_id: input.evento_id, categoria_id: input.categoria_id }, select: { id: true } });
  if (asociados) throw new Error('No se puede eliminar la categoría porque existen inscripciones asociadas.');

  await prisma.categoria.delete({ where: { id: input.categoria_id } });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_id,
      tabla_afectada: 'categorias',
      accion: 'DELETE',
      registro_id: input.categoria_id,
    },
  });

  return true;
}
