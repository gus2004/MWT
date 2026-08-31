import prisma from '../../prisma.config';

// ─────────────────────────────────────────────
//  SANCIONES (comisariato)
//  La columna `gravedad` se reutiliza como estado
//  del flujo de trabajo: PENDIENTE | EN_PROCESO | RESUELTO
// ─────────────────────────────────────────────

function sancionToView(s: any) {
  return {
    id: s.id,
    inscripcion_id: s.inscripcion_id,
    comisario_id: s.comisario_id,
    tipo_sancion_id: s.tipo_sancion_id,
    motivo: s.motivo,
    estado: s.gravedad || 'PENDIENTE',
    penalizacion: s.penalizacion,
    fecha_sancion: s.fecha_sancion,
    tipo: s.tipo_sancion || null,
    comisario: s.comisario
      ? { nombre: s.comisario.nombre, apellido: s.comisario.apellido }
      : null,
    piloto: s.inscripcion
      ? {
          nombre: s.inscripcion.piloto?.usuario?.nombre,
          apellido: s.inscripcion.piloto?.usuario?.apellido,
          dorsal_asignado: s.inscripcion.dorsal_asignado,
        }
      : null,
    evento: s.inscripcion?.evento
      ? { id: s.inscripcion.evento.id, nombre: s.inscripcion.evento.nombre }
      : null,
    categoria: s.inscripcion?.categoria
      ? { id: s.inscripcion.categoria.id, nombre: s.inscripcion.categoria.nombre }
      : null,
    apelacion: s.apelacion
      ? {
          id: s.apelacion.id,
          motivo: s.apelacion.motivo,
          estado: s.apelacion.estado,
          resolucion: s.apelacion.resolucion,
          fecha: s.apelacion.fecha,
        }
      : null,
  };
}

export async function listSanciones() {
  const rows = await prisma.sancion.findMany({
    orderBy: { fecha_sancion: 'desc' },
    include: {
      tipo_sancion: true,
      comisario: { select: { nombre: true, apellido: true } },
      apelacion: true,
      inscripcion: {
        include: {
          evento: true,
          categoria: true,
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
    },
  });
  return rows.map(sancionToView);
}

export async function createSancion(input: {
  inscripcion_id: string;
  comisario_id?: string;
  tipo_sancion_id?: string;
  motivo: string;
  estado?: string;
  penalizacion?: string;
}) {
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: input.inscripcion_id },
    select: { id: true },
  });
  if (!inscripcion) throw new Error('La inscripción especificada no existe.');

  return prisma.sancion.create({
    data: {
      inscripcion_id: input.inscripcion_id,
      comisario_id: input.comisario_id || '',
      tipo_sancion_id: input.tipo_sancion_id || null,
      motivo: input.motivo.trim(),
      gravedad: (input.estado || 'PENDIENTE').toUpperCase(),
      penalizacion: input.penalizacion?.trim() || '',
    },
    include: { tipo_sancion: true },
  });
}

export async function updateSancion(id: string, input: {
  estado?: string;
  motivo?: string;
  penalizacion?: string;
  tipo_sancion_id?: string;
}) {
  const existing = await prisma.sancion.findUnique({ where: { id } });
  if (!existing) throw new Error('La sanción no existe.');

  return prisma.sancion.update({
    where: { id },
    data: {
      ...(input.motivo !== undefined ? { motivo: input.motivo.trim() } : {}),
      ...(input.penalizacion !== undefined ? { penalizacion: input.penalizacion.trim() } : {}),
      ...(input.estado !== undefined ? { gravedad: input.estado.toUpperCase() } : {}),
      ...(input.tipo_sancion_id !== undefined ? { tipo_sancion_id: input.tipo_sancion_id || null } : {}),
    },
  });
}

// ─────────────────────────────────────────────
//  TIPOS DE SANCIÓN
// ─────────────────────────────────────────────

const TIPOS_POR_DEFECTO = [
  'Conducta peligrosa',
  'Bandera ignorada',
  'Velocidad pit lane',
  'Corte de trayectoria',
  'Contacto deliberado',
  'Exceso de temperatura',
  'Falta técnica',
];

export async function listTiposSancion() {
  let rows = await prisma.tipoSancion.findMany({ orderBy: { nombre: 'asc' } });
  if (rows.length === 0) {
    await prisma.tipoSancion.createMany({
      data: TIPOS_POR_DEFECTO.map((nombre) => ({ nombre, descripcion: null })),
      skipDuplicates: true,
    });
    rows = await prisma.tipoSancion.findMany({ orderBy: { nombre: 'asc' } });
  }
  return rows;
}

