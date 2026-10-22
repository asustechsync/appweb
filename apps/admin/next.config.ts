import { networkInterfaces } from "node:os";
import { config as cargarEnv } from "dotenv";
import type { NextConfig } from "next";

// El .env.local vive en la raiz del monorepo, no en apps/admin. Next solo
// busca .env.local junto a next.config.ts.
cargarEnv({ path: "../../.env.local" });

const origenesLocales = [
  ...new Set(
    Object.values(networkInterfaces())
      .flatMap((interfaces) => interfaces ?? [])
      .filter((interfaz) => interfaz.family === "IPv4" && !interfaz.internal)
      .map((interfaz) => interfaz.address),
  ),
];

const config: NextConfig = {
  reactStrictMode: true,
  // Solo desarrollo: sin esto, abrir el panel desde el celular por la IP de la
  // red local carga el HTML pero Next bloquea /_next/* y la pagina no hidrata.
  // La IP cambia al conectarse a otra red: se toma de las interfaces activas.
  allowedDevOrigins: origenesLocales,
  // Los paquetes del monorepo se compilan con la app, no se publican.
  transpilePackages: ["@appweb/core", "@appweb/ui", "@appweb/api", "@appweb/db"],
  // Clase C: el panel es una SPA; esto solo aplica a las pocas rutas de
  // servidor que tenga. `experimental.useCache` esta deprecado aqui.
  cacheComponents: true,
};

export default config;
