import prisma from '../../prisma.config';

type ClasificacionInput = {
  piloto_id: string;
  categoria_id: string;
  campeonato_id: string;
  puntos_total?: number;
  posicion?: number | null;
};

function parseTimeToMs(t: string | null | undefined) {
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length !== 2) return null;
  const mm = Number(parts[0]);
  const ssParts = parts[1].split('.');
  const ss = Number(ssParts[0]);
  const ms = ssParts[1] ? Number(ssParts[1].padEnd(3, '0')) : 0;
  if (Number.isNaN(mm) || Number.isNaN(ss) || Number.isNaN(ms)) return null;
  return mm * 60000 + ss * 1000 + ms;
}

function formatMsToTime(ms: number | null) {
  if (ms == null) return null;
  const minutes = Math.floor(ms / 60000);
  const rest = ms % 60000;
  const seconds = Math.floor(rest / 1000);
  const millis = rest % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export async function listClasificaciones(filters: {
  campeonatoId?: string;
  categoriaId?: string;
}) {
  return prisma.clasificacionGeneral.findMany({
    where: {
      campeonato_id: filters.campeonatoId,
      categoria_id: filters.categoriaId,
    },
    orderBy: [{ puntos_total: 'desc' }, { posicion: 'asc' }],
    include: {
      piloto: {
        include: {
          usuario: true,
        },
      },
      categoria: {
        include: {
          campeonato: true,
        },
      },
    },
  });
}

export async function createClasificacion(input: ClasificacionInput) {
  const existing = await prisma.clasificacionGeneral.findFirst({
    where: {
      piloto_id: input.piloto_id,
      categoria_id: input.categoria_id,
      campeonato_id: input.campeonato_id,
    },
  });

  if (existing) {
    return prisma.clasificacionGeneral.update({
      where: { id: existing.id },
      data: {
        puntos_total: input.puntos_total ?? existing.puntos_total,
        posicion: input.posicion ?? existing.posicion,
      },
      include: {
        piloto: { include: { usuario: true } },
        categoria: { include: { campeonato: true } },
      },
    });
  }

  return prisma.clasificacionGeneral.create({
    data: {
      piloto_id: input.piloto_id,
      categoria_id: input.categoria_id,
      campeonato_id: input.campeonato_id,
      puntos_total: input.puntos_total ?? 0,
      posicion: input.posicion ?? null,
    },
    include: {
      piloto: {
        include: {
          usuario: true,
        },
      },
      categoria: {
        include: {
          campeonato: true,
        },
      },
    },
  });
}

export async function updateClasificacion(id: string, input: Partial<ClasificacionInput>) {
  return prisma.clasificacionGeneral.update({
    where: { id },
    data: {
      ...(input.piloto_id ? { piloto_id: input.piloto_id } : {}),
      ...(input.categoria_id ? { categoria_id: input.categoria_id } : {}),
      ...(input.campeonato_id ? { campeonato_id: input.campeonato_id } : {}),
      ...(typeof input.puntos_total === 'number' ? { puntos_total: input.puntos_total } : {}),
      ...(input.posicion !== undefined ? { posicion: input.posicion } : {}),
    },
    include: {
      piloto: {
        include: {
          usuario: true,
        },
      },
      categoria: {
        include: {
          campeonato: true,
        },
      },
    },
  });
}

export async function deleteClasificacion(id: string) {
  return prisma.clasificacionGeneral.delete({
    where: { id },
  });
}

async function getOrCreateEventoClasificacionHeat(eventoId: string, categoriaId: string) {
  const heatName = `CLASIFICACION - EVENTO:${eventoId} - CAT:${categoriaId}`;
  let heat = await prisma.heat.findFirst({
    where: {
      nombre: heatName,
      categoria_id: categoriaId,
    },
  });

  if (!heat) {
    heat = await prisma.heat.create({
      data: {
        categoria_id: categoriaId,
        nombre: heatName,
        vueltas: 0,
        esta_activo: true,
      },
    });
  }

  return heat;
}

export async function saveClasificacionTiempoEvento(
  eventoId: string,
  categoriaId: string,
  inscripcionId: string,
  vuelta1: string | null,
  vuelta2: string | null,
) {
  const ins = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    include: {
      categoria: true,
      evento: true,
    },
  });

  if (!ins) throw new Error('Inscripción no encontrada');
  const eventoIdReal = String(ins.evento_id || ins.evento?.id || eventoId);
  const categoriaIdReal = String(ins.categoria_id || categoriaId);

  if (String(eventoIdReal) !== String(eventoId)) {
    throw new Error('La inscripción no pertenece a este evento');
  }
  if (String(categoriaIdReal) !== String(categoriaId)) {
    throw new Error('La inscripción no pertenece a esta categoría');
  }

  const heat = await getOrCreateEventoClasificacionHeat(eventoId, categoriaId);

  const v1ms = parseTimeToMs(vuelta1);
  const v2ms = parseTimeToMs(vuelta2);
  const mejores = [v1ms, v2ms].filter((value): value is number => value != null);
  const mejorMs = mejores.length ? Math.min(...mejores) : null;
  const mejor = formatMsToTime(mejorMs);

  await prisma.resultadoTiempo.deleteMany({
    where: {
      heat_id: heat.id,
      inscripcion_id: inscripcionId,
      estatus_carrera: 'CLASIFICACION',
    },
  });

  await prisma.resultadoTiempo.create({
    data: {
      heat_id: heat.id,
      inscripcion_id: inscripcionId,
      posicion: 0,
      mejor_vuelta: mejor,
      tiempo_total: null,
      vuelta_1: vuelta1,
      vuelta_2: vuelta2,
      puntos_ganados: 0,
      estatus_carrera: 'CLASIFICACION',
    },
  });

  return { ok: true, inscripcion_id: inscripcionId, mejor_vuelta: mejor };
}

