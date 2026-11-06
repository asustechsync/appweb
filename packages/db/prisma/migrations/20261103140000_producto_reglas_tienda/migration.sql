-- Reglas de la tienda por producto. Todas encendidas: el comportamiento de hoy.

ALTER TABLE "productos"
  ADD COLUMN IF NOT EXISTS "mostrarAgotado" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "permiteResenas" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "enPacks" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "enBuscador" BOOLEAN NOT NULL DEFAULT true;