export async function createTipoSancion(input: { nombre: string; descripcion?: string }) {
  const nombre = input.nombre.trim();
  const existing = await prisma.tipoSancion.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' } } });
  if (existing) throw new Error('Ya existe un tipo de sanción con ese nombre.');
  return prisma.tipoSancion.create({ data: { nombre, descripcion: input.descripcion?.trim() || null } });
}

// ─────────────────────────────────────────────
//  APELACIONES
// ─────────────────────────────────────────────

export async function listApelaciones() {
  return prisma.apelacion.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      sancion: { include: { tipo_sancion: true } },
      inscripcion: {
        include: {
          evento: true,
          categoria: true,
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
      comisario: { select: { nombre: true, apellido: true } },
    },
  });
}

export async function createApelacion(input: {
  sancion_id: string;
  inscripcion_id: string;
  piloto_id: string;
  motivo: string;
}) {
  const sancion = await prisma.sancion.findUnique({ where: { id: input.sancion_id }, select: { id: true } });
  if (!sancion) throw new Error('La sanción especificada no existe.');
  return prisma.apelacion.create({
    data: {
      sancion_id: input.sancion_id,
      inscripcion_id: input.inscripcion_id,
      piloto_id: input.piloto_id,
      motivo: input.motivo.trim(),
      estado: 'PENDIENTE',
    },
  });
}

export async function updateApelacion(id: string, input: {
  estado?: string;
  resolucion?: string;
  comisario_id?: string;
}) {
  const apelacion = await prisma.apelacion.findUnique({ where: { id } });
  if (!apelacion) throw new Error('La apelación no existe.');
  const estado = (input.estado || apelacion.estado).toUpperCase();
  if (!['PENDIENTE', 'ACEPTADA', 'RECHAZADA'].includes(estado)) {
    throw new Error('Estado de apelación inválido.');
  }

  const updated = await prisma.apelacion.update({
    where: { id },
    data: {
      estado,
      ...(input.resolucion !== undefined ? { resolucion: input.resolucion.trim() || null } : {}),
      ...(input.comisario_id ? { comisario_id: input.comisario_id } : {}),
    },
  });

  if (estado === 'ACEPTADA') {
    await prisma.sancion.update({
      where: { id: apelacion.sancion_id },
      data: { gravedad: 'RESUELTO' },
    });
  }

  return updated;
}

// ─────────────────────────────────────────────
//  REVISIÓN TÉCNICA
// ─────────────────────────────────────────────

export async function listItemsChecklist() {
  let rows = await prisma.itemChecklist.findMany({ orderBy: { nombre: 'asc' } });
  if (rows.length === 0) {
    const defaults = [
      'Frenos delanteros',
      'Frenos traseros',
      'Neumáticos',
      'Dirección y suspensión',
      'Chasis y carenado',
      'Aceite y líquidos',
      'Sistema eléctrico',
      'Equipo del piloto',
    ];
    await prisma.itemChecklist.createMany({
      data: defaults.map((nombre) => ({ nombre, descripcion: null })),
      skipDuplicates: true,
    });
    rows = await prisma.itemChecklist.findMany({ orderBy: { nombre: 'asc' } });
  }
  return rows;
}

