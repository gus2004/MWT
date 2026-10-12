import prisma from '../../prisma.config';

const P2002_MESSAGE = 'Ya existe un registro con ese valor, verifica los datos';

export async function crearGrupo(eventoId: string, payload: any, operadorId: string) {
  const { nombre, descripcion, tiene_clasificacion = false, orden = 1, categorias_ids = [] } = payload;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true, campeonato_id: true, estado: true } });
  if (!evento) throw new Error('Evento no encontrado');

  // Validate categories belong to campeonato
  const categorias = await prisma.categoria.findMany({ where: { id: { in: categorias_ids } } });
  if (categorias.length !== categorias_ids.length) throw new Error('Alguna categoría no existe');
  for (const c of categorias) {
    if (c.campeonato_id !== evento.campeonato_id) throw new Error('Todas las categorías deben pertenecer al mismo campeonato del evento');
  }

  // Validate none of categories already assigned to other group in this event
  const yaAsignadas = await (prisma as any).categoriaEnGrupo.findMany({
    where: { categoria_id: { in: categorias_ids } },
    include: { grupo: { where: { evento_id: eventoId } } },
  });
  // Note: the include above may not filter as intended; instead query joined groups
  const asignadasDirect = await prisma.$queryRaw`
    SELECT ceg.categoria_id FROM categorias_en_grupo ceg
    JOIN grupos_categoria_evento g ON g.id = ceg.grupo_id
    WHERE g.evento_id = ${eventoId} AND ceg.categoria_id = ANY(${categorias_ids})
  `;
  if (Array.isArray(asignadasDirect) && asignadasDirect.length > 0) {
    throw new Error('Alguna categoría ya está asignada a otro grupo en este evento');
  }

  try {
    const created = await (prisma.$transaction as any)(async (tx: any) => {
      const grupo = await tx.grupoCategoriaEvento.create({
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          tiene_clasificacion: !!tiene_clasificacion,
          orden: Number(orden) || 1,
          evento_id: eventoId,
        },
      });

      for (const categoriaId of categorias_ids) {
        await tx.categoriaEnGrupo.create({
          data: { grupo_id: grupo.id, categoria_id: categoriaId },
        });
      }

      return tx.grupoCategoriaEvento.findUnique({ where: { id: grupo.id }, include: { categorias_en_grupo: { include: { categoria: true } } } });
    });

    return created;
  } catch (err: any) {
    if (err?.code === 'P2002') throw new Error(P2002_MESSAGE);
    throw new Error('No se pudo crear el grupo');
  }
}

export async function listarGrupos(eventoId: string) {
  const grupos = await (prisma as any).grupoCategoriaEvento.findMany({
    where: { evento_id: eventoId },
    orderBy: { orden: 'asc' },
    include: { categorias_en_grupo: { include: { categoria: true } } },
  });

  // For each category compute inscritos count for this evento
  const allCategoriaIds = grupos.flatMap((g: any) => (g.categorias_en_grupo as any[]).map((c: any) => c.categoria_id));
  const conteos = await prisma.inscripcion.groupBy({
    by: ['categoria_id'],
    where: { evento_id: eventoId, categoria_id: { in: allCategoriaIds } },
    _count: { categoria_id: true },
  });
  const mapConteos: Record<string, number> = {};
  conteos.forEach((r) => (mapConteos[r.categoria_id] = r._count.categoria_id));

  return (grupos as any[]).map((g: any) => ({
    id: g.id,
    nombre: g.nombre,
    descripcion: g.descripcion,
    tiene_clasificacion: g.tiene_clasificacion,
    clasificacion_completada: g.clasificacion_completada,
    heat1_completado: g.heat1_completado,
    heat2_completado: g.heat2_completado,
    orden: g.orden,
    categorias: g.categorias_en_grupo.map((cg: any) => ({
      id: cg.categoria.id,
      nombre: cg.categoria.nombre,
      cilindrada_min: cg.categoria.cilindrada_min,
      cilindrada_max: cg.categoria.cilindrada_max,
      inscritos: mapConteos[cg.categoria_id] ?? 0,
    })),
  }));
}

