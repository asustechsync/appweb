-- SKU corto (BX012-M-112): codigo de modelo en productos, diseño en variantes
-- y en los items del pedido. Los SKU actuales se regeneran despues con
-- `npm run regenerar-sku -w @appweb/db`, que usa las mismas reglas del nucleo.

ALTER TABLE "productos"
ADD COLUMN IF NOT EXISTS "codigo" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "productos_codigo_key" ON "productos"("codigo");

ALTER TABLE "variantes"
ADD COLUMN IF NOT EXISTS "diseno" TEXT NOT NULL DEFAULT 'Liso',
ADD COLUMN IF NOT EXISTS "disenoCodigo" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "variantes_productoId_talla_color_key";

CREATE UNIQUE INDEX IF NOT EXISTS "variantes_productoId_talla_color_diseno_key"
ON "variantes"("productoId", "talla", "color", "diseno");

ALTER TABLE "items_pedido"
ADD COLUMN IF NOT EXISTS "diseno" TEXT NOT NULL DEFAULT 'Liso';
