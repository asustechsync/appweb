import type { MetadataRoute } from "next";

/** El panel no se indexa nunca. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
