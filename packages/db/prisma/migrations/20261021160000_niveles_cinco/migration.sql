-- Cinco niveles con requisito doble (monto y pedidos): Básico, Bronce, Plata,
-- Oro y Platino. Los niveles ya no dan envio gratis; solo descuento en
-- productos y obsequios con compra.
--
-- Las filas se reescriben con el esquema nuevo: Bronce deja de ser el nivel
-- de entrada (ahora es Básico) y los descuentos bajan, asi que algunos
-- clientes cambian de nivel al migrar.

-- AlterTable
ALTER TABLE "niveles" ADD COLUMN "pedidosMinimos" INTEGER NOT NULL DEFAULT 0;

-- Misma regla que prisma/sql/restricciones.sql.
ALTER TABLE "niveles" ADD CONSTRAINT "niveles_pedidos_validos" CHECK ("pedidosMinimos" >= 0);

INSERT INTO "niveles" ("id", "nombre", "desde", "pedidosMinimos", "descuentoPct", "beneficio", "orden", "editadoEn") VALUES
  ('BASICO', 'Básico', 0, 0, 0, 'Tus compras suman para subir de nivel.', 0, CURRENT_TIMESTAMP),
  ('BRONCE', 'Bronce', 300, 3, 3, '3% en cada compra y un par de medias de regalo al subir de nivel.', 1, CURRENT_TIMESTAMP),
  ('PLATA', 'Plata', 550, 5, 5, '5% en cada compra y un regalo de cumpleaños con tu compra.', 2, CURRENT_TIMESTAMP),
  ('ORO', 'Oro', 950, 8, 7, '7% en cada compra y un par de medias cada 3 meses con tu compra.', 3, CURRENT_TIMESTAMP),
  ('PLATINO', 'Platino', 1500, 12, 10, '10% en cada compra y un boxer de regalo en tu cumpleaños.', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "nombre" = EXCLUDED."nombre",
  "desde" = EXCLUDED."desde",
  "pedidosMinimos" = EXCLUDED."pedidosMinimos",
  "descuentoPct" = EXCLUDED."descuentoPct",
  "beneficio" = EXCLUDED."beneficio",
  "orden" = EXCLUDED."orden",
  "editadoEn" = EXCLUDED."editadoEn";
