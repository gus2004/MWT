import prisma from '../prisma.config';

async function main() {
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type='BASE TABLE'
    ORDER BY table_name
  ` as any;

  if (!tables.length) {
    console.log('No tables found in public schema.');
    process.exit(0);
  }

  for (const t of tables) {
    try {
      const [{ count }] = (await prisma.$queryRawUnsafe(
        `SELECT count(*)::int AS count FROM "${t.table_name}"`
      )) as any;
      console.log(`${t.table_name}: ${count}`);
    } catch (err) {
      console.log(`${t.table_name}: error reading count -`, err.message || err);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error running inspect-db:', e);
    process.exit(2);
  })
  .finally(() => prisma.$disconnect());
