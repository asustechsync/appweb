-- Fechas en direcciones, cupones y metodos de envio, y zonas de envio.
-- Las filas existentes reciben la fecha de hoy.

-- AlterTable
ALTER TABLE "cupones" ADD COLUMN "editadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "cupones" ALTER COLUMN "editadoEn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "direcciones"
  ADD COLUMN "creadoEn"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "editadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "direcciones" ALTER COLUMN "editadoEn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "metodos_envio"
  ADD COLUMN "creadoEn"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "departamentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "editadoEn"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "metodos_envio" ALTER COLUMN "editadoEn" DROP DEFAULT;

-- Zonas iniciales: el envio a domicilio de Lima solo llega a Lima y Callao.
-- Los demas metodos quedan vacios = todo el pais.
UPDATE "metodos_envio" SET "departamentos" = ARRAY['Lima', 'Callao'] WHERE "nombre" = 'Lima y Callao';
