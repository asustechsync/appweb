-- Los pagos que se cerraron solos al cancelar un pedido (rechazados sin que
-- nadie los confirmara ni rechazara) pasan a ANULADO. Idempotente.
UPDATE "pagos" p
SET "estado" = 'ANULADO'
FROM "pedidos" d
WHERE p."pedidoId" = d."id"
  AND p."estado" = 'RECHAZADO'
  AND p."confirmadoPorId" IS NULL
  AND d."estado" = 'CANCELADO';
