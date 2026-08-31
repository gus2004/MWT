import prisma from '../prisma.config';

async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe(`
    SELECT id, heat_id, inscripcion_id, mejor_vuelta, vuelta_1, vuelta_2, posicion
    FROM resultados_tiempos
    WHERE estatus_carrera = 'CLASIFICACION'
    ORDER BY id DESC
    LIMIT 20
  `);
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
