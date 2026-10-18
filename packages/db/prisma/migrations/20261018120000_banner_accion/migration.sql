-- Texto del boton de cada banner del carrusel de la portada.
ALTER TABLE "banners" ADD COLUMN "accion" TEXT NOT NULL DEFAULT 'Ver más';
