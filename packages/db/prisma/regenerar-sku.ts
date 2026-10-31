/**
 * Pasa el catalogo al SKU corto (BX012-M-112).
 *
 * 1. Cada producto sin `codigo` recibe el siguiente de su tipo, deducido del
 *    nombre, en orden de creacion: el mas antiguo de cada tipo queda 001.
 * 2. Cada variante recalcula su SKU con las reglas de `@appweb/core`.
 *
 * Idempotente: correrlo dos veces deja lo mismo. Los pedidos no cambian,
 * porque `ItemPedido` guarda su propia copia del SKU (regla 7). Una variante
 * con un color fuera de `COLORES` se avisa y conserva su SKU anterior.
 *
 *   npm run regenerar-sku -w @appweb/db
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  COLORES,
  colorRegistrado,
  siguienteCodigoProducto,
  skuDeVariante,
  tipoDesdeNombre,
  TIPOS_PRENDA,
} from "@appweb/core";
import { cadenaConexion } from "../src/conexion";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: cadenaConexion() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const productos = await prisma.producto.findMany({
    orderBy: { creadoEn: "asc" },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      variantes: { select: { id: true, talla: true, color: true, disenoCodigo: true, sku: true } },
    },
  });

  const usados = productos.flatMap((p) => (p.codigo ? [p.codigo] : []));
  let cambiadas = 0;
  const sinColor: string[] = [];

  for (const producto of productos) {
    let codigo = producto.codigo;
    if (codigo === null) {
      codigo = siguienteCodigoProducto(tipoDesdeNombre(producto.nombre, TIPOS_PRENDA), usados);
      usados.push(codigo);
      await prisma.producto.update({ where: { id: producto.id }, data: { codigo } });
      console.log(`✔ ${codigo} ${producto.nombre}`);
    }

    for (const variante of producto.variantes) {
      const color = colorRegistrado(variante.color, COLORES);
      if (color === null) {
        sinColor.push(`${variante.sku} (color "${variante.color}")`);
        continue;
      }
      const sku = skuDeVariante(codigo, variante.talla, color.codigo, variante.disenoCodigo);
      if (sku === variante.sku) continue;
      await prisma.variante.update({ where: { id: variante.id }, data: { sku } });
      cambiadas++;
    }
  }

  console.log(`\n${cambiadas} SKU regenerados.`);
  if (sinColor.length > 0) {
    console.log("Sin cambio, el color no esta en COLORES:");
    for (const linea of sinColor) console.log(`  · ${linea}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
