import { PrismaClient } from "@prisma/client";

/**
 * Cliente unico de Prisma.
 *
 * En desarrollo Next recarga los modulos en cada cambio; sin este cache global
 * cada recarga abriria una conexion nueva hasta agotar el pooler.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalParaPrisma.prisma = prisma;
}

export * from "@prisma/client";
