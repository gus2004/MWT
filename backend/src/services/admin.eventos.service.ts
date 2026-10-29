import prisma from '../../prisma.config';

const EstadoEvento = { BORRADOR: 'BORRADOR', ABIERTO: 'ABIERTO' } as const;

async function resolveCampeonato(campeonatoId?: string) {
  let campeonato = null;
  if (campeonatoId) {
    campeonato = await prisma.campeonato.findUnique({ where: { id: String(campeonatoId) } }).catch(() => null);
    if (!campeonato) {
      campeonato = await prisma.campeonato.findFirst({ where: { nombre: String(campeonatoId) } }).catch(() => null);
    }
  }

  if (!campeonato) {
    campeonato = await prisma.campeonato.findFirst({ where: { nombre: "Campeonato Nacional MWT" } });
    if (!campeonato) {
      campeonato = await prisma.campeonato.create({
        data: { nombre: "Campeonato Nacional MWT", anio: new Date().getFullYear(), esta_activo: true },
      });
    }
  }

  return campeonato;
}

async function upsertEventoToDb(data: any, estado: string, visiblePortada: boolean) {
  // Circuito: se respeta el enviado por el formulario; si no llega, se usa el
  // circuito por defecto del organizador o se crea.
  let circuito = null;
  if (data.circuito_id) {
    circuito = await prisma.circuito
      .findUnique({ where: { id: String(data.circuito_id) } })
      .catch(() => null);
    if (!circuito) {
      circuito = await prisma.circuito
        .findFirst({ where: { nombre: String(data.circuito_id) } })
        .catch(() => null);
    }
  }
  if (!circuito) {
    circuito = await prisma.circuito.findFirst({ where: { nombre: "Autódromo Los Volcanes" } });
    if (!circuito) {
      circuito = await prisma.circuito.create({ data: { nombre: "Autódromo Los Volcanes", esta_activo: true } });
    }
  }

  const campeonato = await resolveCampeonato(data.campeonato_id);

  const fechaInicio = new Date(data.fecha_inicio);
  const fechaFin = new Date(data.fecha_fin);
  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD o ISO.');
  }
  if (fechaFin.getTime() < fechaInicio.getTime()) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  const eventoId = data.id ? String(data.id) : null;
  const existingById = eventoId
    ? await prisma.evento.findUnique({ where: { id: eventoId } })
    : null;

  if (existingById && existingById.campeonato_id !== campeonato.id) {
    const inscripciones = await prisma.inscripcion.count({ where: { evento_id: existingById.id } });
    if (inscripciones > 0) {
      throw new Error(
        'No se puede cambiar el campeonato de una fecha con inscripciones. Edite la fecha con su campeonato actual para conservarlas.'
      );
    }
  }

  const payload = {
    campeonato_id: campeonato.id,
    circuito_id: circuito.id,
    nombre: data.nombre,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    estado: (data.estado || existingById?.estado || estado) as any,
    visible_portada: data.visible_portada !== undefined
      ? Boolean(data.visible_portada)
      : existingById?.visible_portada ?? visiblePortada,
    costo_base: Number(data.costo_base ?? 0),
  };

  let resultado: any = null;
  let accion: 'INSERT' | 'UPDATE' = 'INSERT';

  // 1) If an id is provided and exists, just update it (no duplicate).
  if (eventoId) {
    if (existingById) {
      resultado = await prisma.evento.update({ where: { id: eventoId }, data: payload });
      accion = 'UPDATE';
    }
  }

  // 2) For new events, reuse any event with the same name + dates to avoid duplicates.
  if (!resultado) {
    const existing = await prisma.evento.findFirst({
      where: {
        nombre: payload.nombre,
        fecha_inicio: payload.fecha_inicio,
        fecha_fin: payload.fecha_fin,
      },
    });

    if (existing) {
      resultado = await prisma.evento.update({ where: { id: existing.id }, data: payload });
      accion = 'UPDATE';
    } else {
      resultado = await prisma.evento.create({ data: payload });
      accion = 'INSERT';
    }
  }

  if (data.usuario_id) {
    await prisma.auditoria.create({
      data: {
        usuario_id: String(data.usuario_id),
        tabla_afectada: 'eventos',
        accion,
        registro_id: resultado.id,
        valor_nuevo: {
          id: resultado.id,
          nombre: resultado.nombre,
          estado: resultado.estado,
          visible_portada: resultado.visible_portada,
        },
      },
    });
  }

  return resultado;
}

export async function publishEventoToDb(data: any) {
  return upsertEventoToDb(data, EstadoEvento.ABIERTO as any, true);
}

export async function saveDraftEventoToDb(data: any) {
  return upsertEventoToDb(data, EstadoEvento.BORRADOR as any, false);
}

export async function deleteEventoFromDb(eventoId: string, usuarioId?: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true, nombre: true } });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  // Prisma 3.15 does not support interactive transactions (async callback).
  // Use the array form: every element must be a PrismaPromise.
  const operaciones: any[] = [
    prisma.apelacion.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.sancion.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.resultadoTiempo.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.accesoDocumento.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.revisionTecnica.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.pago.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.inscripcionMotocicleta.deleteMany({ where: { inscripcion: { evento_id: eventoId } } }),
    prisma.inscripcion.deleteMany({ where: { evento_id: eventoId } }),
    prisma.patrocinadorEvento.deleteMany({ where: { evento_id: eventoId } }),
    prisma.notificacion.deleteMany({ where: { evento_id: eventoId } }),
    prisma.documentoEvento.deleteMany({ where: { evento_id: eventoId } }),
    prisma.galeriaFoto.deleteMany({ where: { evento_id: eventoId } }),
    prisma.configuracionPago.deleteMany({ where: { evento_id: eventoId } }),
    prisma.grupoCategoriaEvento.deleteMany({ where: { evento_id: eventoId } }),
    prisma.actividadCronograma.deleteMany({ where: { evento_id: eventoId } }),
    // heats cascade to the event via the DB FK (ON DELETE CASCADE), and their
    // resultados/comentarios have already been removed through inscripciones.
    prisma.evento.delete({ where: { id: eventoId } }),
  ];

  if (usuarioId) {
    operaciones.push(
      prisma.auditoria.create({
        data: {
          usuario_id: String(usuarioId),
          tabla_afectada: 'eventos',
          accion: 'DELETE',
          registro_id: eventoId,
          valor_anterior: { id: evento.id, nombre: evento.nombre },
        },
      })
    );
  }

  await prisma.$transaction(operaciones);

  return { ok: true, id: eventoId };
}