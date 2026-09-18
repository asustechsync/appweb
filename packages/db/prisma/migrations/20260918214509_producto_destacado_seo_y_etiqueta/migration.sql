-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "descripcionCorta" TEXT,
ADD COLUMN     "descripcionSeo" TEXT,
ADD COLUMN     "destacada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "etiqueta" TEXT,
ADD COLUMN     "tituloSeo" TEXT;
