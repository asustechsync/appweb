-- Una sola direccion principal por usuario.
-- Prisma no expresa indices parciales, por eso vive aqui. Idempotente: se puede
-- correr las veces que haga falta. La migracion
-- 20261011120000_ampliar_pagos_marcas_historial lo crea con este mismo SQL.
CREATE UNIQUE INDEX IF NOT EXISTS "direcciones_una_principal"
  ON "direcciones" ("usuarioId")
  WHERE "principal";
