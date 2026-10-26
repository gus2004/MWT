// Tipos de infracción por evento (generados desde el reglamento del PDF)
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const pasos = [
    `ALTER TABLE tipos_sancion ADD COLUMN IF NOT EXISTS evento_id VARCHAR(36)`,
    `ALTER TABLE tipos_sancion ADD COLUMN IF NOT EXISTS origen VARCHAR(12) DEFAULT 'MANUAL'`,
    `DO $$ DECLARE c TEXT; BEGIN
       SELECT conname INTO c FROM pg_constraint
         WHERE conrelid = 'tipos_sancion'::regclass AND contype = 'u' AND conname LIKE '%nombre%';
       IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE tipos_sancion DROP CONSTRAINT ' || c; END IF;
     END $$`,
    `CREATE UNIQUE INDEX IF NOT EXISTS uniq_tipo_por_evento ON tipos_sancion (COALESCE(evento_id, ''), nombre)`,
  ];
  for (const sql of pasos) {
    await p.$executeRawUnsafe(sql);
    console.log("OK:", sql.slice(0, 60).replace(/\s+/g, " "));
  }
  console.log("Migración tipos por evento: COMPLETA");
  await p.$disconnect();
})().catch((e) => { console.error("ERROR:", e.message); p.$disconnect(); process.exit(1); });
