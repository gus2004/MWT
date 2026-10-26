import prisma from '../../prisma.config';

type CrearEventoInput = {
  nombre: string;
  campeonato_id: string;
  circuito_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  costo_base?: number;
  visible_portada?: boolean;
  usuario_id: string;
};

type ActualizarEventoInput = {
  evento_id: string;
  nombre?: string;
  campeonato_id?: string;
  circuito_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  costo_base?: number;
  visible_portada?: boolean;
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

type ActualizarCronogramaInput = {
  evento_id: string;
  actividad_id: string;
  nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  descripcion?: string;
  es_pista?: boolean;
};

/**
 * Valida que el rango de fechas sea coherente. Si el fin es anterior al
 * inicio el evento no tiene sentido de negocio y se rechaza.
 */
function validarRangoFechas(inicio: Date, fin: Date, etiqueta = 'evento') {
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error(`Las fechas del ${etiqueta} no son válidas.`);
  }
  if (fin.getTime() < inicio.getTime()) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }
}

/**
 * Normaliza la hora de una actividad del cronograma. El frontend puede enviar
 * un datetime completo ("2026-02-28T08:00") o solo la hora ("08:00"). Cuando es
 * solo la hora se ancla a la fecha del evento para conservar un DateTime válido
 * en la base de datos (columna DateTime).
 */
