import prisma from '../prisma.config';

async function main() {
  const rows = await prisma.resultadoTiempo.findMany({
    where: { estatus_carrera: 'CLASIFICACION' },
    orderBy: { created_at: 'desc' },
    take: 20,
    select: { id: true, heat_id: true, inscripcion_id: true, mejor_vuelta: true, vuelta_1: true, vuelta_2: true, posicion: true },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
