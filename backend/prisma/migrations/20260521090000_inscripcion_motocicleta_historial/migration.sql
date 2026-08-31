-- CreateTable
CREATE TABLE "inscripciones_motocicletas" (
    "id" TEXT NOT NULL,
    "inscripcion_id" TEXT NOT NULL,
    "motocicleta_id" TEXT NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,

    CONSTRAINT "inscripciones_motocicletas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inscripciones_motocicletas_inscripcion_id_idx" ON "inscripciones_motocicletas"("inscripcion_id");

-- CreateIndex
CREATE INDEX "inscripciones_motocicletas_motocicleta_id_idx" ON "inscripciones_motocicletas"("motocicleta_id");

-- AddForeignKey
ALTER TABLE "inscripciones_motocicletas" ADD CONSTRAINT "inscripciones_motocicletas_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones_motocicletas" ADD CONSTRAINT "inscripciones_motocicletas_motocicleta_id_fkey" FOREIGN KEY ("motocicleta_id") REFERENCES "motocicletas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