export async function editarGrupo(eventoId: string, grupoId: string, payload: any) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId } });
  if (!grupo) throw new Error('Grupo no encontrado');

  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { estado: true } });
  if (!evento) throw new Error('Evento no encontrado');
  if (evento.estado === 'EN_CURSO' || evento.estado === 'FINALIZADO') throw new Error('No se puede editar grupos de un evento en curso o finalizado');

  if (grupo.heat1_completado || grupo.heat2_completado) throw new Error('No se puede editar un grupo que ya tiene heats completados');

  try {
    const actualizado = await (prisma as any).grupoCategoriaEvento.update({
      where: { id: grupoId },
      data: {
        nombre: payload.nombre ?? grupo.nombre,
        descripcion: payload.descripcion ?? grupo.descripcion,
        tiene_clasificacion: payload.tiene_clasificacion !== undefined ? Boolean(payload.tiene_clasificacion) : grupo.tiene_clasificacion,
        orden: payload.orden !== undefined ? Number(payload.orden) : grupo.orden,
      },
    });
    return actualizado;
  } catch (err: any) {
    if (err?.code === 'P2002') throw new Error(P2002_MESSAGE);
    throw new Error('No se pudo actualizar el grupo');
  }
}

export async function eliminarGrupo(eventoId: string, grupoId: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  if (grupo.heat1_completado || grupo.heat2_completado) throw new Error('No se puede eliminar un grupo que tiene heats completados');
  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  // Check resultados linked to heats of those categories for the event
  const resultados = await prisma.resultadoTiempo.findFirst({
    where: {
      AND: [
        { inscripcion: { evento_id: eventoId } },
        { heat: { categoria_id: { in: categoriaIds } } },
      ],
    },
  });

  if (resultados) throw new Error('No se puede eliminar un grupo que ya tiene resultados registrados');

  // delete categoria_en_grupo and grupo in transaction
  await (prisma.$transaction as any)(async (tx: any) => {
    await tx.categoriaEnGrupo.deleteMany({ where: { grupo_id: grupoId } });
    await tx.grupoCategoriaEvento.delete({ where: { id: grupoId } });
  });

  return { ok: true };
}

export async function marcarClasificacionCompletada(grupoId: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  if (!grupo.tiene_clasificacion) throw new Error('Este grupo no tiene clasificación habilitada');
  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  // Heuristic: consider heats with name containing 'clasif' as classification
  const anyResultado = await prisma.resultadoTiempo.findFirst({
    where: { heat: { nombre: { contains: 'clasif', mode: 'insensitive' }, categoria_id: { in: categoriaIds } } },
  });

  if (!anyResultado) throw new Error('No se encontraron resultados de clasificación para este grupo');

  await (prisma as any).grupoCategoriaEvento.update({ where: { id: grupoId }, data: { clasificacion_completada: true } });
  return { ok: true };
}

export async function marcarHeatCompletado(grupoId: string, numeroHeat: number) {
  if (numeroHeat !== 1 && numeroHeat !== 2) throw new Error('numero_heat debe ser 1 o 2');
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');

  if ((numeroHeat === 1 && grupo.heat1_completado) || (numeroHeat === 2 && grupo.heat2_completado)) {
    throw new Error('El heat ya está marcado como completado');
  }

  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  // Check that exists resultados for heat number: heuristic match heat.nombre contains 'heat 1' or 'heat 2'
  const anyResultado = await prisma.resultadoTiempo.findFirst({
    where: { heat: { nombre: { contains: `heat ${numeroHeat}`, mode: 'insensitive' }, categoria_id: { in: categoriaIds } } },
  });

  if (!anyResultado) throw new Error('No se encontraron resultados para ese heat');

  // If marking heat1 as completed and group has heat2 not existing, create heat2 entries for each category
  if (numeroHeat === 1) {
    // check if heat2 exists for categories
    for (const categoriaId of categoriaIds) {
      const existingHeat2 = await prisma.heat.findFirst({ where: { categoria_id: categoriaId, nombre: { contains: 'heat 2', mode: 'insensitive' } } });
      if (!existingHeat2) {
        await prisma.heat.create({ data: { categoria_id: categoriaId, nombre: `Heat 2 - ${grupo.nombre}`, vueltas: 0, esta_activo: true } });
      }
    }
    await (prisma as any).grupoCategoriaEvento.update({ where: { id: grupoId }, data: { heat1_completado: true } });
  } else {
    await (prisma as any).grupoCategoriaEvento.update({ where: { id: grupoId }, data: { heat2_completado: true } });
  }

  return { ok: true };
}
