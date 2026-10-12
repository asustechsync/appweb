-- Fecha de edicion del perfil y ultimo inicio de sesion.
-- Los usuarios existentes reciben como `editadoEn` su fecha de alta;
-- `ultimoAccesoEn` queda NULL hasta su proximo inicio de sesion.

-- AlterTable
ALTER TABLE "usuarios"
  ADD COLUMN "editadoEn" TIMESTAMP(3),
  ADD COLUMN "ultimoAccesoEn" TIMESTAMP(3);

UPDATE "usuarios" SET "editadoEn" = "creadoEn";

ALTER TABLE "usuarios" ALTER COLUMN "editadoEn" SET NOT NULL;
