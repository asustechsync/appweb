/**
 * Genera src/theme.css y src/tokens.native.ts desde tokens.ts.
 *
 *     npm run ui:tokens
 *
 * theme.css lo importa globals.css de cada app; tokens.native.ts lo importara
 * la app movil, que no puede leer CSS.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { tokens, tokensOscuro } from "./tokens";

const aqui = dirname(fileURLToPath(import.meta.url));

type Valor = string | number;
type Arbol = { [clave: string]: Valor | Arbol };

/** color.marca.500 -> --color-marca-500 */
function aplanar(objeto: Arbol, prefijo: string[] = []): Array<[string, Valor]> {
  return Object.entries(objeto).flatMap(([clave, valor]) => {
    const camino = [...prefijo, clave];
    return typeof valor === "object" && valor !== null
      ? aplanar(valor as Arbol, camino)
      : [[camino.join("-"), valor as Valor]];
  });
}

/** Las medidas van en px; los colores, fuentes y sombras tal cual. */
function conUnidad(nombre: string, valor: Valor): string {
  if (typeof valor === "string") return valor;
  if (valor === 0) return "0";
  const sinUnidad = ["tipo-peso", "tipo-altura", "z-"];
  return sinUnidad.some((p) => nombre.startsWith(p)) ? String(valor) : `${valor}px`;
}

function bloque(objeto: Arbol, sangria = "  "): string {
  return aplanar(objeto)
    .map(([nombre, valor]) => `${sangria}--${nombre}: ${conUnidad(nombre, valor)};`)
    .join("\n");
}

const css = `/* GENERADO POR generar-theme.ts — NO EDITAR A MANO.
   Cambia packages/ui/src/tokens.ts y corre: npm run ui:tokens */

:root {
${bloque(tokens as unknown as Arbol)}
}

/* El sistema decide, salvo que el usuario haya elegido. */
@media (prefers-color-scheme: dark) {
  :root:not([data-tema="claro"]) {
${bloque(tokensOscuro as unknown as Arbol, "    ")}
  }
}

/* La eleccion explicita gana en ambos sentidos. */
:root[data-tema="oscuro"] {
${bloque(tokensOscuro as unknown as Arbol)}
}
`;

const native = `// GENERADO POR generar-theme.ts — NO EDITAR A MANO.
// Lo consume la app movil, que no puede leer CSS.

export const tokensNativos = ${JSON.stringify(tokens, null, 2)} as const;

export const tokensNativosOscuro = ${JSON.stringify(tokensOscuro, null, 2)} as const;
`;

writeFileSync(join(aqui, "theme.css"), css, "utf8");
writeFileSync(join(aqui, "tokens.native.ts"), native, "utf8");

console.log("✅ theme.css y tokens.native.ts regenerados");
