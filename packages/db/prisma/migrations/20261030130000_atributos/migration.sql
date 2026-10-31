-- Tipos de prenda y atributos (colores, diseños, etiquetas) gestionables desde
-- el panel. Los valores iniciales los carga `npm run atributos -w @appweb/db`,
-- que lee las listas del nucleo y los valores ya usados en el catalogo.

DO $$ BEGIN
  CREATE TYPE "ClaseAtributo" AS ENUM ('COLOR', 'DISENO', 'ETIQUETA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "tipos_prenda" (
  "id" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "palabras" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "tallas" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "orden" INTEGER NOT NULL DEFAULT 0,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tipos_prenda_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tipos_prenda_codigo_key" ON "tipos_prenda"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "tipos_prenda_nombre_key" ON "tipos_prenda"("nombre");

CREATE TABLE IF NOT EXISTS "atributos" (
  "id" TEXT NOT NULL,
  "clase" "ClaseAtributo" NOT NULL,
  "codigo" TEXT,
  "nombre" TEXT NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "atributos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "atributos_clase_nombre_key" ON "atributos"("clase", "nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "atributos_clase_codigo_key" ON "atributos"("clase", "codigo");
