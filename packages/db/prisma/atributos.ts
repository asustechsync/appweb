/**
 * Carga los tipos de prenda y atributos iniciales en una base ya creada.
 *
 *   npm run atributos -w @appweb/db
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { cadenaConexion } from "../src/conexion";
import { sembrarAtributos } from "./atributos-iniciales";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: cadenaConexion() });
const prisma = new PrismaClient({ adapter });

sembrarAtributos(prisma)
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
