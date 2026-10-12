import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const admins = await p.usuario.findMany({
    where: { roles: { some: { rol: { nombre: "ADMIN" } } }, esta_activo: true },
    select: { email: true, password: true },
  });
  console.log(JSON.stringify(admins.map((a) => ({ email: a.email, hash: a.password }) ), null, 2));
  await p.$disconnect();
})();
