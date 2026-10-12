-- Banners de portada, fechas en categorias y marcas, specs en productos y
-- restricciones CHECK. Conserva los datos: el banner que vivia en las columnas
-- `portada*` de `categorias` pasa a la tabla `banners` antes de borrarlas.

-- AlterTable: fechas. Las filas existentes reciben la fecha de hoy.
ALTER TABLE "categorias"
  ADD COLUMN "creadoEn"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "editadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "categorias" ALTER COLUMN "editadoEn" DROP DEFAULT;

ALTER TABLE "marcas"
  ADD COLUMN "creadoEn"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "editadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "marcas" ALTER COLUMN "editadoEn" DROP DEFAULT;

-- AlterTable: datos tecnicos del producto.
ALTER TABLE "productos" ADD COLUMN "specs" JSONB;

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_activo_orden_idx" ON "banners"("activo", "orden");

-- Una fila de banner por cada categoria que tenia contenido de portada.
INSERT INTO "banners" ("id", "etiqueta", "titulo", "texto", "imagenUrl", "href", "orden", "editadoEn")
SELECT
  gen_random_uuid()::text,
  coalesce("portadaEtiqueta", 'Nueva colección'),
  "portadaTitulo",
  coalesce("portadaTexto", ''),
  coalesce("portadaImagen", '/producto.webp'),
  coalesce("portadaHref", '/categorias/' || "slug"),
  "orden",
  CURRENT_TIMESTAMP
FROM "categorias"
WHERE "portadaTitulo" IS NOT NULL;

-- AlterTable: las columnas de portada ya no pertenecen al catalogo.
ALTER TABLE "categorias"
  DROP COLUMN "portadaEtiqueta",
  DROP COLUMN "portadaTitulo",
  DROP COLUMN "portadaTexto",
  DROP COLUMN "portadaImagen",
  DROP COLUMN "portadaHref";

-- ── Restricciones CHECK ───────────────────────────────────────────────────
-- Mismo SQL que prisma/sql/restricciones.sql.
DO $$
DECLARE
  regla record;
BEGIN
  FOR regla IN
    SELECT * FROM (VALUES
      ('productos',        'productos_precio_valido',
       $c$"precio" >= 0 AND ("precioLista" IS NULL OR "precioLista" > "precio")$c$),
      ('variantes',        'variantes_stock_no_negativo',
       $c$"stock" >= 0$c$),
      ('movimientos_stock','movimientos_stock_delta_no_cero',
       $c$"delta" <> 0$c$),
      ('items_pedido',     'items_pedido_valores_validos',
       $c$"cantidad" > 0 AND "precioUnitario" >= 0$c$),
      ('pedidos',          'pedidos_montos_validos',
       $c$"subtotal" >= 0 AND "descuento" >= 0 AND "costoEnvio" >= 0 AND "total" >= 0$c$),
      ('pagos',            'pagos_monto_no_negativo',
       $c$"monto" >= 0$c$),
      ('cupones',          'cupones_porcentaje_valido',
       $c$"porcentaje" BETWEEN 1 AND 100$c$),
      ('metodos_envio',    'metodos_envio_costos_validos',
       $c$"costo" >= 0 AND ("gratisDesde" IS NULL OR "gratisDesde" >= 0)$c$)
    ) AS t(tabla, nombre, condicion)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = regla.nombre) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)', regla.tabla, regla.nombre, regla.condicion);
    END IF;
  END LOOP;
END
$$;
