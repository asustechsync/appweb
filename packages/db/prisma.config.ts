import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// El .env.local vive en la raiz del monorepo y lo comparten todas las apps.
config({ path: "../../.env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/semilla.ts",
  },
  datasource: {
    // Las migraciones necesitan conexion directa, sin pooler.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
