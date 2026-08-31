import * as bcrypt from 'bcryptjs';
import prisma from '../../prisma.config';
import { crearPiloto, actualizarPiloto, eliminarPiloto, listarPilotos } from './pilotos.service';
import { crearEvento, cambiarEstadoEvento, listarEventos } from './eventos.service';
import { deleteEventoFromDb } from './admin.eventos.service';
import {
  createInscripcionToDb,
  updateInscripcionStatus,
  deleteInscripcionById,
} from './admin.inscripciones.service';
import {
  listSanciones,
  createSancion,
  updateSancion,
  listRevisionesTecnicas,
  updateRevisionTecnica,
  listNotificaciones,
  createNotificacion,
} from './soporte.service';

const NUMERIC = new Set([
  'anio', 'cilindrada_real', 'cilindrada_min', 'cilindrada_max', 'dorsal_preferido',
  'longitud_km', 'numero_curvas', 'precio_inscripcion', 'monto', 'vueltas', 'dorsal_asignado',
]);

const BOOLEAN = new Set(['esta_activo', 'visible_portada', 'es_obligatorio', 'leida']);

const DATES = new Set(['fecha_inicio', 'fecha_fin', 'fecha_nacimiento', 'hora_inicio', 'hora_fin']);

function coerce(key: string, value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (NUMERIC.has(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  if (BOOLEAN.has(key)) return value === true || value === 'true' || value === 1;
  if (DATES.has(key)) return new Date(value as string);
  return value;
}

function pick<T extends Record<string, unknown>>(data: T, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of fields) {
    const raw = data[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const coerced = coerce(key, raw);
    if (coerced !== undefined) out[key] = coerced;
  }
  return out;
}

type CrudDefinition = {
  fields: string[];
  list: (query?: Record<string, unknown>) => Promise<any[]>;
  create: (data: Record<string, unknown>, operador: string) => Promise<any>;
  update: (id: string, data: Record<string, unknown>, operador: string) => Promise<any>;
  remove: (id: string, operador: string) => Promise<any>;
  detail?: (id: string) => Promise<any>;
};

function generic(model: any, fields: string[], include?: any, orderBy?: any): CrudDefinition {
  return {
    fields,
    list: () => model.findMany({ include, orderBy: orderBy || undefined }),
    create: (data) => model.create({ data: pick(data, fields), include }),
    update: (id, data) => model.update({ where: { id }, data: pick(data, fields), include }),
    remove: (id) => model.delete({ where: { id } }),
  };
}

const ENTITIES: Record<string, CrudDefinition> = {
  marcas: generic(prisma.marcaMoto, ['nombre'], undefined, { nombre: 'asc' }),

  motocicletas: generic(
    prisma.motocicleta,
    ['piloto_id', 'marca_id', 'modelo', 'anio', 'cilindrada_real', 'vin', 'color', 'apodo_moto'],
    {
      marca: { select: { id: true, nombre: true } },
      piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
    },
    { modelo: 'asc' }
  ),

  circuitos: generic(
    prisma.circuito,
    ['nombre', 'ubicacion_url', 'longitud_km', 'numero_curvas', 'foto_mapa_url', 'esta_activo'],
    undefined,
    { nombre: 'asc' }
  ),

  campeonatos: generic(
    prisma.campeonato,
    ['nombre', 'anio', 'descripcion', 'esta_activo'],
    undefined,
    { nombre: 'asc' }
  ),

  categorias: generic(
    prisma.categoria,
    ['campeonato_id', 'nombre', 'cilindrada_min', 'cilindrada_max', 'descripcion', 'precio_inscripcion'],
    { campeonato: { select: { id: true, nombre: true } } },
    { nombre: 'asc' }
  ),

  patrocinadores: generic(
    prisma.patrocinador,
    ['nombre', 'logo_url', 'sitio_web', 'contacto'],
    undefined,
    { nombre: 'asc' }
  ),

  pagos: generic(
    prisma.pago,
    ['inscripcion_id', 'monto', 'metodo_pago', 'id_transaccion', 'estado_pago', 'moneda', 'nit_factura', 'nombre_factura', 'direccion_factura'],
    {
      inscripcion: {
        select: {
          dorsal_asignado: true,
          evento: { select: { nombre: true } },
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
      },
    },
    { fecha_pago: 'desc' }
  ),

  roles: generic(prisma.rol, ['nombre', 'descripcion'], undefined, { nombre: 'asc' }),

  permisos: generic(prisma.permiso, ['clave', 'descripcion'], undefined, { clave: 'asc' }),

  preferencias: generic(prisma.preferenciaSistema, ['clave', 'valor', 'descripcion'], undefined, { clave: 'asc' }),

  documentos: generic(
    prisma.documentoEvento,
    ['evento_id', 'nombre', 'archivo_url', 'es_obligatorio'],
    { evento: { select: { id: true, nombre: true } } },
    { nombre: 'asc' }
  ),

  galeria: generic(
    prisma.galeriaFoto,
    ['evento_id', 'url', 'descripcion'],
    { evento: { select: { id: true, nombre: true } } },
    { subida_en: 'desc' }
  ),

  heats: generic(
    prisma.heat,
    ['categoria_id', 'nombre', 'vueltas', 'esta_activo'],
    { categoria: { select: { id: true, nombre: true } } },
    { nombre: 'asc' }
  ),

  usuarios: {
    fields: ['nombre', 'apellido', 'email', 'password', 'esta_activo', 'roles'],
    list: (query?: Record<string, unknown>) => {
      const filtro: Record<string, unknown> = {};
      if (query?.estado === 'activo') filtro.esta_activo = true;
      if (query?.estado === 'inactivo') filtro.esta_activo = false;
      return prisma.usuario.findMany({
        where: filtro,
        orderBy: { fecha_creacion: 'desc' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          esta_activo: true,
          fecha_creacion: true,
          roles: { include: { rol: { select: { id: true, nombre: true } } } },
          perfil_personal: { select: { cui: true, fecha_nacimiento: true, genero: true, telefono_personal: true, direccion: true } },
          perfil_piloto: {
            select: {
              dorsal_preferido: true,
              tipo_sangre: true,
              alergias: true,
              condiciones_medicas: true,
              nombre_contacto_emergencia: true,
              parentesco_emergencia: true,
              telefono_emergencia: true,
              seguro_medico_empresa: true,
              poliza_seguro: true,
              licencia_federacion: true,
            },
          },
        },
      });
    },
    detail: (id: string) =>
      prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          esta_activo: true,
          fecha_creacion: true,
          roles: { include: { rol: { select: { id: true, nombre: true } } } },
          perfil_personal: { select: { cui: true, fecha_nacimiento: true, genero: true, telefono_personal: true, direccion: true } },
          perfil_piloto: {
            select: {
              dorsal_preferido: true,
              tipo_sangre: true,
              alergias: true,
              condiciones_medicas: true,
              nombre_contacto_emergencia: true,
              parentesco_emergencia: true,
              telefono_emergencia: true,
              seguro_medico_empresa: true,
              poliza_seguro: true,
              licencia_federacion: true,
            },
          },
        },
      }),
    create: async (data) => {
      const password = String(data.password || '');
      if (!password.trim()) throw new Error('La contraseña es obligatoria.');
      const hashed = await bcrypt.hash(password, 10);
      const creado = await prisma.usuario.create({
        data: {
          nombre: String(data.nombre || '').trim(),
          apellido: String(data.apellido || '').trim(),
          email: String(data.email || '').trim(),
          password: hashed,
          esta_activo: data.esta_activo === undefined ? true : Boolean(data.esta_activo),
        },
        select: { id: true, nombre: true, apellido: true, email: true, esta_activo: true },
      });
      await asignarRolesUsuario(creado.id, data.roles);
      return listarUsuarioConRoles(creado.id);
    },
    update: async (id, data) => {
      const payload: Record<string, unknown> = pick(data, ['nombre', 'apellido', 'email', 'esta_activo']);
      if (data.password && String(data.password).trim()) {
        payload.password = await bcrypt.hash(String(data.password), 10);
      }
      await prisma.usuario.update({ where: { id }, data: payload });
      if (data.roles !== undefined) {
        await asignarRolesUsuario(id, data.roles);
      }
      return listarUsuarioConRoles(id);
    },
    remove: async (id) =>
      prisma.usuario.update({ where: { id }, data: { esta_activo: false }, select: { id: true, esta_activo: true } }),
  },

  pilotos: {
    fields: ['nombre', 'apellido', 'email', 'password', 'cui', 'telefono_personal', 'direccion', 'dorsal_preferido'],
    list: () => listarPilotos(),
    create: (data, operador) =>
      crearPiloto({
        nombre: String(data.nombre || ''),
        apellido: String(data.apellido || ''),
        email: String(data.email || ''),
        password: String(data.password || ''),
        cui: data.cui ? String(data.cui) : undefined,
        telefono_personal: data.telefono_personal ? String(data.telefono_personal) : undefined,
        direccion: data.direccion ? String(data.direccion) : undefined,
        dorsal_preferido: data.dorsal_preferido ? Number(data.dorsal_preferido) : undefined,
        usuario_operador_id: operador,
      }),
    update: (id, data, operador) =>
      actualizarPiloto({
        piloto_id: id,
        ...pick(data, ['nombre', 'apellido', 'cui', 'telefono_personal', 'direccion', 'dorsal_preferido']),
        usuario_operador_id: operador,
      } as any),
    remove: (id, operador) => eliminarPiloto(id, operador),
  },

  eventos: {
    fields: ['campeonato_id', 'circuito_id', 'nombre', 'fecha_inicio', 'fecha_fin', 'estado', 'visible_portada', 'costo_base'],
    list: () => listarEventos(),
    create: (data, operador) =>
      crearEvento({
        campeonato_id: String(data.campeonato_id || ''),
        circuito_id: String(data.circuito_id || ''),
        nombre: String(data.nombre || ''),
        fecha_inicio: data.fecha_inicio ? String(data.fecha_inicio) : new Date().toISOString(),
        fecha_fin: data.fecha_fin ? String(data.fecha_fin) : undefined,
        usuario_id: operador,
      }),
    update: async (id, data, operador) => {
      if (data.estado) {
        await cambiarEstadoEvento({ evento_id: id, estado_nuevo: String(data.estado), usuario_id: operador });
      }
      const payload = pick(data, ['nombre', 'fecha_inicio', 'fecha_fin', 'visible_portada', 'costo_base', 'campeonato_id', 'circuito_id']);
      return prisma.evento.update({ where: { id }, data: payload, include: { campeonato: true, circuito: true } });
    },
    remove: (id) => deleteEventoFromDb(id),
  },

  inscripciones: {
    fields: ['evento_id', 'piloto_id', 'categoria_id', 'motocicleta_id', 'estado', 'dorsal_asignado'],
    list: () =>
      prisma.inscripcion.findMany({
        orderBy: { fecha_registro: 'desc' },
        include: {
          evento: true,
          categoria: true,
          piloto: { include: { usuario: { select: { nombre: true, apellido: true } } } },
          motocicleta: { include: { marca: true } },
        },
      }),
    detail: async (id) => {
      const inscripcion = await prisma.inscripcion.findUnique({
        where: { id },
        include: {
          evento: { include: { campeonato: true, circuito: true } },
          categoria: true,
          piloto: {
            include: {
              usuario: { select: { nombre: true, apellido: true, email: true } },
              motocicletas: { include: { marca: true } },
            },
          },
          motocicleta: { include: { marca: true } },
          pago: true,
          revision_tecnica: { include: { detalles: { include: { item: true } }, motocicleta: true, comisario: { select: { nombre: true, apellido: true } } } },
          resultados: { include: { heat: true } },
          sanciones: { include: { comisario: { select: { nombre: true, apellido: true } } } },
          historial_motocicletas: { include: { motocicleta: { include: { marca: true } } } },
          apelaciones: true,
        },
      });
      if (!inscripcion) return null;
      const auditoria = await prisma.auditoria.findMany({
        where: { tabla_afectada: 'inscripcion', registro_id: id },
        orderBy: { fecha: 'asc' },
        include: { usuario: { select: { nombre: true, apellido: true } } },
      });
      const historial = auditoria.map((a) => ({
        id: a.id,
        accion: a.accion,
        fecha: a.fecha,
        usuario: a.usuario ? `${a.usuario.nombre} ${a.usuario.apellido}`.trim() : 'Sistema',
        estado_nuevo: (a.valor_nuevo as any)?.estado ?? null,
        estado_anterior: (a.valor_anterior as any)?.estado ?? null,
      }));
      return { ...inscripcion, historial };
    },
    create: (data) => createInscripcionToDb(data as any),
    update: (id, data, operador) =>
      updateInscripcionStatus(
        id,
        { estado: data.estado ? String(data.estado) : undefined, dorsal_asignado: data.dorsal_asignado ? Number(data.dorsal_asignado) : undefined },
        operador
      ),
    remove: (id) => deleteInscripcionById(id),
  },

  notificaciones: {
    fields: ['usuario_id', 'evento_id', 'titulo', 'mensaje', 'tipo', 'leida'],
    list: () => listNotificaciones(),
    create: (data) =>
      createNotificacion({
        usuario_id: data.usuario_id ? String(data.usuario_id) : undefined,
        evento_id: data.evento_id ? String(data.evento_id) : undefined,
        titulo: String(data.titulo || ''),
        mensaje: String(data.mensaje || ''),
        tipo: String(data.tipo || 'general'),
      }),
    update: (id, data) =>
      prisma.notificacion.update({ where: { id }, data: { leida: Boolean(data.leida) }, include: { usuario: true, evento: true } }),
    remove: (id) => prisma.notificacion.delete({ where: { id } }),
  },

  'revision-tecnica': {
    fields: ['inscripcion_id', 'estado', 'observaciones'],
    list: () => listRevisionesTecnicas(),
    create: () => Promise.reject(new Error('La revisión técnica se genera automáticamente al registrar la inscripción.')),
    update: (id, data) =>
      updateRevisionTecnica(id, {
        estado: data.estado ? String(data.estado) : undefined,
        observaciones: data.observaciones ? String(data.observaciones) : undefined,
      }),
    remove: (id) => prisma.revisionTecnica.delete({ where: { id } }),
  },

  sanciones: {
    fields: ['inscripcion_id', 'tipo_sancion_id', 'motivo', 'gravedad', 'penalizacion'],
    list: () => listSanciones(),
    create: (data, operador) =>
      createSancion({
        inscripcion_id: String(data.inscripcion_id || ''),
        comisario_id: data.comisario_id ? String(data.comisario_id) : operador,
        tipo_sancion_id: data.tipo_sancion_id ? String(data.tipo_sancion_id) : undefined,
        motivo: String(data.motivo || ''),
        estado: data.gravedad ? String(data.gravedad) : 'PENDIENTE',
        penalizacion: data.penalizacion ? String(data.penalizacion) : '',
      }),
    update: (id, data) =>
      updateSancion(id, {
        estado: data.gravedad || data.estado ? String(data.gravedad || data.estado) : undefined,
        motivo: data.motivo ? String(data.motivo) : undefined,
        penalizacion: data.penalizacion ? String(data.penalizacion) : undefined,
        tipo_sancion_id: data.tipo_sancion_id ? String(data.tipo_sancion_id) : undefined,
      }),
    remove: (id) => prisma.sancion.delete({ where: { id } }),
  },
};

