/**
 * Genera los componentes de icono desde los .svg de src/iconos/fuente.
 *
 *     npm run ui:iconos
 *
 * El .svg es la unica fuente: para añadir un icono se deja el archivo en su
 * carpeta (comercio, cuenta...) y se corre el comando. Nadie edita a mano
 * src/iconos/generados, src/iconos/nativos (los de la app movil) ni
 * src/iconos/index.ts.
 *
 * Reglas que se comprueban al generar, para que todos los iconos se vean igual:
 * - `viewBox` obligatorio y `width` = `height` (es el tamaño por defecto).
 * - Solo los iconos de `marcas/` pueden tener colores propios; el resto usa
 *   `currentColor` y hereda el color del texto.
 */

import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const carpetaIconos = join(aqui, "iconos");
const carpetaFuente = join(carpetaIconos, "fuente");
const carpetaGenerados = join(carpetaIconos, "generados");
const carpetaNativos = join(carpetaIconos, "nativos");

const AVISO = "// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos";

/** Atributos que el svg escribe con guion y React en camelCase. */
const ATRIBUTOS_REACT: Record<string, string> = {
  class: "className",
  style: "style",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "fill-rule": "fillRule",
  "fill-opacity": "fillOpacity",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-opacity": "strokeOpacity",
  // Degradados de los logos de marca (Plin).
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
};

/** Atributos de la raiz que el componente pone por su cuenta. */
const RAIZ_PROPIA = new Set(["xmlns", "width", "height", "class", "aria-hidden"]);

interface Icono {
  nombre: string;
  categoria: string;
  archivo: string;
  descripcion: string | null;
  tamano: number;
  atributos: Array<[string, string]>;
  cuerpo: string;
}

/** tarjeta-personal -> IconoTarjetaPersonal */
function nombreDeComponente(archivo: string): string {
  const base = archivo
    .replace(/\.svg$/, "")
    .split("-")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join("");
  return `Icono${base}`;
}

function leerAtributos(texto: string): Array<[string, string]> {
  return [...texto.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, clave, valor]) => [
    clave as string,
    valor as string,
  ]);
}

function aJsx(clave: string): string {
  return ATRIBUTOS_REACT[clave] ?? clave;
}

