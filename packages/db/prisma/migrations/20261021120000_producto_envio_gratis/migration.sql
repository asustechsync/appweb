-- Envio gratis por producto: el panel marca los productos que muestran la
-- etiqueta "Envío gratis" sobre la foto. Las filas existentes quedan sin marca.

-- AlterTable
ALTER TABLE "productos" ADD COLUMN "envioGratis" BOOLEAN NOT NULL DEFAULT false;
