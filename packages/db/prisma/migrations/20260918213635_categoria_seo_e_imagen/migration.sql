-- AlterTable
ALTER TABLE "categorias" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "descripcionSeo" TEXT,
ADD COLUMN     "destacada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imagenUrl" TEXT,
ADD COLUMN     "tituloSeo" TEXT;