export async function getParrillaEventoCategoria(eventoId: string, categoriaId: string) {
  const heatName = `CLASIFICACION - EVENTO:${eventoId} - CAT:${categoriaId}`;
  const heat = await prisma.heat.findFirst({
    where: {
      nombre: heatName,
      categoria_id: categoriaId,
    },
  });

  if (!heat) return [];

  const resultados = await prisma.resultadoTiempo.findMany({
    where: { heat_id: heat.id, estatus_carrera: 'CLASIFICACION' },
    include: {
      inscripcion: {
        include: {
          piloto: { include: { usuario: true } },
          categoria: { include: { campeonato: true } },
        },
      },
    },
    orderBy: { mejor_vuelta: 'asc' },
  });

  return resultados.map((resultado, index) => ({
    id: resultado.id,
    posicion: index + 1,
    piloto_id: resultado.inscripcion.piloto.id,
    piloto_nombre: `${resultado.inscripcion.piloto.usuario.nombre} ${resultado.inscripcion.piloto.usuario.apellido}`.trim(),
    dorsal_asignado: resultado.inscripcion.dorsal_asignado,
    categoria_id: resultado.inscripcion.categoria_id,
    categoria_nombre: resultado.inscripcion.categoria.nombre,
    campeonato_id: resultado.inscripcion.categoria.campeonato_id,
    mejor_tiempo: resultado.mejor_vuelta,
    vuelta_1: (resultado as any).vuelta_1 ?? null,
    vuelta_2: (resultado as any).vuelta_2 ?? null,
  }));
}

// --- Grupo-specific helpers for clasificación ---
export async function getPilotosForGrupo(grupoId: string, eventoId?: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');

  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  const inscripciones = await prisma.inscripcion.findMany({
    where: { evento_id: eventoId ?? undefined, categoria_id: { in: categoriaIds } },
    include: { piloto: { include: { usuario: true } }, motocicleta: { include: { marca: true } } },
    orderBy: { fecha_registro: 'asc' },
  });

  const out = [] as any[];
  for (const ins of inscripciones) {
    const resultado = await prisma.resultadoTiempo.findFirst({
      where: { inscripcion_id: ins.id, estatus_carrera: 'CLASIFICACION' },
    });

    out.push({
      inscripcion_id: ins.id,
      piloto_id: ins.piloto.id,
      nombre: `${ins.piloto.usuario.nombre} ${ins.piloto.usuario.apellido}`.trim(),
      dorsal: ins.dorsal_asignado,
      tiene_tiempo: !!resultado,
      vuelta_1: resultado ? resultado.mejor_vuelta : null,
      fecha_registro: ins.fecha_registro,
    });
  }

  return out;
}