function parseFechaHoraActividad(valor: string, fechaBase: Date): Date {
  const texto = String(valor ?? '').trim();

  // Hora suelta: "8:00" o "08:00" o "08:00:00".
  const soloHora = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(texto);
  if (soloHora) {
    const base = Number.isNaN(fechaBase.getTime()) ? new Date() : new Date(fechaBase);
    base.setHours(Number(soloHora[1]), Number(soloHora[2]), Number(soloHora[3] ?? 0), 0);
    return base;
  }

  return new Date(texto);
}

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

  validarRangoFechas(fechaInicio, fechaFin);

  const evento = await prisma.evento.create({
    data: {
      nombre: input.nombre.trim(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: 'BORRADOR',
      visible_portada: input.visible_portada ?? false,
      costo_base: input.costo_base ?? 0,
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

  const registros = await prisma.inscripcion.findMany({
    where: {
      evento_id: eventoId,
    },
    select: {
      categoria_id: true,
    },
  });

  const conteoPorCategoria = registros.reduce<Record<string, number>>((acc, item) => {
    acc[item.categoria_id] = (acc[item.categoria_id] || 0) + 1;
    return acc;
  }, {});

  const categorias = await prisma.categoria.findMany({
    where: {
      OR: [
        { campeonato_id: evento.campeonato_id },
        ...(Object.keys(conteoPorCategoria).length ? [{ id: { in: Object.keys(conteoPorCategoria) } }] : []),
      ],
    },
    orderBy: { nombre: 'asc' },
  });
  const categoriasVisibles = Array.from(categorias.reduce((map, categoria) => {
    const anterior = map.get(categoria.nombre.toLowerCase());
    if (!anterior || (conteoPorCategoria[categoria.id] || 0) > (conteoPorCategoria[anterior.id] || 0)) {
      map.set(categoria.nombre.toLowerCase(), categoria);
    }
    return map;
  }, new Map<string, (typeof categorias)[number]>()).values());

  return {
    ...evento,
    categorias: categoriasVisibles.map((c) => ({
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

export async function actualizarEvento(input: ActualizarEventoInput) {
  const evento = await prisma.evento.findUnique({
    where: { id: input.evento_id },
    select: {
      id: true,
      nombre: true,
      campeonato_id: true,
      circuito_id: true,
      fecha_inicio: true,
      fecha_fin: true,
      costo_base: true,
      visible_portada: true,
    },
  });

  if (!evento) throw new Error('Evento no encontrado.');

  const fechaInicio = input.fecha_inicio ? new Date(input.fecha_inicio) : evento.fecha_inicio;
  const fechaFin = input.fecha_fin ? new Date(input.fecha_fin) : evento.fecha_fin;
  validarRangoFechas(fechaInicio, fechaFin);

  let campeonatoId = evento.campeonato_id;
  if (input.campeonato_id && input.campeonato_id !== evento.campeonato_id) {
    const campeonato = await prisma.campeonato.findFirst({
      where: { id: input.campeonato_id, esta_activo: true },
      select: { id: true },
    });
    if (!campeonato) throw new Error('El campeonato no existe o está inactivo.');
    campeonatoId = campeonato.id;
  }

  let circuitoId = evento.circuito_id;
  if (input.circuito_id && input.circuito_id !== evento.circuito_id) {
    const circuito = await prisma.circuito.findFirst({
      where: { id: input.circuito_id, esta_activo: true },
      select: { id: true },
    });
    if (!circuito) throw new Error('El circuito no existe o está inactivo.');
    circuitoId = circuito.id;
  }

  const actualizado = await prisma.evento.update({
    where: { id: input.evento_id },
    data: {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      campeonato_id: campeonatoId,
      circuito_id: circuitoId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      ...(input.costo_base !== undefined ? { costo_base: input.costo_base } : {}),
      ...(input.visible_portada !== undefined ? { visible_portada: input.visible_portada } : {}),
    },
  });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_id,
      tabla_afectada: 'eventos',
      accion: 'UPDATE',
      registro_id: input.evento_id,
      valor_anterior: {
        nombre: evento.nombre,
        campeonato_id: evento.campeonato_id,
        circuito_id: evento.circuito_id,
        fecha_inicio: new Date(evento.fecha_inicio).toISOString(),
        fecha_fin: new Date(evento.fecha_fin).toISOString(),
        costo_base: evento.costo_base,
        visible_portada: evento.visible_portada,
      },
      valor_nuevo: {
        nombre: actualizado.nombre,
        campeonato_id: actualizado.campeonato_id,
        circuito_id: actualizado.circuito_id,
        fecha_inicio: new Date(actualizado.fecha_inicio).toISOString(),
        fecha_fin: new Date(actualizado.fecha_fin).toISOString(),
        costo_base: actualizado.costo_base,
        visible_portada: actualizado.visible_portada,
      },
    },
  });

  return actualizado;
}

export async function crearActividadCronograma(input: CrearCronogramaInput) {
  const evento = await prisma.evento.findUnique({
    where: { id: input.evento_id },
    select: { id: true, fecha_inicio: true },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  const horaInicio = parseFechaHoraActividad(input.hora_inicio, evento.fecha_inicio);
  const horaFin = parseFechaHoraActividad(input.hora_fin, evento.fecha_inicio);
  validarRangoFechas(horaInicio, horaFin, 'cronograma');

  return prisma.actividadCronograma.create({
    data: {
      evento_id: input.evento_id,
      nombre: input.nombre.trim(),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      descripcion: input.descripcion?.trim() || null,
      es_pista: input.es_pista,
    },
  });
}

export async function actualizarActividadCronograma(input: ActualizarCronogramaInput) {
  const evento = await prisma.evento.findUnique({
    where: { id: input.evento_id },
    select: { id: true, fecha_inicio: true },
  });
  if (!evento) throw new Error('Evento no encontrado.');

  const actividad = await prisma.actividadCronograma.findUnique({ where: { id: input.actividad_id } });
  if (!actividad) throw new Error('Actividad no encontrada.');
  if (actividad.evento_id !== input.evento_id) {
    throw new Error('La actividad no pertenece al evento indicado.');
  }

  const horaInicio = input.hora_inicio !== undefined
    ? parseFechaHoraActividad(input.hora_inicio, evento.fecha_inicio)
    : actividad.hora_inicio;
  const horaFin = input.hora_fin !== undefined
    ? parseFechaHoraActividad(input.hora_fin, evento.fecha_inicio)
    : actividad.hora_fin;
  validarRangoFechas(horaInicio, horaFin, 'cronograma');

  return prisma.actividadCronograma.update({
    where: { id: input.actividad_id },
    data: {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      ...(input.descripcion !== undefined ? { descripcion: input.descripcion?.trim() || null } : {}),
      ...(input.es_pista !== undefined ? { es_pista: input.es_pista } : {}),
    },
  });
}

export async function eliminarActividadCronograma(eventoId: string, actividadId: string) {
  const actividad = await prisma.actividadCronograma.findUnique({ where: { id: actividadId } });
  if (!actividad) throw new Error('Actividad no encontrada.');
  if (actividad.evento_id !== eventoId) {
    throw new Error('La actividad no pertenece al evento indicado.');
  }

  await prisma.actividadCronograma.delete({ where: { id: actividadId } });
  return { ok: true, id: actividadId };
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

  const registros = await prisma.inscripcion.findMany({ where: { evento_id: eventoId }, select: { categoria_id: true } });

  const conteoPorCategoria = registros.reduce<Record<string, number>>((acc, item) => {
    acc[item.categoria_id] = (acc[item.categoria_id] || 0) + 1;
    return acc;
  }, {});

  const categorias = await prisma.categoria.findMany({
    where: {
      OR: [
        { campeonato_id: evento.campeonato_id },
        ...(Object.keys(conteoPorCategoria).length ? [{ id: { in: Object.keys(conteoPorCategoria) } }] : []),
      ],
    },
    orderBy: { nombre: 'asc' },
  });
  const categoriasVisibles = Array.from(categorias.reduce((map, categoria) => {
    const anterior = map.get(categoria.nombre.toLowerCase());
    if (!anterior || (conteoPorCategoria[categoria.id] || 0) > (conteoPorCategoria[anterior.id] || 0)) {
      map.set(categoria.nombre.toLowerCase(), categoria);
    }
    return map;
  }, new Map<string, (typeof categorias)[number]>()).values());

  return categoriasVisibles.map((c) => ({ ...c, total_inscritos: conteoPorCategoria[c.id] || 0 }));
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
