/*
  Warnings:

  - You are about to drop the column `existe` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `departamento_id` on the `perfiles_personales` table. All the data in the column will be lost.
  - You are about to drop the column `municipio_id` on the `perfiles_personales` table. All the data in the column will be lost.
  - You are about to drop the column `pais_id` on the `perfiles_personales` table. All the data in the column will be lost.
  - You are about to drop the `departamentos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `municipios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paises` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `visible_portada` on table `eventos` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "departamentos" DROP CONSTRAINT "departamentos_pais_id_fkey";

-- DropForeignKey
ALTER TABLE "municipios" DROP CONSTRAINT "municipios_departamento_id_fkey";

-- DropForeignKey
ALTER TABLE "perfiles_personales" DROP CONSTRAINT "perfiles_personales_departamento_id_fkey";

-- DropForeignKey
ALTER TABLE "perfiles_personales" DROP CONSTRAINT "perfiles_personales_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "perfiles_personales" DROP CONSTRAINT "perfiles_personales_pais_id_fkey";

-- AlterTable
ALTER TABLE "eventos" DROP COLUMN "existe",
ALTER COLUMN "visible_portada" SET NOT NULL,
ALTER COLUMN "visible_portada" SET DEFAULT false;

-- AlterTable
ALTER TABLE "perfiles_personales" DROP COLUMN "departamento_id",
DROP COLUMN "municipio_id",
DROP COLUMN "pais_id";

-- AlterTable
ALTER TABLE "resultados_tiempos" ADD COLUMN     "vuelta_1" TEXT,
ADD COLUMN     "vuelta_2" TEXT;

-- DropTable
DROP TABLE "departamentos";

-- DropTable
DROP TABLE "municipios";

-- DropTable
DROP TABLE "paises";

-- CreateTable
CREATE TABLE "grupos_categoria_evento" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tiene_clasificacion" BOOLEAN NOT NULL DEFAULT false,
    "clasificacion_completada" BOOLEAN NOT NULL DEFAULT false,
    "heat1_completado" BOOLEAN NOT NULL DEFAULT false,
    "heat2_completado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_categoria_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_en_grupo" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,

    CONSTRAINT "categorias_en_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_en_grupo_grupo_id_categoria_id_key" ON "categorias_en_grupo"("grupo_id", "categoria_id");

-- AddForeignKey
ALTER TABLE "grupos_categoria_evento" ADD CONSTRAINT "grupos_categoria_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_en_grupo" ADD CONSTRAINT "categorias_en_grupo_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_en_grupo" ADD CONSTRAINT "categorias_en_grupo_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_categoria_evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
