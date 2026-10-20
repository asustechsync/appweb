-- Reseñas de producto: una por cliente y producto, visibles tras moderacion.
CREATE TYPE "EstadoResena" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

CREATE TABLE "resenas" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "comentario" TEXT,
    "estado" "EstadoResena" NOT NULL DEFAULT 'PENDIENTE',
    "moderadoPorId" TEXT,
    "moderadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resenas_usuarioId_productoId_key" ON "resenas"("usuarioId", "productoId");
CREATE INDEX "resenas_productoId_estado_creadoEn_idx" ON "resenas"("productoId", "estado", "creadoEn");
CREATE INDEX "resenas_estado_creadoEn_idx" ON "resenas"("estado", "creadoEn");

ALTER TABLE "resenas" ADD CONSTRAINT "resenas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_moderadoPorId_fkey" FOREIGN KEY ("moderadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mismas reglas que prisma/sql/restricciones.sql.
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_estrellas_validas" CHECK ("estrellas" BETWEEN 1 AND 5);
-- Una reseña aprobada o rechazada dice cuando se modero; una pendiente puede no decirlo.
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_moderacion_coherente" CHECK (
  "estado" = 'PENDIENTE' OR "moderadoEn" IS NOT NULL
);
