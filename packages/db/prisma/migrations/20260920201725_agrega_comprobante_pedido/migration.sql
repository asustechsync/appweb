/*
  Warnings:

  - Added the required column `documento` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medioPago` to the `pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('BOLETA', 'FACTURA');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('YAPE', 'PLIN', 'TRANSFERENCIA', 'CONTRA_ENTREGA');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "comprobante" "TipoComprobante" NOT NULL DEFAULT 'BOLETA',
ADD COLUMN     "documento" TEXT NOT NULL,
ADD COLUMN     "medioPago" "MedioPago" NOT NULL,
ADD COLUMN     "razonSocial" TEXT;
