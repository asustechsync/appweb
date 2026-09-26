import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { cadenaConexion } from "./conexion";

/**
 * Cliente unico de Prisma.
 *
 * Prisma 7 no abre conexion por si solo: exige un "driver adapter" explicito.
 * Usamos el de `pg` contra DATABASE_URL (el pooler, puerto 6543).
 *
 * En desarrollo Next recarga los modulos en cada cambio; sin este cache global
 * cada recarga abriria una conexion nueva hasta agotar el pooler.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: cadenaConexion() });
  return new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalParaPrisma.prisma ?? crearCliente();

if (process.env["NODE_ENV"] !== "production") {
  globalParaPrisma.prisma = prisma;
}

export * from "@prisma/client";
