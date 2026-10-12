-- Indices para los listados de la cabecera (categorias) y la portada (marcas).

-- CreateIndex
CREATE INDEX "categorias_activo_padreId_orden_idx" ON "categorias"("activo", "padreId", "orden");

-- CreateIndex
CREATE INDEX "marcas_activo_destacada_orden_idx" ON "marcas"("activo", "destacada", "orden");
