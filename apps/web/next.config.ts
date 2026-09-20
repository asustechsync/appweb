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
  // Sin esto, `npm run dev` abierto desde el celular (o cualquier IP de la
  // red local) carga el HTML pero Next bloquea los chunks de /_next/* por
  // venir de un origen distinto a localhost: la pagina nunca hidrata y
  // ningun boton responde. Solo aplica en dev, next build lo ignora.
  //
  // No admite rangos CIDR, solo hosts exactos o comodin de subdominio
  // (`*.ejemplo.com`) — hay que listar cada IP de LAN que se vaya a usar.
  // Esta es la que "npm run dev" imprime como "Network:" al arrancar; si
  // cambia (otra red, otra maquina), hay que actualizarla aqui.
  allowedDevOrigins: ["172.25.64.1"],
};

export default config;
