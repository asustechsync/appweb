-- Proveedores y compras: el costo de la mercaderia entra con cada compra, se
-- congela en ItemPedido al vender y la variante guarda el ultimo como cache.
-- Packs: recetas de variantes con precio propio.
-- AlterTable
ALTER TABLE "variantes" ADD COLUMN     "costo" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "movimientos_stock" ADD COLUMN     "compraId" TEXT;

-- AlterTable
ALTER TABLE "items_pedido" ADD COLUMN     "costoUnitario" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "packs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pack" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "items_pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "nota" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "documento" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "nota" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_compra" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "items_compra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packs_slug_key" ON "packs"("slug");

-- CreateIndex
CREATE INDEX "items_pack_varianteId_idx" ON "items_pack"("varianteId");

-- CreateIndex
CREATE UNIQUE INDEX "items_pack_packId_varianteId_key" ON "items_pack"("packId", "varianteId");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nombre_key" ON "proveedores"("nombre");

-- CreateIndex
CREATE INDEX "compras_proveedorId_creadoEn_idx" ON "compras"("proveedorId", "creadoEn");

-- CreateIndex
CREATE INDEX "compras_creadoEn_idx" ON "compras"("creadoEn");

-- CreateIndex
CREATE INDEX "items_compra_compraId_idx" ON "items_compra"("compraId");

-- CreateIndex
CREATE INDEX "items_compra_varianteId_idx" ON "items_compra"("varianteId");

-- CreateIndex
CREATE INDEX "movimientos_stock_compraId_idx" ON "movimientos_stock"("compraId");

-- AddForeignKey
ALTER TABLE "items_pack" ADD CONSTRAINT "items_pack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pack" ADD CONSTRAINT "items_pack_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Mismas reglas que prisma/sql/restricciones.sql.
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_costo_no_negativo" CHECK ("costo" IS NULL OR "costo" >= 0);
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_costo_no_negativo" CHECK ("costoUnitario" IS NULL OR "costoUnitario" >= 0);
ALTER TABLE "packs" ADD CONSTRAINT "packs_precio_no_negativo" CHECK ("precio" >= 0);
ALTER TABLE "items_pack" ADD CONSTRAINT "items_pack_cantidad_valida" CHECK ("cantidad" > 0);
ALTER TABLE "compras" ADD CONSTRAINT "compras_total_no_negativo" CHECK ("total" >= 0);
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_valores_validos" CHECK ("cantidad" > 0 AND "costoUnitario" >= 0);
