-- Muestra de cada color en hex ("#1E2A4A"). Los colores iniciales la reciben
-- con `npm run atributos -w @appweb/db`; los nuevos, desde el panel.

ALTER TABLE "atributos"
ADD COLUMN IF NOT EXISTS "hex" TEXT;
