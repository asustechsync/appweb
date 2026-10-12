-- Quien registro cada movimiento de stock, y el SKU congelado en cada item.

-- AlterTable
ALTER TABLE "movimientos_stock" ADD COLUMN "usuarioId" TEXT;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: los items ya vendidos copian el SKU actual de su variante.
ALTER TABLE "items_pedido" ADD COLUMN "sku" TEXT;

UPDATE "items_pedido" i
SET "sku" = v."sku"
FROM "variantes" v
WHERE v."id" = i."varianteId";

ALTER TABLE "items_pedido" ALTER COLUMN "sku" SET NOT NULL;
