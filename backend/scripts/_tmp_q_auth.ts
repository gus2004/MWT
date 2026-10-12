import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    where: { roles: { some: { rol: { nombre: "ADMIN" } } } },
    select: { email: true, password: true, esta_activo: true, nombre: true },
  });
  const candidates = ["Password123!", "admin123", "123456", "Admin123!", "admin123!", "password", "admin", "Admin123", "mwt2026", "12345", "Administrador123!", "mwt_prototipo"];
  for (const u of usuarios) {
    const matches = [];
    for (const c of candidates) {
      try { if (await bcrypt.compare(c, u.password)) matches.push(c); } catch {}
    }
    console.log(JSON.stringify({ email: u.email, nombre: u.nombre, activo: u.esta_activo, matches }));
  }
}
main().finally(() => prisma.$disconnect());