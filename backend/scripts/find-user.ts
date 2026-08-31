import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = getArg('--email');
  if (!email) {
    console.error('Uso: npx ts-node backend/scripts/find-user.ts --email user@ejemplo.com');
    process.exit(1);
  }

  const usuario = await prisma.usuario.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: {
      roles: { include: { rol: true } },
      perfil_personal: true,
      perfil_piloto: true,
    },
  });

  if (!usuario) {
    console.log('Usuario no encontrado');
    process.exit(0);
  }

  // Ocultar campo password por seguridad
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = usuario as any;

  console.log(JSON.stringify(rest, null, 2));
}

main()
  .catch((e) => {
    console.error('Error buscando usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
