import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Los paquetes del monorepo se compilan con la app, no se publican.
  transpilePackages: ["@appweb/core", "@appweb/ui", "@appweb/api", "@appweb/db"],
  experimental: {
    // Clase A: HTML cacheado que no toca la base en el request del visitante.
    useCache: true,
  },
};

export default config;
