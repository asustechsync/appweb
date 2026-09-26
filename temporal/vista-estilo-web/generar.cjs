const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const raiz = path.resolve(__dirname, "../..");
const respaldo = path.join(raiz, "temporal/estilo-web-2026-09-23");

function cargarComponente(archivo, nombres) {
  const fuente = fs.readFileSync(archivo, "utf8").replace(/^import .+;\r?\n/gm, "");
  const codigo = esbuild.transformSync(fuente, {
    loader: "tsx",
    format: "cjs",
    jsx: "automatic",
    target: "es2022",
  }).code;
  const modulo = { exports: {} };
  new Function("require", "module", "exports", ...Object.keys(nombres), codigo)(
    require,
    modulo,
    modulo.exports,
    ...Object.values(nombres),
  );
  return modulo.exports;
}

const { IconoBeneficio } = cargarComponente(
  path.join(raiz, "packages/ui/src/iconos/IconoBeneficio.tsx"),
  {},
);
const Link = ({ children, ...propiedades }) =>
  React.createElement("a", { ...propiedades, href: "#" }, children);
const { EscaparatePortada } = cargarComponente(
  path.join(respaldo, "EscaparatePortada.tsx"),
  { Link, IconoBeneficio },
);

const portada = renderToStaticMarkup(
  React.createElement(EscaparatePortada, {
    nombre: "Boxer Botánico",
    subtitulo: "Comodidad premium para todos los días",
    imagen: "../../apps/web/public/producto.webp",
    categoria: "Nueva colección",
    precio: "S/ 39.90",
  }),
);

const tema = fs.readFileSync(path.join(raiz, "packages/ui/src/theme.css"), "utf8");
const base = fs
  .readFileSync(path.join(raiz, "apps/web/src/app/globals.css"), "utf8")
  .replace(/^@import .+;\r?\n/m, "");
const estilos = fs.readFileSync(path.join(respaldo, "escaparate-portada.css"), "utf8");

const html = `<!doctype html>
<html lang="es-PE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vista móvil del primer estilo temporal</title>
  <style>${tema}\n${base}\n${estilos}</style>
</head>
<body>${portada}</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "movil.html"), html, "utf8");

const marco = `<!doctype html>
<html lang="es-PE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Primer estilo temporal — vista móvil</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #e3e3e6; font: 14px system-ui, sans-serif; }
    main { width: min(100%, 422px); padding: 16px; box-sizing: border-box; }
    p { margin: 0 0 10px; color: #52525b; }
    iframe { display: block; width: 390px; max-width: 100%; height: min(844px, 85vh); border: 1px solid #d4d4d8; border-radius: 16px; background: white; }
  </style>
</head>
<body>
  <main>
    <p>Primer respaldo · vista móvil de 390 px</p>
    <iframe src="movil.html" title="Portada temporal en tamaño móvil"></iframe>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "index.html"), marco, "utf8");
process.stdout.write(`${path.join(__dirname, "index.html")}\n`);
