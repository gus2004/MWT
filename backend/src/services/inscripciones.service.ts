import { EstadoInscripcion, EstadoRevision, Prisma } from '@prisma/client';
import prisma from '../../prisma.config';

type CrearInscripcionInput = {
  evento_id: string;
  piloto_id: string; // usuario.id from UI
  categoria_id: string;
  motocicleta_id: string;
  dorsal_asignado: number;
  metodo_pago: string;
  id_transaccion?: string | null;
  nit_factura?: string | null;
  nombre_factura?: string | null;
  direccion_factura?: string | null;
  usuario_id: string; // operador
};

const ESTADOS_ACTIVOS_INSCRIPCION: EstadoInscripcion[] = [
  EstadoInscripcion.PENDIENTE,
  EstadoInscripcion.PAGADA,
  EstadoInscripcion.VALIDADA,
];

async function resolvePerfilPilotoByUsuarioIdOrPerfilId(pilotoId: string) {
  const byPerfilId = await prisma.perfilPiloto.findUnique({ where: { id: pilotoId } });
  if (byPerfilId) return byPerfilId;

  return prisma.perfilPiloto.findUnique({ where: { usuario_id: pilotoId } });
}

export async function getEventosDisponibles() {
  return prisma.evento.findMany({
    where: { estado: 'ABIERTO' },
    select: {
      id: true,
      nombre: true,
      fecha_inicio: true,
      fecha_fin: true,
      circuito: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: [{ fecha_inicio: 'asc' }, { nombre: 'asc' }],
  });
}

export async function getCategoriasPorEvento(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { id: true, campeonato_id: true },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  return prisma.categoria.findMany({
    where: { campeonato_id: evento.campeonato_id },
    select: {
      id: true,
      nombre: true,
      cilindrada_min: true,
      cilindrada_max: true,
      precio_inscripcion: true,
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function buscarPiloto(term: string) {
  return prisma.usuario.findMany({
    where: {
      OR: [
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { perfil_personal: { cui: { contains: term, mode: 'insensitive' } } },
      ],
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      perfil_personal: { select: { cui: true } },
      perfil_piloto: { select: { dorsal_preferido: true } },
    },
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
    take: 30,
  });
}

export async function validarPiloto(input: { piloto_id: string; evento_id: string; categoria_id: string }) {
  const perfil = await resolvePerfilPilotoByUsuarioIdOrPerfilId(input.piloto_id);
  if (!perfil) {
    throw new Error('Piloto no encontrado.');
  }

  const yaInscrito = await prisma.inscripcion.findFirst({
    where: {
      evento_id: input.evento_id,
      categoria_id: input.categoria_id,
      piloto_id: perfil.id,
    },
    select: { id: true },
  });

  if (yaInscrito) {
    return {
      disponible: false,
      mensaje: 'Este piloto ya está inscrito en esta categoría para el evento seleccionado',
      motocicletas: [],
    };
  }

  const motocicletas = await prisma.motocicleta.findMany({
    where: { piloto_id: perfil.id },
    select: {
      id: true,
      modelo: true,
      anio: true,
      cilindrada_real: true,
      marca: { select: { nombre: true } },
    },
    orderBy: [{ modelo: 'asc' }, { anio: 'desc' }],
  });

  return {
    disponible: true,
    motocicletas: motocicletas.map((m) => ({
      id: m.id,
      marca: m.marca.nombre,
      modelo: m.modelo,
      anio: m.anio,
      cilindrada_real: m.cilindrada_real,
    })),
  };
}

export async function dorsalDisponible(input: { evento_id: string; categoria_id: string; dorsal: number }) {
  const existente = await prisma.inscripcion.findFirst({
    where: {
      evento_id: input.evento_id,
      categoria_id: input.categoria_id,
      dorsal_asignado: input.dorsal,
      estado: { in: ESTADOS_ACTIVOS_INSCRIPCION },
    },
    select: { id: true },
  });

  if (existente) {
    return { disponible: false, mensaje: 'Dorsal ya asignado en esta categoría' };
  }

  return { disponible: true };
}

type DorsalesDisponiblesInput = {
  categoria_id: string;
  evento_id?: string;
};

function isEstadoActivo(estado?: EstadoInscripcion | string | null) {
  return ESTADOS_ACTIVOS_INSCRIPCION.includes(String(estado || '').toUpperCase() as EstadoInscripcion);
}

export async function getDorsalesDisponibles(input: DorsalesDisponiblesInput) {
  const categoriaId = input.categoria_id?.trim();
  if (!categoriaId) {
    throw new Error('categoria_id es requerido.');
  }

  const categoria = await prisma.categoria.findUnique({
    where: { id: categoriaId },
    select: {
      id: true,
      campeonato_id: true,
    },
  });

  if (!categoria) {
    throw new Error('Categoría no encontrada.');
  }

  const evento = input.evento_id?.trim()
    ? await prisma.evento.findUnique({
        where: { id: input.evento_id.trim() },
        select: {
          id: true,
          campeonato_id: true,
          fecha_inicio: true,
        },
      })
    : await prisma.evento.findFirst({
        where: {
          campeonato_id: categoria.campeonato_id,
        },
        select: {
          id: true,
          campeonato_id: true,
          fecha_inicio: true,
        },
        orderBy: [{ fecha_inicio: 'desc' }, { id: 'desc' }],
      });

  if (!evento) {
    return { items: [] };
  }

  if (evento.campeonato_id !== categoria.campeonato_id) {
    throw new Error('La categoría no pertenece al campeonato del evento seleccionado.');
  }

  const eventos = await prisma.evento.findMany({
    where: {
      campeonato_id: categoria.campeonato_id,
      fecha_inicio: {
        lte: evento.fecha_inicio,
      },
    },
    select: {
      id: true,
      fecha_inicio: true,
    },
    orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }],
  });

  const eventIndexById = new Map<string, number>();
  eventos.forEach((row, index) => {
    eventIndexById.set(row.id, index);
  });

  const currentEventIndex = eventIndexById.get(evento.id) ?? eventos.length - 1;
  const recentEvents = eventos.slice(0, currentEventIndex);
  const recentEventIds = recentEvents.map((row) => row.id);

  const inscripciones = await prisma.inscripcion.findMany({
    where: {
      categoria_id: categoria.id,
      evento: {
        campeonato_id: categoria.campeonato_id,
      },
      estado: {
        in: ESTADOS_ACTIVOS_INSCRIPCION,
      },
    },
    select: {
      dorsal_asignado: true,
      piloto_id: true,
      evento_id: true,
    },
    orderBy: [{ fecha_registro: 'asc' }, { evento_id: 'asc' }],
  });

  const dorsalesOcupadosEnEvento = await prisma.inscripcion.findMany({
    where: {
      categoria_id: categoria.id,
      evento_id: evento.id,
      estado: {
        in: ESTADOS_ACTIVOS_INSCRIPCION,
      },
    },
    select: {
      dorsal_asignado: true,
    },
  });

  const dorsalesOcupados = new Set(dorsalesOcupadosEnEvento.map((row) => row.dorsal_asignado));
  const historialPorPiloto = new Map<string, Set<string>>();
  const ultimoPorDorsal = new Map<number, { piloto_id: string; evento_id: string; evento_index: number }>();

  for (const row of inscripciones) {
    const eventIndex = eventIndexById.get(row.evento_id);
    if (eventIndex === undefined) continue;

    if (!historialPorPiloto.has(row.piloto_id)) {
      historialPorPiloto.set(row.piloto_id, new Set<string>());
    }

    historialPorPiloto.get(row.piloto_id)!.add(row.evento_id);
    ultimoPorDorsal.set(row.dorsal_asignado, {
      piloto_id: row.piloto_id,
      evento_id: row.evento_id,
      evento_index: eventIndex,
    });
  }

  const disponibles: number[] = [];

  for (let dorsal = 1; dorsal <= 99; dorsal += 1) {
    if (dorsalesOcupados.has(dorsal)) {
      continue;
    }

    const ultimo = ultimoPorDorsal.get(dorsal);
    if (!ultimo) {
      disponibles.push(dorsal);
      continue;
    }

    const eventosPosteriores = eventos.slice(ultimo.evento_index + 1, currentEventIndex);
    let rachaAusencia = 0;

    for (const eventoPosterior of eventosPosteriores) {
      const participo = historialPorPiloto.get(ultimo.piloto_id)?.has(eventoPosterior.id) ?? false;

      if (participo) {
        rachaAusencia = 0;
      } else {
        rachaAusencia += 1;
      }
    }

    if (rachaAusencia >= 3) {
      disponibles.push(dorsal);
    }
  }

  return {
    items: disponibles,
    evento: {
      id: evento.id,
      fecha_inicio: evento.fecha_inicio,
    },
    categoria: {
      id: categoria.id,
      campeonato_id: categoria.campeonato_id,
    },
  };
}

export async function dorsalesTomados(input: { evento_id: string; categoria_id: string }) {
  const rows = await prisma.inscripcion.findMany({
    where: {
      evento_id: input.evento_id,
      categoria_id: input.categoria_id,
      estado: { in: ESTADOS_ACTIVOS_INSCRIPCION },
    },
    select: { dorsal_asignado: true },
    orderBy: { dorsal_asignado: 'asc' },
  });

  return rows.map((r) => r.dorsal_asignado);
}

export async function crearInscripcion(input: CrearInscripcionInput) {
  const perfil = await resolvePerfilPilotoByUsuarioIdOrPerfilId(input.piloto_id);
  if (!perfil) {
    throw new Error('Piloto no encontrado.');
  }

  const categoria = await prisma.categoria.findUnique({
    where: { id: input.categoria_id },
    select: { id: true, precio_inscripcion: true, campeonato_id: true },
  });

  if (!categoria) {
    throw new Error('Categoría no encontrada.');
  }

  const evento = await prisma.evento.findUnique({
    where: { id: input.evento_id },
    select: { id: true, campeonato_id: true },
  });

  if (!evento) {
    throw new Error('Evento no encontrado.');
  }

  if (evento.campeonato_id !== categoria.campeonato_id) {
    throw new Error('La categoría no corresponde al evento seleccionado.');
  }

  const motocicleta = await prisma.motocicleta.findUnique({
    where: { id: input.motocicleta_id },
    select: { id: true, piloto_id: true },
  });

  if (!motocicleta) {
    throw new Error('Motocicleta no encontrada.');
  }

  if (motocicleta.piloto_id !== perfil.id) {
    throw new Error('La motocicleta seleccionada no pertenece al piloto.');
  }

  const idTransaccionFinal =
    (input.id_transaccion || '').trim() ||
    `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  try {
    const resultado = await (prisma.$transaction as any)(async (tx: any) => {
      // 1) Revalidar dorsal dentro de transacción para evitar carrera.
      const dorsalOcupado = await tx.inscripcion.findFirst({
        where: {
          evento_id: input.evento_id,
          categoria_id: input.categoria_id,
          dorsal_asignado: input.dorsal_asignado,
          estado: { in: ESTADOS_ACTIVOS_INSCRIPCION },
        },
        select: { id: true },
      });

      if (dorsalOcupado) {
        const e = new Error('El dorsal ya fue asignado por otro usuario al mismo tiempo, elige otro número') as Error & {
          code?: string;
        };
        e.code = 'P2002';
        throw e;
      }

      // 2) Crear inscripción en estado PENDIENTE.
      const inscripcion = await tx.inscripcion.create({
        data: {
          evento_id: input.evento_id,
          piloto_id: perfil.id,
          categoria_id: input.categoria_id,
          motocicleta_id: input.motocicleta_id,
          dorsal_asignado: input.dorsal_asignado,
          estado: EstadoInscripcion.PENDIENTE,
        },
      });

      // 3) Crear pago ligado a inscripción.
      const pago = await tx.pago.create({
        data: {
          inscripcion_id: inscripcion.id,
          monto: categoria.precio_inscripcion,
          metodo_pago: input.metodo_pago,
          id_transaccion: idTransaccionFinal,
          estado_pago: 'CONFIRMADO',
          moneda: 'GTQ',
          nit_factura: input.nit_factura || null,
          nombre_factura: input.nombre_factura || null,
          direccion_factura: input.direccion_factura || null,
        },
      });

      // 4) Crear revisión técnica en PENDIENTE.
      const revision = await tx.revisionTecnica.create({
        data: {
          inscripcion_id: inscripcion.id,
          usuario_id: input.usuario_id,
          motocicleta_id: input.motocicleta_id,
          estado: EstadoRevision.PENDIENTE,
        },
      });

      // 5) Registrar auditoría.
      await tx.auditoria.create({
        data: {
          usuario_id: input.usuario_id,
          tabla_afectada: 'inscripciones',
          accion: 'INSERT',
          registro_id: inscripcion.id,
          valor_nuevo: {
            evento_id: input.evento_id,
            piloto_id: perfil.id,
            categoria_id: input.categoria_id,
            motocicleta_id: input.motocicleta_id,
            dorsal_asignado: input.dorsal_asignado,
            estado: EstadoInscripcion.PENDIENTE,
            metodo_pago: input.metodo_pago,
            id_transaccion: idTransaccionFinal,
            monto: categoria.precio_inscripcion,
            moneda: 'GTQ',
            nit_factura: input.nit_factura || null,
            nombre_factura: input.nombre_factura || null,
            direccion_factura: input.direccion_factura || null,
            pago_id: pago.id,
            revision_tecnica_id: revision.id,
          },
        },
      });

      return { inscripcion, pago, revision_tecnica: revision };
    });

    return resultado;
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error;
    }

    throw new Error('No se pudo completar la inscripción.');
  }
}
