/* eslint-disable @typescript-eslint/no-var-requires */
// Seed de usuarios por rol para revisar las vistas (RBAC).
//
// Uso:
//   node backend/scripts/seed-roles.cjs
//
// Crea (o actualiza) un usuario por rol con credenciales conocidas:
//   admin@mwt.gt        -> ADMIN
//   comisario@mwt.gt    -> COMISARIO
//   juez@mwt.gt         -> JUEZ_MESA
//   staff@mwt.gt        -> STAFF_TECNICO
//   piloto@mwt.gt       -> PILOTO
//
//   TODOS con contraseña: Password123!

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const backendPath = path.join(__dirname, "..");
const envPath = path.join(backendPath, ".env");
const env = fs.readFileSync(envPath, "utf8");
const dbUrl = env
  .split(/\r?\n/)
  .find((l) => l.startsWith("DATABASE_URL="))
  .split("=")
  .slice(1)
  .join("=")
  .replace(/^"|"$/g, "");

process.env.DATABASE_URL = dbUrl;
const { PrismaClient } = require(path.join(backendPath, "node_modules", "@prisma", "client"));
const prisma = new PrismaClient();

const PASSWORD = "Password123!";

const USUARIOS = [
  { email: "admin@mwt.gt", nombre: "Admin", apellido: "MWT", rol: "ADMIN" },
  { email: "comisario@mwt.gt", nombre: "Comisario", apellido: "MWT", rol: "COMISARIO" },
  { email: "juez@mwt.gt", nombre: "Juez", apellido: "Mesa", rol: "JUEZ_MESA" },
  { email: "staff@mwt.gt", nombre: "Staff", apellido: "Tecnico", rol: "STAFF" },
  { email: "piloto@mwt.gt", nombre: "Piloto", apellido: "Demo", rol: "PILOTO" },
];

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const resumen = [];

  for (const u of USUARIOS) {
    // Buscar usuario por email
    let usuario = await prisma.usuario.findUnique({ where: { email: u.email } });

    if (usuario) {
      // Actualizar nombre y contraseña para que siempre coincida
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { nombre: u.nombre, apellido: u.apellido, password: hash, esta_activo: true },
      });
      resumen.push(`${u.rol.padEnd(12)} ${u.email}  -> actualizado`);
    } else {
      usuario = await prisma.usuario.create({
        data: { email: u.email, password: hash, nombre: u.nombre, apellido: u.apellido },
      });
      resumen.push(`${u.rol.padEnd(12)} ${u.email}  -> creado`);
    }

    // Buscar el rol en la BD
    const rol = await prisma.rol.findUnique({ where: { nombre: u.rol } });
    if (!rol) {
      resumen.push(`  ⚠  ERROR: no existe el rol "${u.rol}" en la BD`);
      continue;
    }

    // Asignar rol (evitar duplicados)
    const existe = await prisma.usuarioRol.findFirst({
      where: { usuario_id: usuario.id, rol_id: rol.id },
    });
    if (!existe) {
      await prisma.usuarioRol.create({ data: { usuario_id: usuario.id, rol_id: rol.id } });
    }
  }

  console.log("\n=== Usuarios de prueba listos ===");
  console.log(`Contraseña para todos: ${PASSWORD}\n`);
  resumen.forEach((r) => console.log(r));
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