export function getEntity(entityKey: string): CrudDefinition {
  const entity = ENTITIES[entityKey];
  if (!entity) throw new Error(`Entidad de mantenimiento desconocida: ${entityKey}`);
  return entity;
}

async function asignarRolesUsuario(usuarioId: string, rolesInput: unknown) {
  let nombres: string[] = [];
  if (Array.isArray(rolesInput)) {
    nombres = rolesInput.map((r) => String(r?.nombre || r?.rol?.nombre || r).trim()).filter(Boolean);
  } else if (typeof rolesInput === 'string' && rolesInput.trim()) {
    nombres = [rolesInput.trim()];
  }
  if (!nombres.length) return;

  const roles = await prisma.rol.findMany({
    where: { nombre: { in: nombres } },
    select: { id: true, nombre: true },
  });
  if (!roles.length) throw new Error('Ninguno de los roles indicados existe en la base de datos.');

  const ids = roles.map((r) => r.id);
  await prisma.usuarioRol.deleteMany({
    where: { usuario_id: usuarioId, rol_id: { notIn: ids } },
  });
  const existentes = await prisma.usuarioRol.findMany({
    where: { usuario_id: usuarioId, rol_id: { in: ids } },
    select: { rol_id: true },
  });
  const existentesIds = new Set(existentes.map((r) => r.rol_id));
  await prisma.usuarioRol.createMany({
    data: roles.filter((r) => !existentesIds.has(r.id)).map((r) => ({ usuario_id: usuarioId, rol_id: r.id })),
  });
}