/** Convierte estilos SVG inline a props SVG compatibles con React DOM y React Native. */
function normalizarEstilos(texto: string): string {
  return texto.replace(/\sstyle="([^"]*)"/g, (_, estilos: string) => {
    const atributos = estilos
      .split(";")
      .map((regla) => regla.trim())
      .filter(Boolean)
      .map((regla) => {
        const separador = regla.indexOf(":");
        if (separador < 0) return regla;
        const clave = regla.slice(0, separador).trim();
        const valor = regla.slice(separador + 1).trim();
        return `${aJsx(clave)}="${valor}"`;
      });
    return ` ${atributos.join(" ")}`;
  });
}
function leerIcono(categoria: string, archivo: string): Icono {
  const ruta = `${categoria}/${archivo}`;
  const texto = normalizarEstilos(
    readFileSync(join(carpetaFuente, categoria, archivo), "utf8").replace(/\r\n/g, "\n"),
  );
  const descripcion = texto.match(/<!--\s*([\s\S]*?)\s*-->/)?.[1]?.replace(/\s+/g, " ") ?? null;
  const svg = texto.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/);
  if (!svg) throw new Error(`${ruta}: no tiene <svg>.`);

  const raiz = new Map(leerAtributos(svg[1] ?? ""));
  if (!raiz.has("viewBox")) throw new Error(`${ruta}: falta viewBox.`);

  const tamano = Number(raiz.get("width"));
  if (!Number.isFinite(tamano) || raiz.get("width") !== raiz.get("height")) {
    throw new Error(`${ruta}: width y height deben ser el mismo numero (tamaño por defecto).`);
  }

  const colores = [
    ...texto.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8}|rgb[^"]*|white|black)"/g),
  ];
  if (colores.length > 0 && categoria !== "marcas") {
    throw new Error(`${ruta}: usa colores fijos. Fuera de marcas/ solo vale currentColor.`);
  }

  const cuerpo = (svg[2] ?? "")
    .trim()
    .replace(/([\w:-]+)="/g, (_, clave: string) => `${aJsx(clave)}="`);

  return {
    nombre: nombreDeComponente(archivo),
    categoria,
    archivo: ruta,
    descripcion,
    tamano,
    atributos: [...raiz].filter(([clave]) => !RAIZ_PROPIA.has(clave)),
    cuerpo,
  };
}

function componente(icono: Icono): string {
  const atributos = icono.atributos.map(([clave, valor]) => `${aJsx(clave)}="${valor}"`).join(" ");
  const doc = icono.descripcion ? `/** ${icono.descripcion} */\n` : "";

  return `${AVISO}
// Fuente: src/iconos/fuente/${icono.archivo}
import type { PropsIcono } from "../tipos";

${doc}export function ${icono.nombre}({ tamano = ${icono.tamano}, className }: PropsIcono) {
  return (
    <svg width={tamano} height={tamano} ${atributos} aria-hidden="true" className={className}>
      ${icono.cuerpo}
    </svg>
  );
}
`;
}

/** Etiquetas del svg y su componente en react-native-svg. */
const ETIQUETAS_NATIVAS: Record<string, string> = {
  circle: "Circle",
  defs: "Defs",
  ellipse: "Ellipse",
  g: "G",
  linearGradient: "LinearGradient",
  path: "Path",
  rect: "Rect",
  stop: "Stop",
};

/**
 * El mismo icono para la app movil, con react-native-svg. `currentColor` toma
 * el `color` que recibe: en React Native no hay texto padre del que heredar.
 */
function componenteNativo(icono: Icono): string {
  const usadas = new Set<string>();
  const cuerpo = icono.cuerpo.replace(
    /<(\/?)([a-zA-Z]+)/g,
    (_, cierre: string, etiqueta: string) => {
      const nativa = ETIQUETAS_NATIVAS[etiqueta];
      if (!nativa) throw new Error(`${icono.archivo}: <${etiqueta}> no tiene version nativa.`);
      usadas.add(nativa);
      return `<${cierre}${nativa}`;
    },
  );
  const atributos = icono.atributos.map(([clave, valor]) => `${aJsx(clave)}="${valor}"`).join(" ");
  const importados = [...usadas].sort().join(", ");
  const doc = icono.descripcion ? `/** ${icono.descripcion} */\n` : "";

  return `${AVISO}
// Fuente: src/iconos/fuente/${icono.archivo}
import Svg, { ${importados} } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

${doc}export function ${icono.nombre}({ tamano = ${icono.tamano}, color }: PropsIconoNativo) {
  return (
    <Svg width={tamano} height={tamano} ${atributos} {...(color ? { color } : {})}>
      ${cuerpo}
    </Svg>
  );
}
`;
}

function indiceNativo(iconos: Icono[]): string {
  const lineas = [AVISO, "", 'export type { PropsIconoNativo } from "../tipos";'];
  for (const icono of iconos) {
    lineas.push(`export { ${icono.nombre} } from "./${icono.nombre}";`);
  }
  return `${lineas.join("\n")}\n`;
}

function indice(iconos: Icono[]): string {
  const lineas = [AVISO, "", 'export type { PropsIcono } from "./tipos";'];
  let categoria = "";
  for (const icono of iconos) {
    if (icono.categoria !== categoria) {
      categoria = icono.categoria;
      lineas.push("", `// ${categoria}`);
    }
    lineas.push(`export { ${icono.nombre} } from "./generados/${icono.nombre}";`);
  }
  return `${lineas.join("\n")}\n`;
}

const iconos = readdirSync(carpetaFuente, { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name)
  .sort()
  .flatMap((categoria) =>
    readdirSync(join(carpetaFuente, categoria))
      .filter((archivo) => archivo.endsWith(".svg"))
      .sort()
      .map((archivo) => leerIcono(categoria, archivo)),
  );

const repetidos = iconos.filter(
  (icono, i) => iconos.findIndex((o) => o.nombre === icono.nombre) !== i,
);
if (repetidos.length > 0) {
  throw new Error(
    `Nombres repetidos entre carpetas: ${repetidos.map((i) => i.archivo).join(", ")}`,
  );
}

rmSync(carpetaGenerados, { recursive: true, force: true });
mkdirSync(carpetaGenerados);
for (const icono of iconos) {
  writeFileSync(join(carpetaGenerados, `${icono.nombre}.tsx`), componente(icono));
}
writeFileSync(join(carpetaIconos, "index.ts"), indice(iconos));

rmSync(carpetaNativos, { recursive: true, force: true });
mkdirSync(carpetaNativos);
for (const icono of iconos) {
  writeFileSync(join(carpetaNativos, `${icono.nombre}.tsx`), componenteNativo(icono));
}
writeFileSync(join(carpetaNativos, "index.ts"), indiceNativo(iconos));

// Mismo formato que el resto del proyecto.
execSync(
  `npx biome format --write "${carpetaGenerados}" "${carpetaNativos}" "${join(carpetaIconos, "index.ts")}"`,
  {
    stdio: "ignore",
  },
);

console.log(`${iconos.length} iconos generados en src/iconos/generados y src/iconos/nativos.`);
