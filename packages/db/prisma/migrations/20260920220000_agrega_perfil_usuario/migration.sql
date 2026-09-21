-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'RUC', 'CARNE_EXTRANJERIA', 'PASAPORTE');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "apellido" TEXT,
ADD COLUMN     "tipoDocumento" "TipoDocumento",
ADD COLUMN     "numeroDocumento" TEXT,
ADD COLUMN     "fechaNacimiento" DATE;
