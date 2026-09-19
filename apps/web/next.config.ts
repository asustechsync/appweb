import { config as cargarEnv } from "dotenv";
import type { NextConfig } from "next";

// El .env.local vive en la raiz del monorepo, no en apps/web. Next solo
// busca .env.local junto a next.config.ts, asi que sin esto DATABASE_URL
// falta durante `next build` (que ya consulta la base para pre-renderizar
// la portada) y cualquier `npm run dev` corrido fuera de la raiz.
cargarEnv({ path: "../../.env.local" });

const config: NextConfig = {
  reactStrictMode: true,
  // Los paquetes del monorepo se compilan con la app, no se publican.
  transpilePackages: ["@appweb/core", "@appweb/ui", "@appweb/api", "@appweb/db"],
  // Clase A: HTML cacheado que no toca la base en el request del visitante.
  // `experimental.useCache` esta deprecado en esta version; absorbido aqui.
  cacheComponents: true,
};

export default config;
