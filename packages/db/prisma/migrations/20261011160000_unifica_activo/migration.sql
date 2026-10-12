-- Un solo nombre para "visible": `activo`, igual que en `productos`.
-- RENAME COLUMN conserva los datos; no se borra ni se recrea nada.
ALTER TABLE "categorias" RENAME COLUMN "activa" TO "activo";
ALTER TABLE "marcas"     RENAME COLUMN "activa" TO "activo";
ALTER TABLE "variantes"  RENAME COLUMN "activa" TO "activo";

-- El indice sigue a la columna: Prisma espera el nombre con `activo`.
ALTER INDEX "variantes_productoId_activa_idx" RENAME TO "variantes_productoId_activo_idx";
