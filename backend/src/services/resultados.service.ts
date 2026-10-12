import prisma from '../../prisma.config';

const PUNTOS_POR_POSICION = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export async function getPilotosParaHeat(grupoId: string, numeroHeat: number, categoriaId?: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  const categoriaIds = (grupo.categorias_en_grupo as any[])
    .map((c: any) => c.categoria_id)
    .filter((id: string) => !categoriaId || String(id) === String(categoriaId));
  if (categoriaIds.length === 0) throw new Error('La categoría no pertenece a este grupo');
  const inscripcionWhere = { evento_id: grupo.evento_id, categoria_id: { in: categoriaIds } };

  if (numeroHeat === 1) {
    const clasifHeats = await prisma.heat.findMany({
      where: {
        categoria_id: { in: categoriaIds },
        nombre: { contains: `CLASIFICACION - EVENTO:${grupo.evento_id}` },
      },
    });
    const clasifHeatIds = clasifHeats.map((h) => h.id);
    const clasifResults = await prisma.resultadoTiempo.findMany({
      where: { heat_id: { in: clasifHeatIds }, estatus_carrera: 'CLASIFICACION' },
      include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } },
      orderBy: { mejor_vuelta: 'asc' },
    });
    if (clasifResults.length > 0) {
      return clasifResults.slice(0, 45).map((r) => ({
        inscripcion_id: r.inscripcion_id,
        nombre: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`,
        dorsal: r.inscripcion.dorsal_asignado,
        fecha_registro: r.inscripcion.fecha_registro,
        mejor_tiempo: r.mejor_vuelta,
      }));
    }

    const ins = await prisma.inscripcion.findMany({ where: inscripcionWhere, include: { piloto: { include: { usuario: true } } }, orderBy: { fecha_registro: 'asc' }, take: 45 });
    return ins.map((i) => ({ inscripcion_id: i.id, nombre: `${i.piloto.usuario.nombre} ${i.piloto.usuario.apellido}`, dorsal: i.dorsal_asignado, fecha_registro: i.fecha_registro }));
  }

  if (numeroHeat === 2) {
    if (!grupo.heat1_completado) return [];
    const heat1 = await prisma.heat.findFirst({ where: { categoria_id: { in: categoriaIds }, nombre: `HEAT 1 - ${grupo.id}` } });
    if (!heat1) return [];
    return buildFromHeat(heat1.id);
  }

  throw new Error('numero de heat inválido');

  async function buildFromHeat(heatId: string) {
    const results = await prisma.resultadoTiempo.findMany({ where: { heat_id: heatId }, include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } }, orderBy: { posicion: 'asc' } });
    return results.slice(0, 45).map((r) => ({ inscripcion_id: r.inscripcion_id, nombre: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`, dorsal: r.inscripcion.dorsal_asignado, posicion_heat_1: r.posicion }));
  }
}

