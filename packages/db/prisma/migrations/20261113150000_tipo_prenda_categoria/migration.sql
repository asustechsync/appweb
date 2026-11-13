-- El tipo de prenda decide la categoria de tipo de sus productos.

-- AlterTable
ALTER TABLE "tipos_prenda" ADD COLUMN "categoriaId" TEXT;
-- CreateIndex
CREATE INDEX "tipos_prenda_categoriaId_idx" ON "tipos_prenda"("categoriaId");
-- AddForeignKey
ALTER TABLE "tipos_prenda" ADD CONSTRAINT "tipos_prenda_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
