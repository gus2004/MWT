import * as bcrypt from 'bcryptjs';
import prisma from '../../prisma.config';
import { Prisma } from '@prisma/client';

type CrearPilotoInput = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  cui?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono_personal?: string;
  direccion?: string;
  departamento_id?: string;
  municipio_id?: string;
  pais_id?: string;
  dorsal_preferido?: number;
  tipo_sangre?: string;
  alergias?: string;
  condiciones_medicas?: string;
  nombre_contacto_emergencia?: string;
  parentesco_emergencia?: string;
  telefono_emergencia?: string;
  seguro_medico_empresa?: string;
  poliza_seguro?: string;
  usuario_operador_id: string;
};

type CrearMotoInput = {
  piloto_id: string;
  marca_id: string;
  modelo: string;
  anio: number;
  cilindrada_real: number;
  vin?: string;
  color?: string;
  apodo_moto?: string;
};

type ActualizarPilotoInput = {
  piloto_id: string;
  nombre?: string;
  apellido?: string;
  cui?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono_personal?: string;
  direccion?: string;
  departamento_id?: string;
  municipio_id?: string;
  pais_id?: string;
  dorsal_preferido?: number;
  tipo_sangre?: string;
  alergias?: string;
  condiciones_medicas?: string;
  nombre_contacto_emergencia?: string;
  parentesco_emergencia?: string;
  telefono_emergencia?: string;
  seguro_medico_empresa?: string;
  poliza_seguro?: string;
  usuario_operador_id: string;
};

export async function crearPiloto(input: CrearPilotoInput) {
  const hashed = await bcrypt.hash(input.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      email: input.email.trim(),
      password: hashed,
    },
  });

  const perfilPersonal = await prisma.perfilPersonal.create({
    data: {
      usuario_id: usuario.id,
      cui: input.cui?.trim() || null,
      fecha_nacimiento: input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null,
      genero: input.genero?.trim() || null,
      telefono_personal: input.telefono_personal?.trim() || null,
      direccion: input.direccion?.trim() || null,
    },
  });

  const perfilPiloto = await prisma.perfilPiloto.create({
    data: {
      usuario_id: usuario.id,
      dorsal_preferido: input.dorsal_preferido ?? null,
      tipo_sangre: input.tipo_sangre?.trim() || null,
      alergias: input.alergias?.trim() || null,
      condiciones_medicas: input.condiciones_medicas?.trim() || null,
      nombre_contacto_emergencia: input.nombre_contacto_emergencia?.trim() || null,
      parentesco_emergencia: input.parentesco_emergencia?.trim() || null,
      telefono_emergencia: input.telefono_emergencia?.trim() || null,
      seguro_medico_empresa: input.seguro_medico_empresa?.trim() || null,
      poliza_seguro: input.poliza_seguro?.trim() || null,
    },
  });

  const rolPiloto = await prisma.rol.findFirst({
    where: {
      nombre: {
        equals: 'piloto',
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (rolPiloto) {
    await prisma.usuarioRol.create({
      data: {
        usuario_id: usuario.id,
        rol_id: rolPiloto.id,
      },
    });
  }

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_operador_id,
      tabla_afectada: 'usuarios',
      accion: 'INSERT',
      registro_id: usuario.id,
      valor_nuevo: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
        },
        perfil_personal: {
          id: perfilPersonal.id,
          cui: perfilPersonal.cui,
          fecha_nacimiento: perfilPersonal.fecha_nacimiento instanceof Date ? perfilPersonal.fecha_nacimiento.toISOString() : perfilPersonal.fecha_nacimiento,
          genero: perfilPersonal.genero,
          telefono_personal: perfilPersonal.telefono_personal,
          direccion: perfilPersonal.direccion,
          departamento_id: input.departamento_id ?? null,
          municipio_id: input.municipio_id ?? null,
          pais_id: input.pais_id ?? null,
        },
        perfil_piloto: {
          id: perfilPiloto.id,
          dorsal_preferido: perfilPiloto.dorsal_preferido,
          tipo_sangre: perfilPiloto.tipo_sangre,
        },
      },
    },
  });

  return prisma.usuario.findUnique({
    where: { id: usuario.id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      esta_activo: true,
      perfil_personal: true,
      perfil_piloto: true,
    },
  });
}

export async function registrarMotocicleta(input: CrearMotoInput) {
  const piloto = await prisma.perfilPiloto.findUnique({
    where: { id: input.piloto_id },
    select: { id: true },
  });

  if (!piloto) {
    throw new Error('El piloto no existe en perfiles de pilotos.');
  }

  if (input.vin?.trim()) {
    const existingVin = await prisma.motocicleta.findUnique({
      where: { vin: input.vin.trim() },
      select: { id: true },
    });

    if (existingVin) {
      throw new Error('El VIN ingresado ya está registrado.');
    }
  }

  return prisma.motocicleta.create({
    data: {
      piloto_id: input.piloto_id,
      marca_id: input.marca_id,
      modelo: input.modelo.trim(),
      anio: input.anio,
      cilindrada_real: input.cilindrada_real,
      vin: input.vin?.trim() || null,
      color: input.color?.trim() || null,
      apodo_moto: input.apodo_moto?.trim() || null,
    },
    include: {
      marca: true,
    },
  });
}

export async function listarPilotos(query?: string) {
  return prisma.perfilPiloto.findMany({
    where: query?.trim()
      ? {
          OR: [
            { usuario: { nombre: { contains: query, mode: 'insensitive' } } },
            { usuario: { apellido: { contains: query, mode: 'insensitive' } } },
            { usuario: { perfil_personal: { cui: { contains: query, mode: 'insensitive' } } } },
          ],
        }
      : undefined,
    include: {
      usuario: true,
    },
    orderBy: [{ usuario: { nombre: 'asc' } }, { usuario: { apellido: 'asc' } }],
  });
}