export async function postHeatResultados(grupoId: string, numeroHeat: number, resultados: any[], usuarioId: string, categoriaId?: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  const categoriaIds = (grupo.categorias_en_grupo as any[])
    .map((c: any) => c.categoria_id)
    .filter((id: string) => !categoriaId || String(id) === String(categoriaId));
  if (categoriaIds.length === 0) throw new Error('La categoría no pertenece a este grupo');
  if (![1, 2].includes(numeroHeat)) throw new Error('numero de heat inválido');
  if (!Array.isArray(resultados) || resultados.length === 0) throw new Error('Debe registrar al menos un piloto');
  if (resultados.length > 45) throw new Error('Una categoría no puede tener más de 45 pilotos');
  if (numeroHeat === 2 && !grupo.heat1_completado) throw new Error('Debe completar la Manga 1 antes de armar la Manga 2');

  const ids = resultados.map((r) => String(r.inscripcion_id || ''));
  if (new Set(ids).size !== ids.length) throw new Error('No se puede repetir un piloto en la parrilla');
  const inscripciones = await prisma.inscripcion.findMany({ where: { id: { in: ids }, evento_id: grupo.evento_id, categoria_id: { in: categoriaIds } }, select: { id: true } });
  if (inscripciones.length !== ids.length) throw new Error('La parrilla contiene pilotos que no pertenecen a este evento y grupo');

  const heatName = `HEAT ${numeroHeat} - ${grupo.id}`;

  const tx: any = prisma;
  {
    let heatRecord = await tx.heat.findFirst({ where: { categoria_id: categoriaIds[0], nombre: heatName } });
    if (!heatRecord) {
      heatRecord = await tx.heat.create({ data: { categoria_id: categoriaIds[0], nombre: heatName, vueltas: 0, esta_activo: true } });
    }

    const previousResults = await tx.resultadoTiempo.findMany({ where: { heat_id: heatRecord.id }, select: { inscripcion_id: true, puntos_ganados: true } });
    for (const previous of previousResults) {
      const previousIns = await tx.inscripcion.findUnique({ where: { id: previous.inscripcion_id }, include: { categoria: true } });
      if (!previousIns) continue;
      const previousClasif = await tx.clasificacionGeneral.findFirst({ where: { piloto_id: previousIns.piloto_id, categoria_id: previousIns.categoria_id, campeonato_id: previousIns.categoria.campeonato_id } });
      if (previousClasif) await tx.clasificacionGeneral.update({ where: { id: previousClasif.id }, data: { puntos_total: Math.max(0, previousClasif.puntos_total - (previous.puntos_ganados || 0)) } });
    }

    await tx.resultadoTiempo.deleteMany({ where: { heat_id: heatRecord.id } });

    for (const r of resultados) {
      const { inscripcion_id, posicion, vueltas_completadas, tiempo_total, estatus_carrera } = r;
      const ins = await tx.inscripcion.findUnique({ where: { id: inscripcion_id }, include: { categoria: true } });
      if (!ins) throw new Error('Inscripción no encontrada');

      let puntos = PUNTOS_POR_POSICION[Number(posicion) - 1] ?? 0;

      if (estatus_carrera === 'DNF') {
        const vueltasTotales = heatRecord.vueltas || 0;
        if (vueltasTotales > 0) {
          const threshold = Math.ceil(vueltasTotales * 0.75);
          if ((vueltas_completadas ?? 0) < threshold) puntos = 0; else {
            const last = await tx.esquemaPuntos.findMany({ where: { categoria_id: ins.categoria_id }, orderBy: { posicion: 'desc' }, take: 1 });
            puntos = last.length ? last[0].puntos : 0;
          }
        } else {
          puntos = 0;
        }
      }

      await tx.resultadoTiempo.create({ data: { heat_id: heatRecord.id, inscripcion_id, posicion: Number(posicion), mejor_vuelta: null, tiempo_total: tiempo_total ?? null, vueltas_completadas: vueltas_completadas == null ? null : Number(vueltas_completadas), puntos_ganados: puntos, estatus_carrera } as any });

      const pilotoPerfilId = (await tx.inscripcion.findUnique({ where: { id: inscripcion_id } }))!.piloto_id;
      const campeonatoId = ins.categoria.campeonato_id;
      const clasif = await tx.clasificacionGeneral.findFirst({ where: { piloto_id: pilotoPerfilId, categoria_id: ins.categoria_id, campeonato_id: campeonatoId } });
      if (clasif) {
        await tx.clasificacionGeneral.update({ where: { id: clasif.id }, data: { puntos_total: clasif.puntos_total + puntos } });
      } else {
        await tx.clasificacionGeneral.create({ data: { piloto_id: pilotoPerfilId, categoria_id: ins.categoria_id, campeonato_id: campeonatoId, puntos_total: puntos } });
      }
    }

    if (numeroHeat === 1) await tx.grupoCategoriaEvento.update({ where: { id: grupoId }, data: { heat1_completado: true } });
    if (numeroHeat === 2) await tx.grupoCategoriaEvento.update({ where: { id: grupoId }, data: { heat2_completado: true } });

    await tx.notificacion.create({
      data: {
        usuario_id: usuarioId,
        evento_id: grupo.evento_id,
        titulo: `Manga ${numeroHeat} registrada`,
        mensaje: `Se registraron ${resultados.length} pilotos para la Manga ${numeroHeat} del grupo ${grupo.nombre}.`,
        tipo: 'resultados',
      },
    });

    return {
      ok: true,
      warnings: [
        ...(resultados.length < 15 ? ['Hay menos de 15 pilotos en la parrilla; se guardó con los inscritos disponibles.'] : []),
        ...(resultados.length > 40 ? ['Advertencia: la parrilla supera el máximo recomendado de 40 pilotos.'] : []),
      ],
    };
  }
}

export async function getResultadosHeat(grupoId: string, numeroHeat: number, categoriaId?: string) {
  const heatName = `HEAT ${numeroHeat} - ${grupoId}`;
  const heat = await prisma.heat.findFirst({
    where: { nombre: heatName, ...(categoriaId ? { categoria_id: categoriaId } : {}) },
  });
  if (!heat) return [];

  const resultados = await prisma.resultadoTiempo.findMany({ where: { heat_id: heat.id }, include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } }, orderBy: { posicion: 'asc' } });
  return resultados.map((r) => ({ inscripcion_id: r.inscripcion_id, id: r.id, posicion: r.posicion, piloto: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`, dorsal: r.inscripcion.dorsal_asignado, puntos: r.puntos_ganados, estatus: r.estatus_carrera, estatus_carrera: r.estatus_carrera }));
}
