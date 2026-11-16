/**
 * Datos de demostracion: 5 productos por publico (Hombre, Mujer, Niños,
 * Bebés), cada uno con 3 variantes de 50 unidades.
 *
 *     npm run demo-catalogo -w @appweb/db
 *
 * Usa las tres fotos de `apps/web/public/demo/`. La marca es del producto
 * (no de la variante), asi que cada producto lleva una marca distinta y sus
 * variantes cambian de color y talla. El stock entra por un movimiento
 * INGRESO (regla 5), nunca solo con la columna. Idempotente: salta los
 * productos cuyo slug ya existe.
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { COLORES, colorRegistrado, siguienteCodigoProducto, skuDeVariante } from "@appweb/core";
import { cadenaConexion } from "../src/conexion";

config({ path: "../../.env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: cadenaConexion() }),
});

type Publico = "HOMBRE" | "MUJER" | "NINOS" | "BEBES";
type Tipo = "BX" | "MD";

const FOTOS = {
  boxer: "/demo/boxer.webp",
  blanca: "/demo/media-blanca.webp",
  gris: "/demo/media-gris.webp",
} as const;

const STOCK = 50;

type Tres = [string, string, string];

interface Demo {
  nombre: string;
  tipo: Tipo;
  publico: Publico;
  marca: string;
  foto: keyof typeof FOTOS;
  precio: number;
  precioLista?: number;
  descripcionCorta: string;
  tallas: Tres;
  colores: Tres;
}

const ADULTO_BX: Tres = ["M", "L", "XL"];
const MUJER_BX: Tres = ["S", "M", "L"];
const ADULTO_MD: Tres = ["35-40", "40-45", "Única"];
const NINO_BX: Tres = ["6", "8", "10"];
const NINO_MD: Tres = ["28-32", "33-36", "Única"];
const BEBE: Tres = ["0-3 meses", "3-6 meses", "6-12 meses"];

const demos: Demo[] = [
  // ═══ HOMBRE ═══
  {
    nombre: "Boxer Geométrico Cintura Negra",
    tipo: "BX",
    publico: "HOMBRE",
    marca: "Fila",
    foto: "boxer",
    precio: 29.9,
    precioLista: 39.9,
    descripcionCorta: "Estampado geométrico, cintura ancha.",
    tallas: ADULTO_BX,
    colores: ["Negro", "Gris oscuro", "Verde oliva"],
  },
  {
    nombre: "Boxer Microfibra Sport",
    tipo: "BX",
    publico: "HOMBRE",
    marca: "Pesail",
    foto: "boxer",
    precio: 24.9,
    descripcionCorta: "Microfibra ligera que no marca.",
    tallas: ADULTO_BX,
    colores: ["Azul marino", "Negro", "Rojo"],
  },
  {
    nombre: "Medias Tobilleras Running",
    tipo: "MD",
    publico: "HOMBRE",
    marca: "Boston",
    foto: "blanca",
    precio: 14.9,
    descripcionCorta: "Tobilleras con refuerzo en talón y punta.",
    tallas: ADULTO_MD,
    colores: ["Blanco", "Gris", "Negro"],
  },
  {
    nombre: "Medias Antideslizantes Fútbol",
    tipo: "MD",
    publico: "HOMBRE",
    marca: "Americano",
    foto: "gris",
    precio: 19.9,
    precioLista: 24.9,
    descripcionCorta: "Suela con agarre antideslizante.",
    tallas: ADULTO_MD,
    colores: ["Gris", "Negro", "Azul"],
  },
  {
    nombre: "Medias Deportivas Acolchadas",
    tipo: "MD",
    publico: "HOMBRE",
    marca: "Qiling",
    foto: "blanca",
    precio: 16.9,
    descripcionCorta: "Planta acolchada para entrenar.",
    tallas: ADULTO_MD,
    colores: ["Blanco", "Gris claro", "Naranja"],
  },
  // ═══ MUJER ═══
  {
    nombre: "Boxer Geométrico Cintura Ancha",
    tipo: "BX",
    publico: "MUJER",
    marca: "Unno",
    foto: "boxer",
    precio: 27.9,
    descripcionCorta: "Boxer suave de corte cómodo.",
    tallas: MUJER_BX,
    colores: ["Negro", "Vino", "Gris"],
  },
  {
    nombre: "Boxer Microfibra Sin Costuras",
    tipo: "BX",
    publico: "MUJER",
    marca: "Amanecer",
    foto: "boxer",
    precio: 22.9,
    precioLista: 29.9,
    descripcionCorta: "Sin costuras laterales.",
    tallas: MUJER_BX,
    colores: ["Rosa palo", "Negro", "Celeste"],
  },
  {
    nombre: "Medias Tobilleras Algodón",
    tipo: "MD",
    publico: "MUJER",
    marca: "Ciervo Dorado",
    foto: "blanca",
    precio: 12.9,
    descripcionCorta: "Algodón suave, puño elástico.",
    tallas: ADULTO_MD,
    colores: ["Blanco", "Rosa", "Lila"],
  },
  {
    nombre: "Medias Antideslizantes Yoga",
    tipo: "MD",
    publico: "MUJER",
    marca: "X&Y",
    foto: "gris",
    precio: 18.9,
    descripcionCorta: "Agarre para yoga y pilates.",
    tallas: ADULTO_MD,
    colores: ["Gris", "Nude", "Turquesa"],
  },
  {
    nombre: "Medias Running Acolchadas",
    tipo: "MD",
    publico: "MUJER",
    marca: "Fila",
    foto: "blanca",
    precio: 15.9,
    precioLista: 19.9,
    descripcionCorta: "Ligeras y transpirables.",
    tallas: ADULTO_MD,
    colores: ["Blanco", "Coral", "Gris claro"],
  },
  // ═══ NIÑOS ═══
  {
    nombre: "Boxer Geométrico",
    tipo: "BX",
    publico: "NINOS",
    marca: "Boston",
    foto: "boxer",
    precio: 19.9,
    descripcionCorta: "Cómodo y resistente al lavado.",
    tallas: NINO_BX,
    colores: ["Negro", "Azul", "Verde"],
  },
  {
    nombre: "Boxer Microfibra Escolar",
    tipo: "BX",
    publico: "NINOS",
    marca: "Pesail",
    foto: "boxer",
    precio: 17.9,
    precioLista: 22.9,
    descripcionCorta: "Ideal para el uso diario del colegio.",
    tallas: NINO_BX,
    colores: ["Azul marino", "Gris", "Rojo"],
  },
  {
    nombre: "Medias Tobilleras Colegio",
    tipo: "MD",
    publico: "NINOS",
    marca: "Amanecer",
    foto: "blanca",
    precio: 9.9,
    descripcionCorta: "Tobilleras de algodón para el día a día.",
    tallas: NINO_MD,
    colores: ["Blanco", "Gris", "Celeste"],
  },
  {
    nombre: "Medias Antideslizantes Fútbol",
    tipo: "MD",
    publico: "NINOS",
    marca: "Americano",
    foto: "gris",
    precio: 14.9,
    descripcionCorta: "Suela antideslizante para jugar.",
    tallas: NINO_MD,
    colores: ["Gris", "Negro", "Naranja"],
  },
  {
    nombre: "Medias Deportivas Acolchadas",
    tipo: "MD",
    publico: "NINOS",
    marca: "Qiling",
    foto: "blanca",
    precio: 11.9,
    precioLista: 14.9,
    descripcionCorta: "Acolchadas en la planta.",
    tallas: NINO_MD,
    colores: ["Blanco", "Azul", "Amarillo"],
  },
  // ═══ BEBÉS ═══
  {
    nombre: "Boxer Suave",
    tipo: "BX",
    publico: "BEBES",
    marca: "Ciervo Dorado",
    foto: "boxer",
    precio: 15.9,
    descripcionCorta: "Algodón suave, cintura sin apretar.",
    tallas: BEBE,
    colores: ["Gris", "Celeste", "Menta"],
  },
  {
    nombre: "Medias Tobilleras Suaves",
    tipo: "MD",
    publico: "BEBES",
    marca: "Unno",
    foto: "blanca",
    precio: 7.9,
    descripcionCorta: "Puño suave que no deja marca.",
    tallas: BEBE,
    colores: ["Blanco", "Rosa palo", "Celeste"],
  },
  {
    nombre: "Medias Antideslizantes Gateo",
    tipo: "MD",
    publico: "BEBES",
    marca: "Amanecer",
    foto: "gris",
    precio: 9.9,
    precioLista: 12.9,
    descripcionCorta: "Suela con agarre para gatear y caminar.",
    tallas: BEBE,
    colores: ["Gris", "Beige", "Lila"],
  },
  {
    nombre: "Medias Algodón Orgánico",
    tipo: "MD",
    publico: "BEBES",
    marca: "X&Y",
    foto: "blanca",
    precio: 8.9,
    descripcionCorta: "Hipoalergénicas, para piel delicada.",
    tallas: BEBE,
    colores: ["Blanco", "Amarillo", "Menta"],
  },
  {
    nombre: "Medias Térmicas",
    tipo: "MD",
    publico: "BEBES",
    marca: "Boston",
    foto: "gris",
    precio: 10.9,
    descripcionCorta: "Abrigan sin acalorar.",
    tallas: BEBE,
    colores: ["Gris", "Azul", "Coral"],
  },
];

const ETIQUETA_PUBLICO: Record<Publico, string> = {
  HOMBRE: "hombre",
  MUJER: "mujer",
  NINOS: "ninos",
  BEBES: "bebe",
};

function slugDe(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const usados = (
    await prisma.producto.findMany({ where: { codigo: { not: null } }, select: { codigo: true } })
  ).flatMap((p) => (p.codigo ? [p.codigo] : []));

  const tipos = await prisma.tipoPrenda.findMany({ select: { codigo: true, categoriaId: true } });
  const categoriaDe = new Map(tipos.map((t) => [t.codigo, t.categoriaId]));

  let nuevos = 0;
  for (const d of demos) {
    const slug = `${slugDe(d.nombre)}-${ETIQUETA_PUBLICO[d.publico]}`;
    if (await prisma.producto.findUnique({ where: { slug }, select: { id: true } })) {
      console.log(`  · ya existe: ${slug}`);
      continue;
    }

    const categoriaId = categoriaDe.get(d.tipo);
    if (!categoriaId) throw new Error(`El tipo ${d.tipo} no tiene categoria asignada.`);

    const marca = await prisma.marca.upsert({
      where: { nombre: d.marca },
      update: {},
      create: { nombre: d.marca, slug: slugDe(d.marca) },
    });

    const codigo = siguienteCodigoProducto(d.tipo, usados);
    usados.push(codigo);

    const nombre = d.nombre;
    const producto = await prisma.producto.create({
      data: {
        slug,
        codigo,
        nombre,
        descripcion: `${nombre}. ${d.descripcionCorta}`,
        descripcionCorta: d.descripcionCorta,
        publicos: [d.publico],
        categoriaId,
        marcaId: marca.id,
        precio: d.precio,
        precioLista: d.precioLista ?? null,
        activo: true,
        imagenes: { create: [{ url: FOTOS[d.foto], alt: nombre, orden: 0 }] },
      },
    });

    for (let i = 0; i < 3; i += 1) {
      const talla = d.tallas[i] as string;
      const color = colorRegistrado(d.colores[i] as string, COLORES);
      if (color === null) throw new Error(`Color sin codigo: ${d.colores[i]}`);

      const variante = await prisma.variante.create({
        data: {
          productoId: producto.id,
          talla,
          color: color.nombre,
          stock: STOCK,
          sku: skuDeVariante(codigo, talla, color.codigo, 1),
        },
      });
      await prisma.movimientoStock.create({
        data: {
          varianteId: variante.id,
          delta: STOCK,
          motivo: "INGRESO",
          nota: "Datos de demostracion",
        },
      });
    }

    nuevos += 1;
    console.log(`  ✔ ${codigo} ${nombre} (${d.marca}, ${d.publico}) — 3 variantes x ${STOCK}`);
  }
  console.log(`\n${nuevos} productos nuevos.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
