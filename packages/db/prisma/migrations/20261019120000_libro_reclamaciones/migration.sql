-- Libro de Reclamaciones virtual: una hoja por reclamo o queja.
CREATE TYPE "TipoReclamo" AS ENUM ('RECLAMO', 'QUEJA');
CREATE TYPE "TipoBien" AS ENUM ('PRODUCTO', 'SERVICIO');
CREATE TYPE "EstadoReclamo" AS ENUM ('PENDIENTE', 'RESPONDIDO');

CREATE TABLE "reclamos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "tipo" "TipoReclamo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "menorDeEdad" BOOLEAN NOT NULL DEFAULT false,
    "apoderado" TEXT,
    "tipoBien" "TipoBien" NOT NULL,
    "pedidoCodigo" TEXT,
    "monto" DECIMAL(10,2),
    "descripcionBien" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "pedido" TEXT NOT NULL,
    "estado" "EstadoReclamo" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "respondidoPorId" TEXT,
    "respondidoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reclamos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reclamos_numero_key" ON "reclamos"("numero");
CREATE INDEX "reclamos_estado_creadoEn_idx" ON "reclamos"("estado", "creadoEn");

ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_respondidoPorId_fkey" FOREIGN KEY ("respondidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Una hoja respondida trae su respuesta, y una pendiente no.
ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_respuesta_coherente" CHECK (
  ("estado" = 'PENDIENTE' AND "respuesta" IS NULL)
  OR ("estado" = 'RESPONDIDO' AND "respuesta" IS NOT NULL AND "respondidoEn" IS NOT NULL)
);
