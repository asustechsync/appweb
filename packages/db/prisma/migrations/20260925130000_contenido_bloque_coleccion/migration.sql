ALTER TABLE "categorias"
  ADD COLUMN "portadaEtiqueta" TEXT,
  ADD COLUMN "portadaTitulo" TEXT,
  ADD COLUMN "portadaTexto" TEXT,
  ADD COLUMN "portadaImagen" TEXT,
  ADD COLUMN "portadaHref" TEXT;

UPDATE "categorias"
SET
  "portadaEtiqueta" = 'Nueva colección',
  "portadaTitulo" = 'Comodidad con personalidad',
  "portadaTexto" = 'Básicos cómodos para acompañarte todos los días.',
  "portadaImagen" = '/producto.webp',
  "portadaHref" = '/categorias/hombres'
WHERE "slug" = 'hombres';
