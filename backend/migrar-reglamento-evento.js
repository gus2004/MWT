// Migración cruda: reglamento por evento (PDF) + origen de artículos.
// El esquema se sincroniza por SQL porque `prisma db push` no está disponible
// (divergencia preexistente del índice unique_dorsal_por_evento_categoria).
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const pasos = [
    `CREATE TABLE IF NOT EXISTS reglamento_documentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evento_id VARCHAR(36) NOT NULL UNIQUE,
      nombre VARCHAR(255) NOT NULL,
      ruta_archivo VARCHAR(500) NOT NULL,
      paginas INTEGER DEFAULT 0,
      texto TEXT,
      estado VARCHAR(20) DEFAULT 'PROCESADO',
      creado_por VARCHAR(36),
      created_at TIMESTAMP DEFAULT now(),
      CONSTRAINT reglamento_documentos_evento_fk FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    )`,
    `ALTER TABLE reglamento_articulos ADD COLUMN IF NOT EXISTS evento_id VARCHAR(36)`,
    `ALTER TABLE reglamento_articulos ADD COLUMN IF NOT EXISTS origen VARCHAR(12) DEFAULT 'MANUAL'`,
    // Regla de unicidad por evento: el mismo ART. X puede existir en varios
    // documentos de evento; para los manuales el guard sigue a nivel de app.
    `DO $$ DECLARE c TEXT; BEGIN
       SELECT conname INTO c FROM pg_constraint
         WHERE conrelid = 'reglamento_articulos'::regclass AND contype = 'u' AND conname LIKE '%codigo%';
       IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE reglamento_articulos DROP CONSTRAINT ' || c; END IF;
     END $$`,
    `CREATE UNIQUE INDEX IF NOT EXISTS uniq_articulo_por_evento_codigo ON reglamento_articulos (COALESCE(evento_id, ''), codigo)`,
  ];

  for (const sql of pasos) {
    await p.$executeRawUnsafe(sql);
    console.log("OK:", sql.slice(0, 80).replace(/\s+/g, " "), "…");
  }
  console.log("Migración del reglamento por evento: COMPLETA");
  await p.$disconnect();
})().catch((e) => { console.error("ERROR:", e.message); p.$disconnect(); process.exit(1); });
