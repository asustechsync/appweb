/**
 * Datos de demostracion: pagos con tarjeta para ver como se ven en el panel
 * mientras no hay pasarela.
 *
 *     npm run demo-pagos -w @appweb/db
 *
 * Agrega un pago con Visa y otro con Mastercard a los dos pedidos mas
 * recientes. Uno confirmado y otro rechazado, para ver los dos estados. No
 * toca el pedido ni su estado: solo agrega filas a `pagos`. Idempotente: la
 * referencia DEMO-TARJETA-* no se repite.
 *
 * Es solo para desarrollo. Para quitarlos:
 *     DELETE FROM pagos WHERE referencia LIKE 'DEMO-TARJETA-%';
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { cadenaConexion } from "../src/conexion";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: cadenaConexion() });
const prisma = new PrismaClient({ adapter });

const EJEMPLOS = [
  { marca: "Visa", ultimos: "4242", estado: "CONFIRMADO" as const },
  { marca: "Mastercard", ultimos: "5100", estado: "RECHAZADO" as const },
];

async function main() {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { creadoEn: "desc" },
    take: EJEMPLOS.length,
    select: { id: true, codigo: true, total: true },
  });

  let creados = 0;
  for (const [i, pedido] of pedidos.entries()) {
    const ejemplo = EJEMPLOS[i];
    if (!ejemplo) continue;
    const referencia = `DEMO-TARJETA-${pedido.codigo}`;
    const existe = await prisma.pago.findFirst({ where: { medio: "TARJETA", referencia } });
    if (existe) continue;

    await prisma.pago.create({
      data: {
        pedidoId: pedido.id,
        medio: "TARJETA",
        monto: pedido.total,
        estado: ejemplo.estado,
        referencia,
        tarjetaMarca: ejemplo.marca,
        tarjetaUltimos: ejemplo.ultimos,
      },
    });
    creados++;
  }

  console.log(`Pagos con tarjeta de demostracion creados: ${creados}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
