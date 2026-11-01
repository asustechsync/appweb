/**
 * Genera src/datos/banderas.generado.ts desde las banderas de `flag-icons`.
 *
 *     npm run ui:banderas
 *
 * La web las pinta con el CSS de `flag-icons`; la app movil no puede leer CSS,
 * asi que lleva el mismo dibujo de cada bandera (4:3) como texto SVG.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PAISES } from "./datos/paises";

const aqui = dirname(fileURLToPath(import.meta.url));
const carpeta = join(
  dirname(createRequire(import.meta.url).resolve("flag-icons/package.json")),
  "flags",
  "4x3",
);

const banderas: Record<string, string> = {};
for (const { iso2 } of PAISES) {
  const archivo = join(carpeta, `${iso2}.svg`);
  if (!existsSync(archivo)) throw new Error(`flag-icons no trae la bandera "${iso2}"`);
  banderas[iso2] = readFileSync(archivo, "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

const salida = `// GENERADO POR generar-banderas.ts — NO EDITAR A MANO.
// Corre: npm run ui:banderas

export const BANDERAS: Record<string, string> = ${JSON.stringify(banderas, null, 2)};
`;

writeFileSync(join(aqui, "datos", "banderas.generado.ts"), salida, "utf8");
console.log(`✅ ${Object.keys(banderas).length} banderas generadas`);
