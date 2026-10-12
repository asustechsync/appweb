-- Marcas, pagos, historial de pedidos, cupones, seguimiento de envio e indices.
-- Conserva los datos: la columna `productos.marca` pasa a la tabla `marcas`
-- antes de borrarse, y los pedidos existentes reciben su primera fila de
-- historial.

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'REEMBOLSADO');

-- AlterTable
ALTER TABLE "direcciones" ADD COLUMN     "destinatario" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "codigoSeguimiento" TEXT,
ADD COLUMN     "cuponCodigo" TEXT,
ADD COLUMN     "entregadoEn" TIMESTAMP(3),
ADD COLUMN     "enviadoEn" TIMESTAMP(3),
ADD COLUMN     "envioDestinatario" TEXT,
ADD COLUMN     "transportista" TEXT;

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "logoUrl" TEXT,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "tituloSeo" TEXT,
    "descripcionSeo" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "referencia" TEXT,
    "comprobanteUrl" TEXT,
    "confirmadoPorId" TEXT,
    "confirmadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estadoAnterior" "EstadoPedido",
    "estadoNuevo" "EstadoPedido" NOT NULL,
    "usuarioId" TEXT,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupones" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "porcentaje" INTEGER NOT NULL,
    "minimoCompra" DECIMAL(10,2),
    "usosMaximos" INTEGER,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "desde" TIMESTAMP(3),
    "hasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marcas_slug_key" ON "marcas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- ── Marcas: del texto de `productos.marca` a la tabla ─────────────────────
-- Una marca por nombre distinto (sin distinguir mayusculas ni espacios de los
-- bordes); se conserva la primera escritura como nombre oficial.
INSERT INTO "marcas" ("id", "slug", "nombre")
SELECT
  gen_random_uuid()::text,
  trim(both '-' from regexp_replace(lower(nombre), '[^a-z0-9]+', '-', 'g')),
  nombre
FROM (
  SELECT DISTINCT ON (lower(trim("marca"))) trim("marca") AS nombre
  FROM "productos"
  WHERE "marca" IS NOT NULL AND trim("marca") <> ''
  ORDER BY lower(trim("marca")), trim("marca")
) AS distintas;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN "marcaId" TEXT;

UPDATE "productos" p
SET "marcaId" = m."id"
FROM "marcas" m
WHERE p."marca" IS NOT NULL
  AND lower(trim(p."marca")) = lower(m."nombre");

ALTER TABLE "productos" DROP COLUMN "marca";

-- CreateIndex
CREATE INDEX "pagos_pedidoId_idx" ON "pagos"("pedidoId");

-- CreateIndex
CREATE INDEX "pagos_estado_creadoEn_idx" ON "pagos"("estado", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_medio_referencia_key" ON "pagos"("medio", "referencia");

-- CreateIndex
CREATE INDEX "historial_pedido_pedidoId_creadoEn_idx" ON "historial_pedido"("pedidoId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "cupones_codigo_key" ON "cupones"("codigo");

-- CreateIndex
CREATE INDEX "items_pedido_varianteId_idx" ON "items_pedido"("varianteId");

-- CreateIndex
CREATE INDEX "productos_marcaId_activo_idx" ON "productos"("marcaId", "activo");

-- CreateIndex
CREATE INDEX "productos_activo_creadoEn_idx" ON "productos"("activo", "creadoEn");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_pedido" ADD CONSTRAINT "historial_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_pedido" ADD CONSTRAINT "historial_pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Pedidos que ya existen ────────────────────────────────────────────────
-- Primera fila de historial con el estado actual, para que ningun pedido
-- tenga el historial vacio.
INSERT INTO "historial_pedido" ("id", "pedidoId", "estadoNuevo", "nota", "creadoEn")
SELECT gen_random_uuid()::text, "id", "estado", 'Estado al migrar el historial', "creadoEn"
FROM "pedidos";

-- Los pedidos que siguen esperando pago reciben su pago pendiente. A los ya
-- pagados no se les inventa un pago: no se sabe con que referencia entraron.
INSERT INTO "pagos" ("id", "pedidoId", "medio", "monto", "estado", "creadoEn")
SELECT gen_random_uuid()::text, "id", "medioPago", "total", 'PENDIENTE', "creadoEn"
FROM "pedidos"
WHERE "estado" = 'PENDIENTE_PAGO';

-- ── Una sola direccion principal por usuario ──────────────────────────────
-- Si algun usuario ya tiene varias, queda la mas reciente (el cuid crece con
-- el tiempo) y las demas pasan a no principales. Despues, el mismo SQL de
-- prisma/sql/direccion-principal.sql.
UPDATE "direcciones" d
SET "principal" = false
WHERE d."principal"
  AND EXISTS (
    SELECT 1 FROM "direcciones" o
    WHERE o."usuarioId" = d."usuarioId" AND o."principal" AND o."id" > d."id"
  );

CREATE UNIQUE INDEX IF NOT EXISTS "direcciones_una_principal"
  ON "direcciones" ("usuarioId")
  WHERE "principal";