export async function listRevisionesTecnicas() {
  return prisma.revisionTecnica.findMany({
    orderBy: { fecha_revision: 'desc' },
    include: {
      inscripcion: {
        include: {
          evento: true,
          categoria: true,
          motocicleta: { include: { marca: true } },
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
      comisario: { select: { nombre: true, apellido: true } },
      detalles: { include: { item: true } },
    },
  });
}

export async function updateRevisionTecnica(id: string, input: {
  estado?: string;
  observaciones?: string;
  detalles?: { item_id: string; esta_bien: boolean; comentario?: string | null }[];
}) {
  const revision = await prisma.revisionTecnica.findUnique({ where: { id } });
  if (!revision) throw new Error('La revisión técnica no existe.');

  if (input.detalles?.length) {
    await prisma.detalleRevision.deleteMany({ where: { revision_tecnica_id: id } });
    await prisma.detalleRevision.createMany({
      data: input.detalles.map((d) => ({
        revision_tecnica_id: id,
        item_id: d.item_id,
        esta_bien: d.esta_bien,
        comentario: d.comentario || null,
      })),
    });
  }

  return prisma.revisionTecnica.update({
    where: { id },
    data: {
      ...(input.estado ? { estado: input.estado.toUpperCase() as any } : {}),
      ...(input.observaciones !== undefined ? { observaciones: input.observaciones.trim() || null } : {}),
    },
  });
}

// ─────────────────────────────────────────────
//  NOTIFICACIONES Y PLANTILLAS
// ─────────────────────────────────────────────

export async function listNotificaciones(limit = 100) {
  return prisma.notificacion.findMany({
    orderBy: { fecha_envio: 'desc' },
    take: limit,
    include: {
      usuario: { select: { nombre: true, apellido: true } },
      evento: { select: { id: true, nombre: true } },
    },
  });
}

export async function createNotificacion(input: {
  usuario_id?: string;
  evento_id?: string;
  titulo: string;
  mensaje: string;
  tipo?: string;
}) {
  const data = {
    evento_id: input.evento_id || null,
    titulo: input.titulo.trim(),
    mensaje: input.mensaje.trim(),
    tipo: input.tipo?.trim() || 'general',
    leida: false,
  };

  if (input.usuario_id) {
    return prisma.notificacion.create({ data: { ...data, usuario_id: input.usuario_id } });
  }

  const usuarios = await prisma.usuario.findMany({ where: { esta_activo: true }, select: { id: true } });
  await prisma.notificacion.createMany({
    data: usuarios.map((u) => ({ ...data, usuario_id: u.id })),
  });
  return { ok: true, destinatarios: usuarios.length };
}

export async function marcarNotificacionLeida(id: string, leida = true) {
  return prisma.notificacion.update({ where: { id }, data: { leida } });
}

export async function listPlantillas() {
  return prisma.plantillaNotificacion.findMany({ orderBy: { clave: 'asc' } });
}

const PLANTILLAS_DEFECTO = [
  { clave: 'confirmacion_inscripcion', titulo: 'Confirmación de inscripción', cuerpo: 'Hola {nombre}, tu inscripción al evento {evento} fue confirmada.', tipo: 'inscripcion' },
  { clave: 'documentos_por_vencer', titulo: 'Documentos por vencer', cuerpo: 'Recordá renovar tu licencia antes del evento {evento}.', tipo: 'documento' },
  { clave: 'cambio_horario', titulo: 'Cambio de horario', cuerpo: 'El cronograma del evento {evento} fue modificado.', tipo: 'horario' },
  { clave: 'resultados_publicados', titulo: 'Resultados publicados', cuerpo: 'Los resultados del evento {evento} ya están disponibles.', tipo: 'resultados' },
  { clave: 'sancion_aplicada', titulo: 'Sanción aplicada', cuerpo: 'Se aplicó una sanción a tu inscripción en el evento {evento}.', tipo: 'sancion' },
  { clave: 'pago_pendiente', titulo: 'Pago pendiente', cuerpo: 'Tu inscripción al evento {evento} tiene un pago pendiente.', tipo: 'pago' },
  { clave: 'inscripcion_rechazada', titulo: 'Inscripción rechazada', cuerpo: 'Tu inscripción al evento {evento} fue rechazada.', tipo: 'inscripcion' },
  { clave: 'apertura_inscripciones', titulo: 'Apertura de inscripciones', cuerpo: 'Las inscripciones del evento {evento} están abiertas.', tipo: 'evento' },
  { clave: 'backup_completado', titulo: 'Backup completado', cuerpo: 'El respaldo del sistema se completó correctamente.', tipo: 'sistema' },
];

export async function listPlantillasConFallback() {
  const rows = await prisma.plantillaNotificacion.findMany({ orderBy: { clave: 'asc' } });
  if (rows.length === 0) {
    await prisma.plantillaNotificacion.createMany({ data: PLANTILLAS_DEFECTO, skipDuplicates: true });
    return prisma.plantillaNotificacion.findMany({ orderBy: { clave: 'asc' } });
  }
  return rows;
}

export async function createPlantilla(input: {
  clave: string;
  titulo: string;
  cuerpo: string;
  tipo?: string;
  descripcion?: string;
}) {
  const clave = input.clave.trim();
  const existing = await prisma.plantillaNotificacion.findUnique({ where: { clave } });
  if (existing) {
    return prisma.plantillaNotificacion.update({
      where: { clave },
      data: {
        titulo: input.titulo.trim(),
        cuerpo: input.cuerpo.trim(),
        tipo: input.tipo?.trim() || existing.tipo,
        descripcion: input.descripcion?.trim() || null,
      },
    });
  }
  return prisma.plantillaNotificacion.create({
    data: { clave, titulo: input.titulo.trim(), cuerpo: input.cuerpo.trim(), tipo: input.tipo?.trim() || 'general', descripcion: input.descripcion?.trim() || null },
  });
}

// ─────────────────────────────────────────────
//  PREFERENCIAS Y AUDITORÍA
// ─────────────────────────────────────────────

export async function listPreferencias() {
  return prisma.preferenciaSistema.findMany({ orderBy: { clave: 'asc' } });
}

export async function updatePreferencia(clave: string, valor: string) {
  const existing = await prisma.preferenciaSistema.findUnique({ where: { clave } });
  if (!existing) {
    return prisma.preferenciaSistema.create({ data: { clave, valor } });
  }
  return prisma.preferenciaSistema.update({ where: { clave }, data: { valor } });
}

export async function listAuditoria(limit = 200) {
  return prisma.auditoria.findMany({
    orderBy: { fecha: 'desc' },
    take: limit,
    include: { usuario: { select: { nombre: true, apellido: true } } },
  });
}

// ─────────────────────────────────────────────
//  REPORTES (resumen agregado)
// ─────────────────────────────────────────────

export async function getReporteResumen() {
  const [pilotos, eventos, inscripciones, sanciones, ingresos, marcaRows, crecimiento, eventosInsc] = await Promise.all([
    prisma.perfilPiloto.count(),
    prisma.evento.findMany({
      orderBy: { fecha_inicio: 'desc' },
      include: { circuito: true, campeonato: true },
    }),
    prisma.inscripcion.findMany({
      include: { evento: true, categoria: true, pago: true, motocicleta: { include: { marca: true } } },
    }),
    prisma.sancion.count(),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { estado_pago: 'CONFIRMADO' },
    }),
    prisma.motocicleta.groupBy({
      by: ['marca_id'],
      _count: { _all: true },
    }),
    prisma.usuario.groupBy({
      by: ['fecha_creacion'],
      _count: { _all: true },
      where: { esta_activo: true },
    }),
    prisma.inscripcion.groupBy({
      by: ['evento_id'],
      _count: { _all: true },
    }),
  ]);

  const marcass = await prisma.marcaMoto.findMany({ where: { id: { in: marcaRows.map((m) => m.marca_id) } } });
  const marcaMap = new Map(marcass.map((m) => [m.id, m.nombre]));

  const porEvento = eventos.map((ev) => {
    const total = inscripciones.filter((i) => i.evento_id === ev.id);
    const validas = total.filter((i) => i.estado === 'VALIDADA' || i.estado === 'PAGADA');
    return {
      evento_id: ev.id,
      evento: ev.nombre,
      fecha_inicio: ev.fecha_inicio,
      estado: ev.estado,
      inscripciones: total.length,
      validadas: validas.length,
    };
  });

  const crecimientoMensual: { mes: string; total: number }[] = [];
  const mesesMap = new Map<string, number>();
  for (const row of crecimiento) {
    const key = row.fecha_creacion.toISOString().slice(0, 7);
    mesesMap.set(key, (mesesMap.get(key) || 0) + row._count._all);
  }
  let acumulado = 0;
  for (const [mes, count] of Array.from(mesesMap.entries()).sort()) {
    acumulado += count;
    crecimientoMensual.push({ mes, total: acumulado });
  }

  const marcas = marcaRows.map((m) => ({
    nombre: marcaMap.get(m.marca_id) || 'Sin marca',
    count: m._count._all,
  })).sort((a, b) => b.count - a.count);

  const sancionesRecientes = await prisma.sancion.findMany({
    orderBy: { fecha_sancion: 'desc' },
    take: 8,
    include: {
      tipo_sancion: true,
      inscripcion: {
        include: {
          evento: true,
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
    },
  });

  const ahora = new Date();
  return {
    kpis: {
      participantes: pilotos,
      eventos: eventos.length,
      proximos: eventos.filter((ev) => ev.fecha_inicio > ahora && ev.estado !== 'CANCELADO').length,
      sanciones,
      ingresos: ingresos._sum?.monto || 0,
    },
    inscripciones_por_evento: porEvento.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()).slice(0, 12),
    marcas,
    crecimiento: crecimientoMensual.slice(-8),
    sanciones_recientes: sancionesRecientes.map((s) => ({
      id: s.id,
      tipo: s.tipo_sancion?.nombre || 'Sanción',
      penalizacion: s.penalizacion,
      gravedad: s.gravedad,
      fecha: s.fecha_sancion,
      piloto: s.inscripcion?.piloto?.usuario
        ? `${s.inscripcion.piloto.usuario.nombre} ${s.inscripcion.piloto.usuario.apellido}`.trim()
        : '—',
      evento: s.inscripcion?.evento?.nombre || '—',
    })),
    estado_inscripciones: [
      { estado: 'PENDIENTE', count: inscripciones.filter((i) => i.estado === 'PENDIENTE').length },
      { estado: 'PAGADA', count: inscripciones.filter((i) => i.estado === 'PAGADA').length },
      { estado: 'VALIDADA', count: inscripciones.filter((i) => i.estado === 'VALIDADA').length },
      { estado: 'RECHAZADA', count: inscripciones.filter((i) => i.estado === 'RECHAZADA').length },
    ],
  };
}