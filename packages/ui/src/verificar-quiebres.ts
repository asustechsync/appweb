/**
 * Falla si algun @media usa un ancho fuera de tokens.quiebre.
 *
 *     npm run ui:quiebres
 *
 * Los @container no se revisan: miden al componente, no a la pantalla.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { tokens } from "./tokens";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const carpetas = ["packages/ui/src", "apps/web/src", "apps/admin/src"];

const validos = new Set<number>(Object.values(tokens.quiebre));
const escala = Object.entries(tokens.quiebre)
  .map(([nombre, px]) => `${nombre} ${px / 16}rem`)
  .join(", ");

// Cubre `min-width: 48rem` y la sintaxis de rango `width >= 48rem`.
const anchoEnMedia = /width\s*(?::|>=|<=|>|<)\s*([\d.]+)(rem|em|px)/g;

const fallas: string[] = [];

for (const carpeta of carpetas) {
  const base = join(raiz, carpeta);
  for (const archivo of readdirSync(base, { recursive: true, encoding: "utf8" })) {
    if (!archivo.endsWith(".css")) continue;
    const lineas = readFileSync(join(base, archivo), "utf8").split("\n");
    lineas.forEach((linea, i) => {
      if (!linea.includes("@media")) return;
      for (const [texto, valor, unidad] of linea.matchAll(anchoEnMedia)) {
        const px = unidad === "px" ? Number(valor) : Number(valor) * 16;
        if (!validos.has(px)) {
          fallas.push(`  ${relative(raiz, join(base, archivo))}:${i + 1}  ${texto}`);
        }
      }
    });
  }
}

if (fallas.length > 0) {
  console.error(`❌ @media fuera de la escala de quiebres (${escala}):\n${fallas.join("\n")}`);
  process.exit(1);
}

console.log("✅ Todos los @media usan la escala de quiebres");
