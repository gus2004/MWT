import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  // Ensure circuito 'Autódromo Los Volcanes' exists
  let circuito = await prisma.circuito.findFirst({ where: { nombre: "Autódromo Los Volcanes" } });
  if (!circuito) {
    circuito = await prisma.circuito.create({ data: { nombre: "Autódromo Los Volcanes", esta_activo: true } });
  }

  const campeonato = await resolveCampeonato(data.campeonato_id);

  const payload = {
    campeonato_id: campeonato.id,
    circuito_id: circuito.id,
    nombre: data.nombre,
    fecha_inicio: new Date(data.fecha_inicio),
    fecha_fin: new Date(data.fecha_fin),
    estado: estado as any,
    visible_portada: visiblePortada,
    costo_base: Number(data.costo_base ?? 0),
  };

  const eventoId = data.id ? String(data.id) : null;

  // 1) If an id is provided and exists, just update it (no duplicate).
  if (eventoId) {
    const existingById = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (existingById) {
      return prisma.evento.update({ where: { id: eventoId }, data: payload });
    }
  }

  // 2) For new events, reuse any event with the same name + dates to avoid duplicates.
  const existing = await prisma.evento.findFirst({
    where: {
      nombre: payload.nombre,
      fecha_inicio: payload.fecha_inicio,
      fecha_fin: payload.fecha_fin,
    },
  });

  if (existing) {
    return prisma.evento.update({ where: { id: existing.id }, data: payload });
  }

  return prisma.evento.create({ data: payload });
}

export async function publishEventoToDb(data: any) {
  return upsertEventoToDb(data, EstadoEvento.ABIERTO as any, true);
}

export async function saveDraftEventoToDb(data: any) {
  return upsertEventoToDb(data, EstadoEvento.BORRADOR as any, false);
}

export async function deleteEventoFromDb(eventoId: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  // Prisma 3.15 does not support interactive transactions (async callback).
  // Use the array form: every element must be a PrismaPromise.
  await prisma.$transaction([
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
  ]);

  return { ok: true, id: eventoId };
}