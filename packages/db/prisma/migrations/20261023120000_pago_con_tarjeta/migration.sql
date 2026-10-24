-- Pago con tarjeta: el medio y lo que la pasarela devuelve de la tarjeta.
-- Solo agrega: ningun dato existente cambia.

-- AlterEnum
ALTER TYPE "MedioPago" ADD VALUE IF NOT EXISTS 'TARJETA';

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "tarjetaMarca" TEXT,
ADD COLUMN IF NOT EXISTS "tarjetaUltimos" TEXT;
