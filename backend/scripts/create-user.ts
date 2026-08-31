import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = getArg('--email');
  const password = getArg('--password');
  const nombre = getArg('--nombre') || 'Usuario';
  const apellido = getArg('--apellido') || 'Nuevo';
  const role = (getArg('--role') || 'PILOTO').toUpperCase();

  if (!email || !password) {
    console.error('Uso: npx ts-node backend/scripts/create-user.ts --email user@x --password pa55 [--nombre Nombre] [--apellido Apellido] [--role ROLE]');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let usuario = await prisma.usuario.findUnique({ where: { email } });
  if (usuario) {
    // Actualizar contraseña y nombres
    usuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: passwordHash, nombre, apellido },
    });
    console.log('Usuario existente actualizado:', { id: usuario.id, email: usuario.email });
  } else {
    usuario = await prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        apellido,
      },
    });
    console.log('Usuario creado:', { id: usuario.id, email: usuario.email });
  }

  const rol = await prisma.rol.findUnique({ where: { nombre: role } });
  if (rol) {
    const existe = await prisma.usuarioRol.findFirst({ where: { usuario_id: usuario.id, rol_id: rol.id } });
    if (!existe) {
      await prisma.usuarioRol.create({ data: { usuario_id: usuario.id, rol_id: rol.id } });
      console.log('Rol asignado:', rol.nombre);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error creando usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
