import { PrismaClient, EstadoInscripcion } from "@prisma/client";

const prisma = new PrismaClient();

type CreateInscripcionInput = {
  evento_id?: string;
  piloto_id?: string;
  categoria_id?: string;
  motocicleta_id?: string;
  estado?: EstadoInscripcion | string;
  dorsal_asignado?: number | string;
};

async function resolveEvento(value?: string) {
  if (!value) return null;
  const byId = await prisma.evento.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId;
  return prisma.evento.findFirst({ where: { nombre: value } }).catch(() => null);
}

async function resolveCategoria(value?: string) {
  if (!value) return null;
  const byId = await prisma.categoria.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId;
  return prisma.categoria.findFirst({ where: { nombre: value } }).catch(() => null);
}

async function resolveMotocicleta(value?: string) {
  if (!value) return null;
  const byId = await prisma.motocicleta.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId;
  return prisma.motocicleta.findFirst({ where: { OR: [{ modelo: value }, { vin: value }, { apodo_moto: value }] } }).catch(() => null);
}

async function resolvePiloto(value?: string) {
  if (!value) return null;
  const byId = await prisma.perfilPiloto.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId;
  return prisma.perfilPiloto.findFirst({
    where: {
      usuario: {
        OR: [{ email: value }, { nombre: value }, { apellido: value }],
      },
    },
    include: { usuario: true },
  }).catch(() => null);
}

const inscripcionDetailInclude = {
  evento: true,
  piloto: { include: { usuario: true } },
  categoria: true,
  motocicleta: { include: { marca: true, piloto: { include: { usuario: true } } } },
  historial_motocicletas: {
    include: {
      motocicleta: {
        include: {
          marca: true,
        },
      },
    },
  },
} as const;

export async function createInscripcionToDb(input: CreateInscripcionInput) {
  const evento = await resolveEvento(input.evento_id);
  const piloto = await resolvePiloto(input.piloto_id);
  const categoria = await resolveCategoria(input.categoria_id);
  const motocicleta = await resolveMotocicleta(input.motocicleta_id);

  if (!evento) throw new Error("Evento no encontrado");

  // Coordinación 100% con el módulo de Eventos: una fecha solo admite
  // inscripciones cuando está mostrada (publicada en portada) y en un
  // estado activo del ciclo del evento.
  const estadosInscribibles = ["ABIERTO", "EN_CURSO", "FINALIZADO"];
  if (!evento.visible_portada || !estadosInscribibles.includes(String(evento.estado))) {
    throw new Error("El evento no está mostrado en el módulo de Eventos: publica la fecha en Eventos para habilitar inscripciones");
  }
  if (!piloto) throw new Error("Piloto no encontrado");
  if (!categoria) throw new Error("Categoría no encontrada");
  if (!motocicleta) throw new Error("Motocicleta no encontrada");

  if (categoria.campeonato_id !== evento.campeonato_id) {
    throw new Error("La categoría no pertenece al campeonato del evento seleccionado");
  }

  if (motocicleta.piloto_id !== piloto.id) {
    throw new Error("La motocicleta no pertenece al piloto seleccionado");
  }

  const cilindradaMoto = Number(motocicleta.cilindrada_real);
  const cilindradaMin = categoria.cilindrada_min != null ? Number(categoria.cilindrada_min) : null;
  const cilindradaMax = categoria.cilindrada_max != null ? Number(categoria.cilindrada_max) : null;

  if (Number.isFinite(cilindradaMoto)) {
    const belowMin = cilindradaMin != null && Number.isFinite(cilindradaMin) && cilindradaMoto < cilindradaMin;
    const aboveMax = cilindradaMax != null && Number.isFinite(cilindradaMax) && cilindradaMoto > cilindradaMax;
    if (belowMin || aboveMax) {
      const rango =
        cilindradaMin != null && cilindradaMax != null
          ? `${cilindradaMin}-${cilindradaMax} cc`
          : cilindradaMin != null
            ? `mínimo ${cilindradaMin} cc`
            : cilindradaMax != null
              ? `máximo ${cilindradaMax} cc`
              : "la cilindrada permitida";
      throw new Error(`No puede ingresar a esta categoría porque la cilindrada de su moto (${cilindradaMoto} cc) no cumple el rango ${rango}.`);
    }
  }

  const dorsal = Number(input.dorsal_asignado);
  if (!Number.isFinite(dorsal)) throw new Error("Dorsal inválido");

  const estado = String(input.estado || "PENDIENTE").toUpperCase() as EstadoInscripcion;

  const existing = await prisma.inscripcion.findFirst({
    where: {
      evento_id: evento.id,
      piloto_id: piloto.id,
      categoria_id: categoria.id,
    },
    select: {
      id: true,
      dorsal_asignado: true,
      motocicleta_id: true,
      estado: true,
    },
  });

  const duplicateDorsalWhere: any = {
    evento_id: evento.id,
    categoria_id: categoria.id,
    dorsal_asignado: dorsal,
  };

  if (existing?.id) {
    duplicateDorsalWhere.id = { not: existing.id };
  }

  const duplicateDorsal = await prisma.inscripcion.findFirst({
    where: duplicateDorsalWhere,
    select: { id: true },
  });

  if (duplicateDorsal) {
    throw new Error('El dorsal ya está ocupado en esta categoría para este evento.');
  }

  // Prisma 3.x in this project does not support interactive callback transactions.
  // Use sequential queries to avoid runtime error: "promises.map is not a function".
  if (existing) {
    // Keep one inscripción per piloto+evento+categoría and keep the same dorsal.
    // If the pilot is adding another motorcycle, register it in the relation table
    // instead of creating another inscripción.
    if (Number(existing.dorsal_asignado) !== Number(dorsal)) {
      throw new Error(`Este piloto ya está inscrito en esta categoría/evento con el dorsal #${existing.dorsal_asignado}.`);
    }

    const updated = await prisma.inscripcion.update({
      where: { id: existing.id },
      data: {
        estado,
      },
    });

    const hasMotoLinked = await prisma.inscripcionMotocicleta.findFirst({
      where: {
        inscripcion_id: existing.id,
        motocicleta_id: motocicleta.id,
      },
      select: { id: true },
    });

    if (!hasMotoLinked) {
      await prisma.inscripcionMotocicleta.create({
        data: {
          inscripcion_id: updated.id,
          motocicleta_id: motocicleta.id,
        },
      });
    }

    return prisma.inscripcion.findUnique({ where: { id: updated.id }, include: inscripcionDetailInclude });
  }

  const created = await prisma.inscripcion.create({
    data: {
      evento_id: evento.id,
      piloto_id: piloto.id,
      categoria_id: categoria.id,
      motocicleta_id: motocicleta.id,
      estado,
      dorsal_asignado: dorsal,
    },
    include: inscripcionDetailInclude,
  });

  await prisma.inscripcionMotocicleta.create({
    data: {
      inscripcion_id: created.id,
      motocicleta_id: motocicleta.id,
    },
  });

  return prisma.inscripcion.findUnique({ where: { id: created.id }, include: inscripcionDetailInclude });
}

