import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type RegisterInput = {
  email: string;
  password: string;
  role?: string;
  name?: string;
  nombre?: string;
  apellido?: string;
  cui?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono_personal?: string;
  direccion?: string;
  dorsal_preferido?: number;
  tipo_sangre?: string;
  alergias?: string;
  condiciones_medicas?: string;
  nombre_contacto_emergencia?: string;
  parentesco_emergencia?: string;
  telefono_emergencia?: string;
  seguro_medico_empresa?: string;
  poliza_seguro?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está definido en .env');
  return secret;
}

function signToken(userId: string, roles: string[]) {
  return jwt.sign({ sub: userId, roles }, getJwtSecret(), { expiresIn: '7d' });
}

export const register = async (data: RegisterInput) => {
  const { email, password } = data;

  const nombreFinal =
    data.nombre?.trim() || data.name?.trim().split(' ')[0] || '';
  const apellidoFinal =
    data.apellido?.trim() ||
    data.name?.trim().split(' ').slice(1).join(' ') ||
    'N/A';

  if (!nombreFinal) {
    throw new Error('El nombre es requerido');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Crea el usuario junto con sus perfiles (personal y de piloto) enlazados a la BD.
  const usuario = await prisma.usuario.create({
    data: {
      email,
      password: passwordHash,
      nombre: nombreFinal,
      apellido: apellidoFinal,
    },
  });

  await prisma.perfilPersonal.create({
    data: {
      usuario_id: usuario.id,
      cui: data.cui?.trim() || null,
      fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
      genero: data.genero?.trim() || null,
      telefono_personal: data.telefono_personal?.trim() || null,
      direccion: data.direccion?.trim() || null,
    },
  });

  await prisma.perfilPiloto.create({
    data: {
      usuario_id: usuario.id,
      dorsal_preferido: data.dorsal_preferido ?? null,
      tipo_sangre: data.tipo_sangre?.trim() || null,
      alergias: data.alergias?.trim() || null,
      condiciones_medicas: data.condiciones_medicas?.trim() || null,
      nombre_contacto_emergencia: data.nombre_contacto_emergencia?.trim() || null,
      parentesco_emergencia: data.parentesco_emergencia?.trim() || null,
      telefono_emergencia: data.telefono_emergencia?.trim() || null,
      seguro_medico_empresa: data.seguro_medico_empresa?.trim() || null,
      poliza_seguro: data.poliza_seguro?.trim() || null,
    },
  });

  const rolPiloto = await prisma.rol.findUnique({ where: { nombre: 'PILOTO' } });
  if (rolPiloto) {
    await prisma.usuarioRol.create({
      data: { usuario_id: usuario.id, rol_id: rolPiloto.id },
    });
  }

  const roles = ['PILOTO'];
  const token = signToken(usuario.id, roles);

  return {
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      esta_activo: usuario.esta_activo,
    },
    roles,
  };
};

export async function login(input: LoginInput) {
  const { email, password } = input;

  if (!email?.trim()) {
    throw new Error('El correo o usuario es requerido');
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { nombre: { equals: email, mode: 'insensitive' } },
        { apellido: { equals: email, mode: 'insensitive' } },
      ],
    },
    include: { roles: { include: { rol: true } } },
  });

  if (!usuario) throw new Error('Credenciales inválidas');

  const ok = await bcrypt.compare(password, usuario.password);
  let migratedLegacyPassword = false;

  if (!ok) {
    // Support legacy accounts that may still have a plain-text password stored.
    if (usuario.password === password) {
      migratedLegacyPassword = true;
    } else {
      throw new Error('Credenciales inválidas');
    }
  }

  if (migratedLegacyPassword) {
    const newHash = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: newHash },
    });
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimo_login: new Date() },
  });

  const roles = usuario.roles.map((r) => r.rol.nombre);
  const token = signToken(usuario.id, roles);

  return {
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      esta_activo: usuario.esta_activo,
      ultimo_login: new Date(),
    },
    roles,
  };
}

export async function me(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { rol: true } },
      perfil_personal: true,
      perfil_piloto: true,
    },
  });

  if (!usuario) throw new Error('Usuario no encontrado');

  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    esta_activo: usuario.esta_activo,
    ultimo_login: usuario.ultimo_login,
    roles: usuario.roles.map((r) => r.rol.nombre),
    perfil_personal: usuario.perfil_personal,
    perfil_piloto: usuario.perfil_piloto,
  };
}

export async function actualizarPerfil(userId: string, data: Record<string, any>) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { perfil_personal: true, perfil_piloto: true },
  });
  if (!usuario) throw new Error('Usuario no encontrado');

  // Si se envía una nueva contraseña, verificarla contra la actual.
  if (data.password && String(data.password).trim()) {
    if (data.actual_password == null || String(data.actual_password) === '') {
      throw new Error('Debes ingresar tu contraseña actual para cambiarla.');
    }
    const ok = await bcrypt.compare(String(data.actual_password), usuario.password);
    if (!ok) throw new Error('La contraseña actual es incorrecta.');
    if (String(data.password).length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
  }

  const payload: Record<string, unknown> = {};
  if (data.nombre !== undefined && String(data.nombre).trim()) payload.nombre = String(data.nombre).trim();
  if (data.apellido !== undefined && String(data.apellido).trim()) payload.apellido = String(data.apellido).trim();
  if (data.password && String(data.password).trim()) {
    payload.password = await bcrypt.hash(String(data.password), 10);
  }
  if (Object.keys(payload).length) {
    await prisma.usuario.update({ where: { id: userId }, data: payload });
  }

  const camposPersonal = {
    cui: data.cui,
    fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : data.fecha_nacimiento,
    genero: data.genero,
    telefono_personal: data.telefono_personal,
    direccion: data.direccion,
  };
  const personaHasKeys = Object.keys(camposPersonal).some((k) => data[k] !== undefined);
  if (personaHasKeys) {
    const personalData = Object.entries(camposPersonal).reduce<Record<string, unknown>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = v === '' ? null : v;
      return acc;
    }, {});
    if (usuario.perfil_personal) {
      await prisma.perfilPersonal.update({ where: { usuario_id: userId }, data: personalData });
    } else {
      await prisma.perfilPersonal.create({ data: { usuario_id: userId, ...personalData } });
    }
  }

  const camposPiloto = {
    dorsal_preferido: data.dorsal_preferido,
    tipo_sangre: data.tipo_sangre,
    alergias: data.alergias,
    condiciones_medicas: data.condiciones_medicas,
    nombre_contacto_emergencia: data.nombre_contacto_emergencia,
    parentesco_emergencia: data.parentesco_emergencia,
    telefono_emergencia: data.telefono_emergencia,
    seguro_medico_empresa: data.seguro_medico_empresa,
    poliza_seguro: data.poliza_seguro,
    licencia_federacion: data.licencia_federacion,
  };
  const pilotoHasKeys = Object.keys(camposPiloto).some((k) => data[k] !== undefined);
  if (pilotoHasKeys) {
    const pilotoData = Object.entries(camposPiloto).reduce<Record<string, unknown>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = v === '' ? null : v;
      return acc;
    }, {});
    if (usuario.perfil_piloto) {
      await prisma.perfilPiloto.update({ where: { usuario_id: userId }, data: pilotoData });
    } else {
      await prisma.perfilPiloto.create({ data: { usuario_id: userId, ...pilotoData } });
    }
  }

  return me(userId);
}