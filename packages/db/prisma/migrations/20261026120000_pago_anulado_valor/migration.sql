-- Pago ANULADO: el pago pendiente que se cierra al cancelar el pedido.
-- Solo agrega un valor: ningun dato existente cambia.

-- AlterEnum
ALTER TYPE "EstadoPago" ADD VALUE IF NOT EXISTS 'ANULADO';