export async function saveClasificacionTiempo(grupoId: string, inscripcionId: string, vuelta1: string | null, vuelta2: string | null) {
  const ins = await prisma.inscripcion.findUnique({ where: { id: inscripcionId }, include: { categoria: true } });
  if (!ins) throw new Error('Inscripción no encontrada');

  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId } });
  if (!grupo) throw new Error('Grupo no encontrado');
  const ceg = await (prisma as any).categoriaEnGrupo.findFirst({ where: { grupo_id: grupoId, categoria_id: ins.categoria_id } });
  if (!ceg) throw new Error('La categoría de la inscripción no pertenece a este grupo');

  const heatName = `CLASIFICACION - ${grupo.id}`;
  let heat = await prisma.heat.findFirst({ where: { categoria_id: ins.categoria_id, nombre: { contains: heatName } } });
  if (!heat) {
    heat = await prisma.heat.create({ data: { categoria_id: ins.categoria_id, nombre: heatName, vueltas: 0, esta_activo: true } });
  }
  const heatId = heat.id;

  const v1ms = vuelta1 ? parseTimeToMs(vuelta1) : null;
  const v2ms = vuelta2 ? parseTimeToMs(vuelta2) : null;
  const mejores = [v1ms, v2ms].filter((x) => x != null) as number[];
  const mejorMs = mejores.length ? Math.min(...mejores) : null;

  const mejor = mejorMs != null ? formatMsToTime(mejorMs) : null;
  const diferencia = v1ms != null && v2ms != null ? formatMsToTime(Math.abs(v2ms - v1ms)) : null;

  await (prisma.$transaction as any)(async (tx: any) => {
    await tx.resultadoTiempo.deleteMany({ where: { inscripcion_id: inscripcionId, heat_id: heatId, estatus_carrera: 'CLASIFICACION' } });

    await tx.resultadoTiempo.create({
      data: {
        heat_id:         heatId,
        inscripcion_id:  inscripcionId,
        posicion:        0,
        mejor_vuelta:    mejor,
        vuelta_1:        vuelta1,
        vuelta_2:        vuelta2,
        tiempo_total:    null,
        puntos_ganados:  0,
        estatus_carrera: 'CLASIFICACION',
      },
    });
  });

  return { inscripcion_id: inscripcionId, mejor_vuelta: mejor, diferencia };
}

export async function getParrillaGrupo(grupoId: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  const heats = await prisma.heat.findMany({ where: { categoria_id: { in: categoriaIds }, nombre: { contains: `CLASIFICACION - ${grupo.id}` } } });
  const heatIds = heats.map((h) => h.id);

  const resultados = await prisma.resultadoTiempo.findMany({
    where: { heat_id: { in: heatIds }, estatus_carrera: 'CLASIFICACION' },
    include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } },
    orderBy: { mejor_vuelta: 'asc' },
  });

  const conTiempo = resultados
    .map((r) => ({
      inscripcion_id: r.inscripcion_id,
      nombre: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`.trim(),
      dorsal: r.inscripcion.dorsal_asignado,
      vuelta_1: null,
      vuelta_2: null,
      mejor_tiempo: r.mejor_vuelta,
      diferencia: null,
    }))
    .sort((a, b) => (a.mejor_tiempo || '99:99.999').localeCompare(b.mejor_tiempo || '99:99.999'));

  const conIds = new Set(conTiempo.map((c) => c.inscripcion_id));
  const inscripciones = await prisma.inscripcion.findMany({ where: { categoria_id: { in: categoriaIds } }, include: { piloto: { include: { usuario: true } } }, orderBy: { fecha_registro: 'asc' } });
  const sinTiempo = inscripciones.filter((ins) => !conIds.has(ins.id)).map((ins) => ({
    inscripcion_id: ins.id,
    nombre: `${ins.piloto.usuario.nombre} ${ins.piloto.usuario.apellido}`.trim(),
    dorsal: ins.dorsal_asignado,
    vuelta_1: null,
    vuelta_2: null,
    mejor_tiempo: null,
    diferencia: null,
  }));

  return [...conTiempo, ...sinTiempo];
}

export async function completarClasificacion(grupoId: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId } });
  if (!grupo) throw new Error('Grupo no encontrado');

  const categoriaIds = (await (prisma as any).categoriaEnGrupo.findMany({ where: { grupo_id: grupoId } })).map((c: any) => c.categoria_id);

  const existeResultado = await prisma.resultadoTiempo.findFirst({ where: { heat: { categoria_id: { in: categoriaIds }, nombre: { contains: `CLASIFICACION - ${grupo.id}` } } } });

  if (!existeResultado) throw new Error('No se encontraron resultados de clasificación para este grupo');

  await (prisma as any).grupoCategoriaEvento.update({ where: { id: grupoId }, data: { clasificacion_completada: true } });
  return { ok: true };
}
