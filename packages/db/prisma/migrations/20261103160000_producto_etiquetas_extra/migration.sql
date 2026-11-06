-- Un producto puede llevar varias etiquetas: `etiqueta` es la principal y
-- `etiquetasExtra` las demas.

ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "etiquetasExtra" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
