-- Fecha hasta la que el producto muestra la etiqueta "Nuevo".

ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "nuevoHasta" DATE;
