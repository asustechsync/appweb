-- El negocio no cobra contra entrega: se quita el valor del enum.
-- Postgres no deja borrar un valor de un enum, asi que se recrea el tipo.
-- Falla si algun pedido o pago aun usa CONTRA_ENTREGA (a proposito: se corrige antes).
ALTER TYPE "MedioPago" RENAME TO "MedioPago_viejo";
CREATE TYPE "MedioPago" AS ENUM ('YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA');
ALTER TABLE "pedidos" ALTER COLUMN "medioPago" TYPE "MedioPago" USING "medioPago"::text::"MedioPago";
ALTER TABLE "pagos" ALTER COLUMN "medio" TYPE "MedioPago" USING "medio"::text::"MedioPago";
DROP TYPE "MedioPago_viejo";
