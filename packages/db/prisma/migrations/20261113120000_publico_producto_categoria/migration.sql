-- Para quien es una prenda: atributo del producto y clase de categoria.

-- CreateEnum
CREATE TYPE "Publico" AS ENUM ('HOMBRE', 'MUJER', 'NINOS', 'BEBES');

-- AlterTable
ALTER TABLE "categorias" ADD COLUMN "publico" "Publico";

-- AlterTable
ALTER TABLE "productos" ADD COLUMN "publicos" "Publico"[] DEFAULT ARRAY[]::"Publico"[];

-- CreateIndex
CREATE UNIQUE INDEX "categorias_publico_key" ON "categorias"("publico");

-- CreateIndex
CREATE INDEX "productos_publicos_idx" ON "productos" USING GIN ("publicos");
