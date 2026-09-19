import { config as cargarEnv } from "dotenv";
import type { NextConfig } from "next";

// El .env.local vive en la raiz del monorepo, no en apps/admin. Next solo
// busca .env.local junto a next.config.ts.
cargarEnv({ path: "../../.env.local" });

const config: NextConfig = {
  reactStrictMode: true,
  // Los paquetes del monorepo se compilan con la app, no se publican.
  transpilePackages: ["@appweb/core", "@appweb/ui", "@appweb/api", "@appweb/db"],
  // Clase C: el panel es una SPA; esto solo aplica a las pocas rutas de
  // servidor que tenga. `experimental.useCache` esta deprecado aqui.
  cacheComponents: true,
};

export default config;
