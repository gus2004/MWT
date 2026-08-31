import prisma from '../prisma.config';

async function main(){
  const rows = await prisma.$queryRaw`SELECT id, migration_name, finished_at, started_at, logs FROM _prisma_migrations ORDER BY started_at DESC`;
  console.log('Migrations rows:', JSON.stringify(rows, null, 2));
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
