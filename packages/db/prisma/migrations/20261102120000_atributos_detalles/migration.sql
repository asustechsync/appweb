-- Detalles de la prenda (material, ajuste, caracteristicas) como clases de
-- atributo: el panel las ofrece como chips y el producto guarda lo elegido en
-- `specs`. Los valores iniciales los carga `npm run atributos -w @appweb/db`.

ALTER TYPE "ClaseAtributo" ADD VALUE IF NOT EXISTS 'MATERIAL';
ALTER TYPE "ClaseAtributo" ADD VALUE IF NOT EXISTS 'AJUSTE';
ALTER TYPE "ClaseAtributo" ADD VALUE IF NOT EXISTS 'CARACTERISTICA';
