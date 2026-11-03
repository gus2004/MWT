ALTER TABLE "tipos_sancion"
ADD COLUMN "evento_id" TEXT,
ADD COLUMN "origen" TEXT NOT NULL DEFAULT 'MANUAL';

CREATE UNIQUE INDEX "tipos_sancion_evento_id_nombre_key"
ON "tipos_sancion"("evento_id", "nombre");

CREATE INDEX "tipos_sancion_evento_id_idx"
ON "tipos_sancion"("evento_id");
