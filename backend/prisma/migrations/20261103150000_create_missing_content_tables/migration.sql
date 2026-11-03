-- Tables declared in schema.prisma but absent from the existing database.
CREATE TABLE "reglamento_articulos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "area" TEXT,
    "creado_por" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evento_id" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'MANUAL',
    CONSTRAINT "reglamento_articulos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reglamento_articulos_evento_id_codigo_key"
ON "reglamento_articulos"("evento_id", "codigo");

CREATE INDEX "reglamento_articulos_evento_id_idx"
ON "reglamento_articulos"("evento_id");

CREATE TABLE "reglamento_documentos" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "paginas" INTEGER NOT NULL DEFAULT 0,
    "texto" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PROCESADO',
    "creado_por" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reglamento_documentos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reglamento_documentos_evento_id_key"
ON "reglamento_documentos"("evento_id");

CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "inscripcion_id" TEXT,
    "sancion_id" TEXT,
    "creado_por" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "evidencias"
ADD CONSTRAINT "evidencias_sancion_id_fkey"
FOREIGN KEY ("sancion_id") REFERENCES "sanciones"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
