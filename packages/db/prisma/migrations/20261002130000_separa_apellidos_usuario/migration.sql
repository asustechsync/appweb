-- Conserva los datos: el apellido que ya existia pasa a ser el paterno.
ALTER TABLE "usuarios" RENAME COLUMN "apellido" TO "apellidoPaterno";
ALTER TABLE "usuarios" ADD COLUMN "apellidoMaterno" TEXT;