export async function updateInscripcionStatus(inscripcionId: string, updates: { estado?: string; dorsal_asignado?: number }, usuario_operador_id?: string) {
  if (!inscripcionId) throw new Error('inscripcion_id es requerido');

  const ins = await prisma.inscripcion.findUnique({ where: { id: inscripcionId } });
  if (!ins) throw new Error('Inscripción no encontrada');

  const data: any = {};
  if (updates.estado !== undefined) data.estado = String(updates.estado).toUpperCase();
  if (updates.dorsal_asignado !== undefined) data.dorsal_asignado = Number(updates.dorsal_asignado);

  if (data.dorsal_asignado !== undefined && Number.isFinite(Number(data.dorsal_asignado))) {
    const duplicate = await prisma.inscripcion.findFirst({
      where: {
        id: { not: inscripcionId },
        evento_id: ins.evento_id,
        categoria_id: ins.categoria_id,
        dorsal_asignado: Number(data.dorsal_asignado),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new Error('El dorsal ya está ocupado en esta categoría para este evento.');
    }
  }

  const updated = await prisma.inscripcion.update({ where: { id: inscripcionId }, data });

  if (usuario_operador_id) {
    // Resolve posible mismatch: frontend may supply a perfilPiloto id instead of Usuario.id
    let usuarioIdForAudit = usuario_operador_id;
    try {
      const userExists = await prisma.usuario.findUnique({ where: { id: usuario_operador_id } });
      if (!userExists) {
        // Try resolving as PerfilPiloto -> take its usuario_id
        const perfil = await prisma.perfilPiloto.findUnique({ where: { id: usuario_operador_id } });
        if (perfil && perfil.usuario_id) usuarioIdForAudit = perfil.usuario_id;
      }
    } catch (e) {
      // ignore resolution errors and proceed with original id (create may fail and bubble up)
    }

    try {
      const auditPayload: any = {
        tabla_afectada: 'inscripciones',
        accion: 'UPDATE',
        registro_id: inscripcionId,
        valor_nuevo: data,
      };

      // Only include usuario_id if it maps to a real Usuario.id
      if (usuarioIdForAudit) {
        const exists = await prisma.usuario.findUnique({ where: { id: usuarioIdForAudit } });
        if (exists) auditPayload.usuario_id = usuarioIdForAudit;
      }

      await prisma.auditoria.create({ data: auditPayload });
    } catch (auditErr: any) {
      // Audit failure should not block the main operation; log and continue
      // Use console.error so dev logs capture the cause
      // If you want to surface this to the client, change to rethrow
      console.error('[admin.inscripciones] auditoria.create failed:', auditErr?.message || auditErr);
    }
  }

  return updated;
}

export async function deleteInscripcionById(inscripcionId: string) {
  if (!inscripcionId) throw new Error('inscripcion_id es requerido');

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    select: { id: true },
  });

  if (!inscripcion) throw new Error('Inscripción no encontrada');

  // Delete child records first because several relations are not configured with onDelete: Cascade.
  await prisma.apelacion.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.sancion.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.accesoDocumento.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.resultadoTiempo.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.inscripcionMotocicleta.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.revisionTecnica.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.pago.deleteMany({
    where: { inscripcion_id: inscripcionId },
  });

  await prisma.inscripcion.delete({
    where: { id: inscripcionId },
  });

  return { ok: true, id: inscripcionId };
}
