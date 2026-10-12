-- Un solo nombre para "sale en portada": `destacado`, como `activo`.
-- RENAME COLUMN conserva los datos; no se borra ni se recrea nada.
ALTER TABLE "productos"  RENAME COLUMN "destacada" TO "destacado";
ALTER TABLE "categorias" RENAME COLUMN "destacada" TO "destacado";
ALTER TABLE "marcas"     RENAME COLUMN "destacada" TO "destacado";

-- El indice sigue a la columna: Prisma espera el nombre con `destacado`.
ALTER INDEX "marcas_activo_destacada_orden_idx" RENAME TO "marcas_activo_destacado_orden_idx";