export async function obtenerPiloto(pilotoId: string) {
  const piloto = await prisma.perfilPiloto.findUnique({
    where: { id: pilotoId },
    include: {
      usuario: {
        include: {
          perfil_personal: true,
        },
      },
      motocicletas: {
        include: {
          marca: true,
        },
        orderBy: { modelo: 'asc' },
      },
    },
  });

  if (!piloto) {
    throw new Error('Piloto no encontrado.');
  }

  return piloto;
}

export async function actualizarPiloto(input: ActualizarPilotoInput) {
  const piloto = await prisma.perfilPiloto.findUnique({
    where: { id: input.piloto_id },
    include: { usuario: { include: { perfil_personal: true } } },
  });

  if (!piloto) {
    throw new Error('Piloto no encontrado.');
  }

  const usuario = await prisma.usuario.update({
    where: { id: piloto.usuario_id },
    data: {
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.apellido !== undefined ? { apellido: input.apellido.trim() } : {}),
    },
  });

  const perfilPersonal = await prisma.perfilPersonal.upsert({
    where: { usuario_id: piloto.usuario_id },
    create: {
      usuario_id: piloto.usuario_id,
      cui: input.cui ?? null,
      fecha_nacimiento: input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null,
      genero: input.genero ?? null,
      telefono_personal: input.telefono_personal ?? null,
      direccion: input.direccion ?? null,
    },
    update: {
      ...(input.cui !== undefined ? { cui: input.cui || null } : {}),
      ...(input.fecha_nacimiento !== undefined
        ? { fecha_nacimiento: input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null }
        : {}),
      ...(input.genero !== undefined ? { genero: input.genero || null } : {}),
      ...(input.telefono_personal !== undefined ? { telefono_personal: input.telefono_personal || null } : {}),
      ...(input.direccion !== undefined ? { direccion: input.direccion || null } : {}),
    },
  });

  const perfilPiloto = await prisma.perfilPiloto.update({
    where: { id: input.piloto_id },
    data: {
      ...(input.dorsal_preferido !== undefined ? { dorsal_preferido: input.dorsal_preferido } : {}),
      ...(input.tipo_sangre !== undefined ? { tipo_sangre: input.tipo_sangre || null } : {}),
      ...(input.alergias !== undefined ? { alergias: input.alergias || null } : {}),
      ...(input.condiciones_medicas !== undefined ? { condiciones_medicas: input.condiciones_medicas || null } : {}),
      ...(input.nombre_contacto_emergencia !== undefined
        ? { nombre_contacto_emergencia: input.nombre_contacto_emergencia || null }
        : {}),
      ...(input.parentesco_emergencia !== undefined ? { parentesco_emergencia: input.parentesco_emergencia || null } : {}),
      ...(input.telefono_emergencia !== undefined ? { telefono_emergencia: input.telefono_emergencia || null } : {}),
      ...(input.seguro_medico_empresa !== undefined ? { seguro_medico_empresa: input.seguro_medico_empresa || null } : {}),
      ...(input.poliza_seguro !== undefined ? { poliza_seguro: input.poliza_seguro || null } : {}),
    },
  });

  await prisma.auditoria.create({
    data: {
      usuario_id: input.usuario_operador_id,
      tabla_afectada: 'perfiles_pilotos',
      accion: 'UPDATE',
      registro_id: input.piloto_id,
      valor_nuevo: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
        },
        perfil_personal: {
          id: perfilPersonal.id,
          cui: perfilPersonal.cui,
          fecha_nacimiento: perfilPersonal.fecha_nacimiento instanceof Date ? perfilPersonal.fecha_nacimiento.toISOString() : perfilPersonal.fecha_nacimiento,
          genero: perfilPersonal.genero,
          telefono_personal: perfilPersonal.telefono_personal,
          direccion: perfilPersonal.direccion,
          departamento_id: input.departamento_id ?? null,
          municipio_id: input.municipio_id ?? null,
          pais_id: input.pais_id ?? null,
        },
        perfil_piloto: {
          id: perfilPiloto.id,
          dorsal_preferido: perfilPiloto.dorsal_preferido,
          tipo_sangre: perfilPiloto.tipo_sangre,
        },
      },
    },
  });

  return prisma.perfilPiloto.findUnique({
    where: { id: input.piloto_id },
    include: {
      usuario: {
        include: {
          perfil_personal: true,
        },
      },
    },
  });
}

export async function eliminarPiloto(pilotoId: string, usuario_operador_id: string) {
  const perfil = await prisma.perfilPiloto.findUnique({ where: { id: pilotoId }, include: { usuario: true } });
  if (!perfil) throw new Error('Piloto no encontrado.');

  // Soft-delete: marcar usuario como inactivo
  try {
    await prisma.usuario.update({ where: { id: perfil.usuario_id }, data: { esta_activo: false } });
  } catch (err) {
    console.error('[pilotos.service] Error updating usuario.esta_activo:', err);
    throw err;
  }

  try {
    await prisma.auditoria.create({
      data: {
        usuario_id: usuario_operador_id,
        tabla_afectada: 'perfiles_pilotos',
        accion: 'DELETE',
        registro_id: pilotoId,
        valor_anterior: {
          usuario: { id: perfil.usuario.id, nombre: perfil.usuario.nombre, apellido: perfil.usuario.apellido, email: perfil.usuario.email },
          perfil_piloto: { id: perfil.id, dorsal_preferido: perfil.dorsal_preferido },
        },
      },
    });
  } catch (err) {
    // Log audit failure but don't block the delete flow
    console.error('[pilotos.service] auditoria.create failed during eliminarPiloto:', err);
  }

  return { ok: true };
}
