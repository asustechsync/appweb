import type { MetadataRoute } from "next";
import { URL_TIENDA } from "@appweb/api/urls";

/** Lo privado (cuenta, compra, pedidos, API) no tiene nada que buscar en Google. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/mi-cuenta", "/carrito", "/checkout", "/pedido/", "/api/", "/buscar"],
    },
    sitemap: `${URL_TIENDA}/sitemap.xml`,
  };
}
