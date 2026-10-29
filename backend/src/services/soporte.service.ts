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
    // Evidencias adjuntas (imágenes/videos): SOLO respaldo documental,
    // la IA del comisariato no las analiza.
    evidencias: (s.evidencias || []).map((e: any) => ({
      id: e.id,
      tipo: e.tipo,
      nombre: e.nombre,
      ruta_archivo: e.ruta_archivo,
      mime: e.mime,
      tamano: e.tamano,
    })),
  };
}

export async function listSanciones() {
  const rows = await prisma.sancion.findMany({
    orderBy: { fecha_sancion: 'desc' },
    include: {
      tipo_sancion: true,
      comisario: { select: { nombre: true, apellido: true } },
      apelacion: true,
      evidencias: true,
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
  evidencias?: string[];
}) {
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: input.inscripcion_id },
    select: { id: true },
  });
  if (!inscripcion) throw new Error('La inscripción especificada no existe.');

  const sancion = await prisma.sancion.create({
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

  // Vincular las evidencias subidas durante el registro de la infracción
  // (solo si aún no están vinculadas a otra sanción).
  const idsEvidencias = Array.isArray(input.evidencias) ? input.evidencias.filter(Boolean) : [];
  if (idsEvidencias.length) {
    await prisma.evidencia.updateMany({
      where: { id: { in: idsEvidencias }, sancion_id: null },
      data: { sancion_id: sancion.id },
    });
  }

  return sancion;
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
  const existing = await prisma.tipoSancion.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' }, evento_id: null } });
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
  const [pilotos, eventos, inscripciones, sanciones, ingresosPagos, ingresosPorCategoria, marcaRows, crecimiento, eventosInsc] = await Promise.all([
    prisma.perfilPiloto.count(),
    prisma.evento.findMany({
      orderBy: { fecha_inicio: 'desc' },
      include: { circuito: true, campeonato: true },
    }),
    prisma.inscripcion.findMany({
      include: {
        evento: true,
        categoria: true,
        pago: true,
        motocicleta: { include: { marca: true } },
        piloto: { include: { usuario: { select: { nombre: true, apellido: true, email: true } } } },
      },
    }),
    prisma.sancion.count(),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { estado_pago: 'CONFIRMADO' },
    }),
    // Ingresos calculados sobre el precio de inscripción de la categoría
    // (no solo el monto del pago, que puede diferir). Se considera cada
    // inscripción en estado PAGADA o VALIDADA.
    prisma.inscripcion.findMany({
      where: {
        estado: { in: ['PAGADA', 'VALIDADA'] },
      },
      include: {
        categoria: { select: { precio_inscripcion: true } },
      },
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
    // El ingreso se reconoce por el estado de la inscripción. Una inscripción
    // PAGADA o VALIDADA ya forma parte del ingreso, aunque el registro de pago
    // no exista o todavía no tenga estado CONFIRMADO.
    const inscripcionesPagadas = total.filter((i) => i.estado === 'PAGADA' || i.estado === 'VALIDADA');
    const ingreso = inscripcionesPagadas.reduce((sum, i) => sum + Number(i.categoria?.precio_inscripcion || 0), 0);
    return {
      evento_id: ev.id,
      evento: ev.nombre,
      fecha_inicio: ev.fecha_inicio,
      estado: ev.estado,
      campeonato_id: ev.campeonato_id,
      campeonato: ev.campeonato?.nombre || 'Sin campeonato',
      inscripciones: total.length,
      validadas: validas.length,
      inscripciones_pagadas: inscripcionesPagadas.length,
      pagos_pendientes: total.length - inscripcionesPagadas.length,
      ingresos: ingreso,
      ticket_promedio: inscripcionesPagadas.length ? ingreso / inscripcionesPagadas.length : 0,
      ingresos_detalle: inscripcionesPagadas.map((i) => ({
        inscripcion_id: i.id,
        piloto: i.piloto?.usuario
          ? `${i.piloto.usuario.nombre} ${i.piloto.usuario.apellido}`.trim()
          : '—',
        email: i.piloto?.usuario?.email || '—',
        categoria: i.categoria?.nombre || '—',
        estado: i.estado,
        monto: Number(i.categoria?.precio_inscripcion || 0),
        metodo_pago: i.pago?.metodo_pago || '—',
        fecha_registro: i.fecha_registro,
      })),
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

  const ingresosCalculados = ingresosPorCategoria.reduce((sum, ins) => sum + (ins.categoria?.precio_inscripcion || 0), 0);
  const ahora = new Date();
  return {
    kpis: {
      participantes: pilotos,
      eventos: eventos.length,
      proximos: eventos.filter((ev) => ev.fecha_inicio > ahora && ev.estado !== 'CANCELADO').length,
      sanciones,
      ingresos: ingresosCalculados,
    },
    inscripciones_por_evento: porEvento.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()).slice(0, 12),
    ingresos_por_evento: porEvento.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()),
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
// ---------------------------------------------
//  CAT�LOGO DEL REGLAMENTO (alimenta la IA del comisariato)
//  Cada art�culo se registra con c�digo, t�tulo, texto y �rea.
//  La IA sugiere el art�culo seg�n el tipo de infracci�n y la
//  descripci�n detallada del hecho.
// ---------------------------------------------

export async function listReglamento() {
  return prisma.reglamentoArticulo.findMany({ orderBy: { codigo: 'asc' } });
}

export async function createArticuloReglamento(input: {
  codigo: string;
  titulo: string;
  texto: string;
  area?: string;
  creado_por?: string;
}) {
  const codigo = String(input.codigo || '').trim().toUpperCase();
  if (!codigo) throw new Error('El c�digo del art�culo (ART. X.X) es requerido.');
  if (!String(input.titulo || '').trim()) throw new Error('El t�tulo del art�culo es requerido.');
  if (!String(input.texto || '').trim()) throw new Error('El texto del art�culo es requerido.');

  const existente = await prisma.reglamentoArticulo.findFirst({ where: { codigo, evento_id: null } });
  if (existente) throw new Error(`El art�culo ${codigo} ya est� registrado en el cat�logo.`);

  return prisma.reglamentoArticulo.create({
    data: {
      codigo,
      titulo: input.titulo.trim(),
      texto: input.texto.trim(),
      area: input.area?.trim() || null,
      creado_por: input.creado_por || null,
    },
  });
}

export async function deleteArticuloReglamento(id: string) {
  const articulo = await prisma.reglamentoArticulo.findUnique({ where: { id } });
  if (!articulo) throw new Error('El art�culo no existe en el cat�logo.');
  await prisma.reglamentoArticulo.delete({ where: { id } });
  return { ok: true, id };
}

// ---------------------------------------------
//  EVIDENCIAS (im�genes y videos de las incidencias)
//  Solo se almacenan como respaldo documental; la IA del
//  comisariato NO las analiza.
// ---------------------------------------------

export async function listEvidencias(opt: { inscripcion_id?: string; sancion_id?: string; soloSinSancion?: boolean } = {}) {
  const where: any = {};
  if (opt.inscripcion_id) where.inscripcion_id = opt.inscripcion_id;
  if (opt.sancion_id) where.sancion_id = opt.sancion_id;
  if (opt.soloSinSancion) where.sancion_id = null;
  return prisma.evidencia.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createEvidencia(input: {
  tipo: 'IMAGEN' | 'VIDEO';
  nombre: string;
  ruta_archivo: string;
  mime: string;
  tamano: number;
  inscripcion_id?: string;
  creado_por?: string;
}) {
  return prisma.evidencia.create({
    data: {
      tipo: input.tipo,
      nombre: input.nombre,
      ruta_archivo: input.ruta_archivo,
      mime: input.mime,
      tamano: input.tamano,
      inscripcion_id: input.inscripcion_id || null,
      creado_por: input.creado_por || null,
    },
  });
}

export async function deleteEvidencia(id: string) {
  const evidencia = await prisma.evidencia.findUnique({ where: { id } });
  if (!evidencia) throw new Error('La evidencia no existe.');

  // Eliminar archivo f�sico si existe (ruta relativa: /uploads/evidencias/<archivo>)
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  if (evidencia.ruta_archivo) {
    const rutaFisica = path.join(process.cwd(), evidencia.ruta_archivo.replace(/^\//, ''));
    try {
      if (fs.existsSync(rutaFisica)) fs.unlinkSync(rutaFisica);
    } catch {
      // El archivo ya no existe en disco; igual se elimina el registro.
    }
  }

  await prisma.evidencia.delete({ where: { id } });
  return { ok: true, id };
}
