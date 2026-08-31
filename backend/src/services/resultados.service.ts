import prisma from '../../prisma.config';

export async function getPilotosParaHeat(grupoId: string, numeroHeat: number) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  if (numeroHeat === 1) {
    // use classification parrilla if exists
    const clasifHeats = await prisma.heat.findMany({ where: { categoria_id: { in: categoriaIds }, nombre: { contains: `CLASIFICACION - ${grupo.id}` } } });
    const clasifHeatIds = clasifHeats.map((h) => h.id);
    const clasifResults = await prisma.resultadoTiempo.findMany({ where: { heat_id: { in: clasifHeatIds } }, include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } }, orderBy: { mejor_vuelta: 'asc' } });
    if (clasifResults.length > 0) {
      return clasifResults.map((r) => ({ inscripcion_id: r.inscripcion_id, nombre: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`, dorsal: r.inscripcion.dorsal_asignado }));
    }

    // fallback to inscription order
    const ins = await prisma.inscripcion.findMany({ where: { categoria_id: { in: categoriaIds } }, include: { piloto: { include: { usuario: true } } }, orderBy: { fecha_registro: 'asc' } });
    return ins.map((i) => ({ inscripcion_id: i.id, nombre: `${i.piloto.usuario.nombre} ${i.piloto.usuario.apellido}`, dorsal: i.dorsal_asignado }));
  }

  if (numeroHeat === 2) {
    // invert results of heat 1 if exists
    const heat1 = await prisma.heat.findFirst({ where: { categoria_id: { in: categoriaIds }, nombre: { contains: `HEAT 1 - ${grupo.id}` } } });
    if (!heat1) {
      const heatAlt = await prisma.heat.findFirst({ where: { categoria_id: { in: categoriaIds }, nombre: { contains: `Heat 1 - ${grupo.id}` } } });
      if (heatAlt) return buildInvertedFromHeat(heatAlt.id);
      const ins = await prisma.inscripcion.findMany({ where: { categoria_id: { in: categoriaIds } }, include: { piloto: { include: { usuario: true } } }, orderBy: { fecha_registro: 'asc' } });
      return ins.map((i) => ({ inscripcion_id: i.id, nombre: `${i.piloto.usuario.nombre} ${i.piloto.usuario.apellido}`, dorsal: i.dorsal_asignado }));
    }
    return buildInvertedFromHeat(heat1.id);
  }

  throw new Error('numero de heat inválido');

  async function buildInvertedFromHeat(heatId: string) {
    const results = await prisma.resultadoTiempo.findMany({ where: { heat_id: heatId }, include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } }, orderBy: { posicion: 'asc' } });
    const inverted = results.slice().reverse();
    return inverted.map((r) => ({ inscripcion_id: r.inscripcion_id, nombre: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`, dorsal: r.inscripcion.dorsal_asignado }));
  }
}

export async function postHeatResultados(grupoId: string, numeroHeat: number, resultados: any[], usuarioId: string) {
  const grupo = await (prisma as any).grupoCategoriaEvento.findUnique({ where: { id: grupoId }, include: { categorias_en_grupo: true } });
  if (!grupo) throw new Error('Grupo no encontrado');
  const categoriaIds = (grupo.categorias_en_grupo as any[]).map((c: any) => c.categoria_id);

  const heatName = `HEAT ${numeroHeat} - ${grupo.id}`;

  return await (prisma.$transaction as any)(async (tx: any) => {
    const heatRecord = await tx.heat.create({ data: { categoria_id: categoriaIds[0], nombre: heatName, vueltas: 0, esta_activo: true } });

    await tx.resultadoTiempo.deleteMany({ where: { heat_id: heatRecord.id } });

    for (const r of resultados) {
      const { inscripcion_id, posicion, vueltas_completadas, tiempo_total, estatus_carrera } = r;
      const ins = await tx.inscripcion.findUnique({ where: { id: inscripcion_id }, include: { categoria: true } });
      if (!ins) throw new Error('Inscripción no encontrada');

      const esquema = await tx.esquemaPuntos.findFirst({ where: { categoria_id: ins.categoria_id, posicion: posicion } });
      let puntos = esquema ? esquema.puntos : 0;

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

      await tx.resultadoTiempo.create({ data: { heat_id: heatRecord.id, inscripcion_id, posicion: Number(posicion), mejor_vuelta: null, tiempo_total: tiempo_total ?? null, puntos_ganados: puntos, estatus_carrera } as any });

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

    return { ok: true };
  });
}

export async function getResultadosHeat(grupoId: string, numeroHeat: number) {
  const heatName = `HEAT ${numeroHeat} - ${grupoId}`;
  const heat = await prisma.heat.findFirst({ where: { nombre: { contains: heatName } } });
  if (!heat) return [];

  const resultados = await prisma.resultadoTiempo.findMany({ where: { heat_id: heat.id }, include: { inscripcion: { include: { piloto: { include: { usuario: true } } } } }, orderBy: { posicion: 'asc' } });
  return resultados.map((r) => ({ posicion: r.posicion, piloto: `${r.inscripcion.piloto.usuario.nombre} ${r.inscripcion.piloto.usuario.apellido}`, dorsal: r.inscripcion.dorsal_asignado, vueltas: (r as any).vueltas ?? null, tiempo_total: r.tiempo_total, puntos: r.puntos_ganados, estatus: r.estatus_carrera }));
}
