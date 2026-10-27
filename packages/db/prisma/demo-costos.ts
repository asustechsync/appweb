/**
 * Datos de demostracion: costo para las variantes que no tienen ninguno, y el
 * mismo costo en las lineas de pedido que se vendieron sin costo, para que el
 * margen del Inicio tenga con que calcular.
 *
 *     npm run demo-costos -w @appweb/db
 *
 * El costo es un porcentaje del precio de venta (entre 38 % y 52 %, segun la
 * posicion) para que los margenes no salgan todos iguales. Idempotente: no toca
 * lo que ya tiene costo.
 *
 * Es solo para desarrollo: en produccion el costo sale de las compras a
 * proveedores o se escribe en el editor de producto.
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { cadenaConexion } from "../src/conexion";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: cadenaConexion() });
const prisma = new PrismaClient({ adapter });

/** Que parte del precio cuesta, por posicion del producto. */
const PROPORCIONES_COSTO = [0.38, 0.45, 0.52, 0.42, 0.48];

async function main() {
  const productos = await prisma.producto.findMany({
    select: { precio: true, variantes: { where: { costo: null }, select: { id: true } } },
    orderBy: { slug: "asc" },
  });

  let variantes = 0;
  for (const [posicion, producto] of productos.entries()) {
    const proporcion = PROPORCIONES_COSTO[posicion % PROPORCIONES_COSTO.length] ?? 0.45;
    const costo = Math.round(Number(producto.precio) * proporcion * 100) / 100;
    for (const variante of producto.variantes) {
      await prisma.variante.update({ where: { id: variante.id }, data: { costo } });
      variantes += 1;
    }
  }

  // Las ventas ya hechas congelaron "sin costo": se les copia el de su variante.
  const lineas = await prisma.itemPedido.findMany({
    where: { costoUnitario: null, variante: { costo: { not: null } } },
    select: { id: true, variante: { select: { costo: true } } },
  });
  for (const linea of lineas) {
    await prisma.itemPedido.update({
      where: { id: linea.id },
      data: { costoUnitario: linea.variante.costo },
    });
  }

  console.log(`Costo puesto en ${variantes} variantes y en ${lineas.length} lineas de pedido.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
