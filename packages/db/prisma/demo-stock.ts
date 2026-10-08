/**
 * Datos de demostracion: historial de stock para las variantes que no tienen
 * ninguno.
 *
 *     npm run demo-stock -w @appweb/db
 *
 * Por variante escribe un INGRESO (stock actual + lo "vendido") y una VENTA
 * por lo vendido, asi la suma de movimientos coincide con `variante.stock` y
 * no se toca esa columna. Sirve para ver la barra de stock de la tarjeta de
 * oferta. Idempotente: salta las variantes que ya tienen movimientos.
 *
 * Es solo para desarrollo: al reiniciar la base de datos (migrate reset +
 * semilla) desaparece junto con todo lo demas.
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { cadenaConexion } from "../src/conexion";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: cadenaConexion() });
const prisma = new PrismaClient({ adapter });

/** Proporcion vendida por posicion, para que las barras no salgan todas iguales. */
const PROPORCIONES_VENDIDAS = [0.3, 0.45, 0.6, 0.75];

async function main() {
  const variantes = await prisma.variante.findMany({
    where: { movimientos: { none: {} } },
    select: { id: true, sku: true, stock: true },
    orderBy: { sku: "asc" },
  });

  let creadas = 0;
  for (const [posicion, variante] of variantes.entries()) {
    const proporcion = PROPORCIONES_VENDIDAS[posicion % PROPORCIONES_VENDIDAS.length] ?? 0.5;
    const vendido = Math.round(variante.stock * proporcion);

    await prisma.movimientoStock.createMany({
      data: [
        { varianteId: variante.id, delta: variante.stock + vendido, motivo: "INGRESO", nota: "Datos de demostracion" },
        ...(vendido > 0
          ? [{ varianteId: variante.id, delta: -vendido, motivo: "VENTA" as const, nota: "Datos de demostracion" }]
          : []),
      ],
    });
    creadas += 1;
    console.log(`  ✔ ${variante.sku} — ingreso ${variante.stock + vendido}, vendido ${vendido}, queda ${variante.stock}`);
  }

  console.log(`\n${creadas} variantes con historial (${variantes.length === 0 ? "ya estaban todas" : "nuevas"}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
