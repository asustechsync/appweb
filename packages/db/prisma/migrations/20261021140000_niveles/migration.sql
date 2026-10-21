-- Niveles de recompensa editables desde el panel. Hasta hoy vivian fijos en
-- `NIVELES` de @appweb/core; las tres filas arrancan con esos mismos valores,
-- asi que ningun cliente cambia de nivel al migrar.

-- CreateTable
CREATE TABLE "niveles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "desde" DECIMAL(10,2) NOT NULL,
    "descuentoPct" INTEGER NOT NULL,
    "beneficio" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "editadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveles_pkey" PRIMARY KEY ("id")
);

-- Mismas reglas que prisma/sql/restricciones.sql.
ALTER TABLE "niveles" ADD CONSTRAINT "niveles_valores_validos" CHECK (
  "desde" >= 0 AND "descuentoPct" BETWEEN 0 AND 100
);

INSERT INTO "niveles" ("id", "nombre", "desde", "descuentoPct", "beneficio", "orden", "editadoEn") VALUES
  ('BRONCE', 'Bronce', 0, 0, 'Tus compras suman para subir de nivel.', 0, CURRENT_TIMESTAMP),
  ('PLATA', 'Plata', 300, 5, '5% de descuento automático en cada compra.', 1, CURRENT_TIMESTAMP),
  ('ORO', 'Oro', 800, 10, '10% de descuento automático en cada compra.', 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
