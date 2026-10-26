import prisma from '../../prisma.config';

const P2002_MESSAGE = 'Ya existe un registro con ese valor, verifica los datos';

export async function getResumen(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { campeonato: true, circuito: true },
  });

  if (!evento) throw new Error('Evento no encontrado');

  // Count inscritos por categoria para este evento
  const inscritos = await prisma.inscripcion.groupBy({
    by: ['categoria_id'],
    where: { evento_id: eventoId },
    _count: { categoria_id: true },
  });

  const conteoMap: Record<string, number> = {};
  inscritos.forEach((r) => (conteoMap[r.categoria_id] = r._count.categoria_id));

  const categorias = await prisma.categoria.findMany({
    where: {
      OR: [
        { campeonato_id: evento.campeonato_id },
        ...(inscritos.length ? [{ id: { in: inscritos.map((r) => r.categoria_id) } }] : []),
      ],
    },
    orderBy: { nombre: 'asc' },
  });
  const categoriasVisibles = Array.from(categorias.reduce((map, categoria) => {
    const anterior = map.get(categoria.nombre.toLowerCase());
    if (!anterior || (conteoMap[categoria.id] || 0) > (conteoMap[anterior.id] || 0)) {
      map.set(categoria.nombre.toLowerCase(), categoria);
    }
    return map;
  }, new Map<string, (typeof categorias)[number]>()).values());

  const categoriasConConteo = categoriasVisibles.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    cilindrada_min: c.cilindrada_min,
    cilindrada_max: c.cilindrada_max,
    precio_inscripcion: c.precio_inscripcion,
    total_inscritos: conteoMap[c.id] ?? 0,
  }));

  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  const cronograma = await prisma.actividadCronograma.findMany({
    where: { evento_id: eventoId },
    orderBy: { hora_inicio: 'asc' },
  });

  return {
    evento,
    categorias: categoriasConConteo,
    grupos,
    cronograma,
  };
}

export async function updateDatos(eventoId: string, payload: any, operadorId: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) throw new Error('Evento no encontrado');

  if (evento.estado === 'EN_CURSO' || evento.estado === 'FINALIZADO') {
    throw new Error('No se pueden modificar los datos de un evento en curso o finalizado');
  }

  const antes = {
    nombre: evento.nombre,
    fecha_inicio: evento.fecha_inicio,
    fecha_fin: evento.fecha_fin,
    costo_base: evento.costo_base,
    circuito_id: evento.circuito_id,
    visible_portada: evento.visible_portada,
  };

  try {
    const actualizado = await prisma.evento.update({
      where: { id: eventoId },
      data: {
        nombre: payload.nombre ?? evento.nombre,
        fecha_inicio: payload.fecha_inicio ? new Date(payload.fecha_inicio) : evento.fecha_inicio,
        fecha_fin: payload.fecha_fin ? new Date(payload.fecha_fin) : evento.fecha_fin,
        costo_base: payload.costo_base !== undefined ? Number(payload.costo_base) : evento.costo_base,
        circuito_id: payload.circuito_id ?? evento.circuito_id,
        visible_portada: payload.visible_portada !== undefined ? Boolean(payload.visible_portada) : evento.visible_portada,
      },
    });

    await prisma.auditoria.create({
      data: {
        usuario_id: operadorId,
        tabla_afectada: 'eventos',
        accion: 'UPDATE',
        registro_id: eventoId,
        valor_anterior: antes as any,
        valor_nuevo: {
          nombre: actualizado.nombre,
          fecha_inicio: actualizado.fecha_inicio.toISOString(),
          fecha_fin: actualizado.fecha_fin.toISOString(),
          costo_base: actualizado.costo_base,
          circuito_id: actualizado.circuito_id,
          visible_portada: actualizado.visible_portada,
        },
      },
    });

    return actualizado;
  } catch (err: any) {
    if (err?.code === 'P2002') throw new Error(P2002_MESSAGE);
    throw new Error('No se pudo actualizar el evento');
  }
}

export async function listInscripciones(eventoId: string, categoriaId?: string) {
  const where: any = { evento_id: eventoId };
  if (categoriaId) where.categoria_id = categoriaId;

  const items = await prisma.inscripcion.findMany({
    where,
    include: {
      piloto: { include: { usuario: true } },
      categoria: true,
      motocicleta: { include: { marca: true } },
      revision_tecnica: true,
    },
    orderBy: { fecha_registro: 'desc' },
  });

  return items;
}

export async function listClasificaciones(eventoId: string) {
  // For each group, get resultados_tiempos for inscripciones in this evento whose categoria_id is in group's categories
  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  const result = [];

  for (const grupo of grupos) {
    const categoriaIds = (grupo.categorias_en_grupo as any[]).map((cg: any) => cg.categoria_id);

    const resultados = await prisma.resultadoTiempo.findMany({
      where: {
        inscripcion: { evento_id: eventoId, categoria_id: { in: categoriaIds } },
      },
      include: {
        inscripcion: { include: { piloto: { include: { usuario: true } } } },
      },
      orderBy: { tiempo_total: 'asc' },
    });

    result.push({
      grupo_id: grupo.id,
      nombre: grupo.nombre,
      tiene_clasificacion: grupo.tiene_clasificacion,
      clasificacion_completada: grupo.clasificacion_completada,
      resultados: resultados.map((r) => ({
        piloto_nombre: r.inscripcion.piloto.usuario.nombre,
        piloto_apellido: r.inscripcion.piloto.usuario.apellido,
        dorsal: r.inscripcion.dorsal_asignado,
        mejor_vuelta: r.mejor_vuelta,
        tiempo_total: r.tiempo_total,
        puntos_ganados: r.puntos_ganados,
      })),
    });
  }

  return result;
}

export async function listResultados(eventoId: string) {
  // Group by grupo similar to clasificaciones but include heat info
  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  const out = [];

  for (const grupo of grupos) {
    const categoriaIds = (grupo.categorias_en_grupo as any[]).map((cg: any) => cg.categoria_id);

    const resultados = await prisma.resultadoTiempo.findMany({
      where: {
        inscripcion: { evento_id: eventoId, categoria_id: { in: categoriaIds } },
      },
      include: {
        inscripcion: { include: { piloto: { include: { usuario: true } } } },
        heat: true,
      },
      orderBy: [{ heat: { nombre: 'asc' } }, { posicion: 'asc' }],
    });

    out.push({
      grupo_id: grupo.id,
      nombre: grupo.nombre,
      resultados: resultados.map((r) => ({
        heat_id: r.heat_id,
        heat_nombre: r.heat?.nombre,
        posicion: r.posicion,
        piloto_nombre: r.inscripcion.piloto.usuario.nombre,
        piloto_apellido: r.inscripcion.piloto.usuario.apellido,
        dorsal: r.inscripcion.dorsal_asignado,
        vueltas: r.vueltas_completadas,
        tiempo_total: r.tiempo_total,
        puntos_ganados: r.puntos_ganados,
      })),
    });
  }

  return out;
}