async function listarUsuarioConRoles(usuarioId: string) {
  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      esta_activo: true,
      roles: { include: { rol: { select: { id: true, nombre: true } } } },
      perfil_personal: { select: { cui: true, fecha_nacimiento: true, genero: true, telefono_personal: true, direccion: true } },
      perfil_piloto: {
        select: {
          dorsal_preferido: true,
          tipo_sangre: true,
          alergias: true,
          condiciones_medicas: true,
          nombre_contacto_emergencia: true,
          parentesco_emergencia: true,
          telefono_emergencia: true,
          seguro_medico_empresa: true,
          poliza_seguro: true,
          licencia_federacion: true,
        },
      },
    },
  });
}

export function listEntity(entityKey: string, query?: Record<string, unknown>) {
  return getEntity(entityKey).list(query);
}

export async function detailEntity(entityKey: string, id: string) {
  const entity = getEntity(entityKey);
  if (typeof entity.detail === 'function') {
    return entity.detail(id);
  }
  return null;
}

export function createEntity(entityKey: string, data: Record<string, unknown>, operador: string) {
  return getEntity(entityKey).create(data, operador);
}

export function updateEntity(entityKey: string, id: string, data: Record<string, unknown>, operador: string) {
  return getEntity(entityKey).update(id, data, operador);
}

export function removeEntity(entityKey: string, id: string, operador: string) {
  return getEntity(entityKey).remove(id, operador);
}