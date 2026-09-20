/**
 * Datos de arranque: categorias raiz y sus primeros productos.
 *
 *     npm run db:semilla
 *
 * Idempotente: categorias y productos usan `upsert` por slug; las variantes
 * e imagenes de cada producto se borran y se vuelven a crear en cada corrida,
 * asi que correrlo varias veces no duplica nada.
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

// ── Categorias raiz ──────────────────────────────────────────────────────

const categorias = [
  {
    slug: "hombres",
    nombre: "Hombres",
    descripcion: "Boxers, medias y basicos para hombre.",
    imagenUrl: "https://picsum.photos/seed/cat-hombres/800/600",
    destacada: true,
    tituloSeo: "Ropa básica para hombre | Tienda",
    descripcionSeo: "Boxers, medias y polos básicos para hombre. Envío a todo el Perú.",
    orden: 1,
  },
  {
    slug: "mujeres",
    nombre: "Mujeres",
    descripcion: "Calzones, medias y basicos para mujer.",
    imagenUrl: "https://picsum.photos/seed/cat-mujeres/800/600",
    destacada: true,
    tituloSeo: "Ropa básica para mujer | Tienda",
    descripcionSeo: "Calzones, medias y polos básicos para mujer. Envío a todo el Perú.",
    orden: 2,
  },
  {
    slug: "jovenes",
    nombre: "Jóvenes",
    descripcion: "Basicos pensados para adolescentes.",
    imagenUrl: "https://picsum.photos/seed/cat-jovenes/800/600",
    destacada: true,
    tituloSeo: "Ropa básica para jóvenes | Tienda",
    descripcionSeo: "Básicos para adolescentes: polos, medias y ropa interior.",
    orden: 3,
  },
  {
    slug: "ninos",
    nombre: "Niños",
    descripcion: "Basicos comodos y resistentes para niños.",
    imagenUrl: "https://picsum.photos/seed/cat-ninos/800/600",
    destacada: true,
    tituloSeo: "Ropa básica para niños | Tienda",
    descripcionSeo: "Ropa básica infantil: cómoda, resistente y a buen precio.",
    orden: 4,
  },
  {
    slug: "bebes",
    nombre: "Bebés",
    descripcion: "Basicos suaves para los mas pequeños.",
    imagenUrl: "https://picsum.photos/seed/cat-bebes/800/600",
    destacada: true,
    tituloSeo: "Ropa básica para bebés | Tienda",
    descripcionSeo: "Ropa básica para bebé: algodón suave, hipoalergénico.",
    orden: 5,
  },
];

// ── Productos: 6 por categoria (2 polos, 2 medias, 2 boxer/calzon) ───────
//
// Tallas ajustadas a cada edad: adulto (S-XL), niño (por numero), bebe (por
// meses). Un producto de cada par sale con precioLista > precio (oferta).

interface VarianteSeed {
  talla: string;
  color: string;
  stock: number;
}

interface ProductoSeed {
  slug: string;
  nombre: string;
  descripcion: string;
  descripcionCorta: string;
  etiqueta: string;
  destacada: boolean;
  tituloSeo: string;
  descripcionSeo: string;
  marca: string;
  categoriaSlug: string;
  precio: number;
  precioLista?: number;
  variantes: VarianteSeed[];
}

const productos: ProductoSeed[] = [
  // ═══ HOMBRES ═══════════════════════════════════════════════════════════
  {
    slug: "polo-basico-algodon-pima-hombre",
    nombre: "Polo Básico Algodón Pima Hombre",
    descripcion:
      "Polo de algodón pima peruano, cuello redondo y corte recto. Suave al tacto y resistente al lavado diario.",
    descripcionCorta: "Algodón pima 100%, corte recto.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Polo Básico Algodón Pima Hombre | Tienda",
    descripcionSeo: "Polo básico de algodón pima para hombre. Cuello redondo, corte recto.",
    marca: "Fila",
    categoriaSlug: "hombres",
    precio: 39.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 20 },
      { talla: "M", color: "Negro", stock: 25 },
      { talla: "L", color: "Blanco", stock: 15 },
      { talla: "XL", color: "Blanco", stock: 8 },
    ],
  },
  {
    slug: "polo-deportivo-dry-fit-hombre",
    nombre: "Polo Deportivo Dry-Fit Hombre",
    descripcion:
      "Polo deportivo con tecnología dry-fit que absorbe la humedad. Ideal para entrenar o el uso diario en climas calurosos.",
    descripcionCorta: "Tela dry-fit, transpirable.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Polo Deportivo Dry-Fit Hombre | Tienda",
    descripcionSeo: "Polo deportivo dry-fit para hombre. Transpirable, ideal para entrenar.",
    marca: "Amanecer",
    categoriaSlug: "hombres",
    precio: 45.9,
    variantes: [
      { talla: "S", color: "Azul marino", stock: 12 },
      { talla: "M", color: "Azul marino", stock: 18 },
      { talla: "L", color: "Gris", stock: 10 },
      { talla: "XL", color: "Gris", stock: 5 },
    ],
  },
  {
    slug: "medias-de-algodon-pack-x3-hombre",
    nombre: "Medias de Algodón Pack x3 Hombre",
    descripcion:
      "Pack de 3 pares de medias de algodón con refuerzo en talón y punta. Talla única, elástico suave que no marca.",
    descripcionCorta: "Pack x3, talla única.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Medias Algodón Pack x3 Hombre | Tienda",
    descripcionSeo: "Pack de 3 medias de algodón para hombre. Refuerzo en talón y punta.",
    marca: "Boston",
    categoriaSlug: "hombres",
    precio: 24.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 40 },
      { talla: "Única", color: "Blanco", stock: 30 },
      { talla: "Única", color: "Gris", stock: 20 },
    ],
  },
  {
    slug: "medias-deportivas-hombre",
    nombre: "Medias Deportivas Antideslizantes",
    descripcion:
      "Medias deportivas con banda antideslizante en la planta y compresión media en el arco. Pensadas para entrenar.",
    descripcionCorta: "Antideslizantes, compresión media.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Medias Deportivas Antideslizantes Hombre | Tienda",
    descripcionSeo: "Medias deportivas antideslizantes para hombre. Compresión media.",
    marca: "San Shan",
    categoriaSlug: "hombres",
    precio: 19.9,
    precioLista: 27.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 25 },
      { talla: "Única", color: "Blanco", stock: 20 },
    ],
  },
  {
    slug: "boxer-algodon-pack3-hombre",
    nombre: "Boxer Algodón Básico Pack x3",
    descripcion:
      "Pack de 3 boxers de algodón con pretina elástica ancha que no se enrolla. Corte cómodo para uso diario.",
    descripcionCorta: "Pack x3, pretina elástica ancha.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Boxer Algodón Básico Pack x3 Hombre | Tienda",
    descripcionSeo: "Pack de 3 boxers de algodón para hombre. Pretina elástica ancha.",
    marca: "Qiling",
    categoriaSlug: "hombres",
    precio: 34.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 15 },
      { talla: "M", color: "Negro", stock: 22 },
      { talla: "L", color: "Azul marino", stock: 10 },
      { talla: "XL", color: "Azul marino", stock: 4 },
    ],
  },
  {
    slug: "boxer-microfibra-hombre",
    nombre: "Boxer Microfibra Sin Costuras",
    descripcion:
      "Boxer de microfibra sin costuras laterales, invisible bajo la ropa ajustada. Secado rápido.",
    descripcionCorta: "Microfibra, sin costuras.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Boxer Microfibra Sin Costuras Hombre | Tienda",
    descripcionSeo: "Boxer de microfibra sin costuras para hombre. Secado rápido.",
    marca: "Amanecer",
    categoriaSlug: "hombres",
    precio: 29.9,
    precioLista: 39.9,
    variantes: [
      { talla: "S", color: "Gris", stock: 8 },
      { talla: "M", color: "Gris", stock: 14 },
      { talla: "L", color: "Negro", stock: 9 },
    ],
  },

  // ═══ MUJERES ═══════════════════════════════════════════════════════════
  {
    slug: "polo-basico-algodon-mujer",
    nombre: "Polo Básico Algodón Mujer",
    descripcion:
      "Polo de algodón con corte entallado y cuello redondo. Tela suave que no pierde forma con el lavado.",
    descripcionCorta: "Algodón suave, corte entallado.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Polo Básico Algodón Mujer | Tienda",
    descripcionSeo: "Polo básico de algodón para mujer. Corte entallado, cuello redondo.",
    marca: "Fila",
    categoriaSlug: "mujeres",
    precio: 34.9,
    variantes: [
      { talla: "S", color: "Blanco", stock: 18 },
      { talla: "M", color: "Blanco", stock: 22 },
      { talla: "L", color: "Negro", stock: 12 },
      { talla: "M", color: "Rosa palo", stock: 16 },
    ],
  },
  {
    slug: "polo-oversize-algodon-mujer",
    nombre: "Polo Oversize Algodón Mujer",
    descripcion:
      "Polo de corte oversize en algodón grueso. Hombro caído y largo midi, ideal para combinar de varias formas.",
    descripcionCorta: "Corte oversize, algodón grueso.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Polo Oversize Algodón Mujer | Tienda",
    descripcionSeo: "Polo oversize de algodón para mujer. Hombro caído, largo midi.",
    marca: "Boston",
    categoriaSlug: "mujeres",
    precio: 42.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 10 },
      { talla: "M", color: "Negro", stock: 14 },
      { talla: "L", color: "Beige", stock: 7 },
    ],
  },
  {
    slug: "medias-invisibles-pack3-mujer",
    nombre: "Medias Invisibles Pack x3",
    descripcion:
      "Pack de 3 medias invisibles con silicona antideslizante en el talón. No se ven al usar zapatillas o flats.",
    descripcionCorta: "Pack x3, invisibles.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Medias Invisibles Pack x3 Mujer | Tienda",
    descripcionSeo: "Pack de 3 medias invisibles para mujer. Silicona antideslizante.",
    marca: "Qiling",
    categoriaSlug: "mujeres",
    precio: 22.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 35 },
      { talla: "Única", color: "Beige", stock: 25 },
      { talla: "Única", color: "Blanco", stock: 20 },
    ],
  },
  {
    slug: "medias-termicas-de-invierno-mujer",
    nombre: "Medias Térmicas de Invierno Mujer",
    descripcion:
      "Medias térmicas con forro polar interior. Abrigan sin perder elasticidad, ideales para climas fríos.",
    descripcionCorta: "Forro polar interior.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Medias Térmicas de Invierno Mujer | Tienda",
    descripcionSeo: "Medias térmicas para mujer con forro polar interior.",
    marca: "San Shan",
    categoriaSlug: "mujeres",
    precio: 18.9,
    precioLista: 23.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 20 },
      { talla: "Única", color: "Gris", stock: 15 },
    ],
  },
  {
    slug: "calzon-algodon-pack5-mujer",
    nombre: "Calzón Algodón Clásico Pack x5",
    descripcion:
      "Pack de 5 calzones de algodón corte clásico, pretina suave que no aprieta. Transpirables para uso diario.",
    descripcionCorta: "Pack x5, corte clásico.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Calzón Algodón Clásico Pack x5 Mujer | Tienda",
    descripcionSeo: "Pack de 5 calzones de algodón para mujer. Corte clásico, transpirables.",
    marca: "Amanecer",
    categoriaSlug: "mujeres",
    precio: 29.9,
    variantes: [
      { talla: "S", color: "Blanco", stock: 20 },
      { talla: "M", color: "Blanco", stock: 24 },
      { talla: "L", color: "Negro", stock: 14 },
      { talla: "S", color: "Rosa palo", stock: 10 },
    ],
  },
  {
    slug: "calzon-microfibra-mujer",
    nombre: "Calzón Microfibra Invisible",
    descripcion:
      "Calzón de microfibra sin costuras, corte bikini. Invisible bajo prendas ajustadas.",
    descripcionCorta: "Microfibra, corte bikini.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Calzón Microfibra Invisible Mujer | Tienda",
    descripcionSeo: "Calzón de microfibra invisible para mujer. Corte bikini, sin costuras.",
    marca: "Fila",
    categoriaSlug: "mujeres",
    precio: 24.9,
    precioLista: 32.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 12 },
      { talla: "M", color: "Negro", stock: 16 },
      { talla: "L", color: "Beige", stock: 6 },
    ],
  },

  // ═══ JÓVENES ═══════════════════════════════════════════════════════════
  {
    slug: "polo-basico-unisex-joven-casual",
    nombre: "Polo Básico Unisex Joven Casual",
    descripcion:
      "Polo unisex de algodón, corte recto pensado para adolescentes. Resistente a lavados frecuentes.",
    descripcionCorta: "Unisex, algodón resistente.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Polo Básico Unisex Joven Casual | Tienda",
    descripcionSeo: "Polo básico unisex para jóvenes. Algodón resistente, corte recto.",
    marca: "Boston",
    categoriaSlug: "jovenes",
    precio: 29.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 20 },
      { talla: "M", color: "Negro", stock: 18 },
      { talla: "L", color: "Blanco", stock: 10 },
    ],
  },
  {
    slug: "polo-estampado-juvenil-casual",
    nombre: "Polo Estampado Juvenil Casual",
    descripcion:
      "Polo con estampado frontal, corte regular en algodón suave. Diseño pensado para el uso diario juvenil.",
    descripcionCorta: "Estampado frontal, corte regular.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Polo Estampado Juvenil Casual | Tienda",
    descripcionSeo: "Polo estampado para jóvenes. Corte regular, algodón suave.",
    marca: "San Shan",
    categoriaSlug: "jovenes",
    precio: 32.9,
    variantes: [
      { talla: "S", color: "Blanco", stock: 14 },
      { talla: "M", color: "Celeste", stock: 12 },
      { talla: "L", color: "Celeste", stock: 8 },
    ],
  },
  {
    slug: "medias-basicas-joven",
    nombre: "Medias Básicas Pack x3 Joven",
    descripcion:
      "Pack de 3 medias de algodón elástico, talla única. Resistentes para el uso escolar diario.",
    descripcionCorta: "Pack x3, uso diario.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Medias Básicas Pack x3 Joven | Tienda",
    descripcionSeo: "Pack de 3 medias básicas para jóvenes. Algodón elástico.",
    marca: "Qiling",
    categoriaSlug: "jovenes",
    precio: 17.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 30 },
      { talla: "Única", color: "Blanco", stock: 25 },
    ],
  },
  {
    slug: "medias-deportivas-running-joven",
    nombre: "Medias Deportivas Running Joven",
    descripcion:
      "Medias deportivas acolchadas en la planta, ideales para educación física y deporte.",
    descripcionCorta: "Acolchadas, uso deportivo.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Medias Deportivas Running Joven | Tienda",
    descripcionSeo: "Medias deportivas acolchadas para jóvenes.",
    marca: "Amanecer",
    categoriaSlug: "jovenes",
    precio: 14.9,
    precioLista: 19.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 18 },
      { talla: "Única", color: "Gris", stock: 14 },
    ],
  },
  {
    slug: "boxer-basico-joven",
    nombre: "Boxer Algodón Joven Pack x3",
    descripcion:
      "Pack de 3 boxers de algodón con pretina suave, corte cómodo pensado para adolescentes.",
    descripcionCorta: "Pack x3, pretina suave.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Boxer Algodón Joven Pack x3 | Tienda",
    descripcionSeo: "Pack de 3 boxers de algodón para jóvenes. Pretina suave.",
    marca: "Fila",
    categoriaSlug: "jovenes",
    precio: 24.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 16 },
      { talla: "M", color: "Negro", stock: 20 },
      { talla: "L", color: "Azul marino", stock: 10 },
    ],
  },
  {
    slug: "boxer-estampado-divertido-joven",
    nombre: "Boxer Estampado Divertido Joven",
    descripcion:
      "Boxer de algodón con estampado, pretina elástica ancha. Diseño divertido para el día a día.",
    descripcionCorta: "Estampado, algodón suave.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Boxer Estampado Divertido Joven | Tienda",
    descripcionSeo: "Boxer estampado de algodón para jóvenes.",
    marca: "Boston",
    categoriaSlug: "jovenes",
    precio: 19.9,
    precioLista: 26.9,
    variantes: [
      { talla: "S", color: "Gris", stock: 9 },
      { talla: "M", color: "Gris", stock: 11 },
    ],
  },

  // ═══ NIÑOS ═════════════════════════════════════════════════════════════
  {
    slug: "polo-basico-algodon-para-nino",
    nombre: "Polo Básico Algodón para Niño",
    descripcion:
      "Polo de algodón suave, corte holgado pensado para el movimiento de los niños. Resistente a lavados frecuentes.",
    descripcionCorta: "Algodón suave, corte holgado.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Polo Básico Algodón para Niño | Tienda",
    descripcionSeo: "Polo básico de algodón para niño. Corte holgado, resistente.",
    marca: "San Shan",
    categoriaSlug: "ninos",
    precio: 22.9,
    variantes: [
      { talla: "6", color: "Blanco", stock: 15 },
      { talla: "8", color: "Blanco", stock: 18 },
      { talla: "10", color: "Azul marino", stock: 10 },
    ],
  },
  {
    slug: "polo-estampado-divertido-nino",
    nombre: "Polo Estampado Divertido Niño",
    descripcion:
      "Polo con estampado divertido, algodón suave que no irrita la piel. Ideal para el colegio o el juego.",
    descripcionCorta: "Estampado divertido, algodón suave.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Polo Estampado Divertido Niño | Tienda",
    descripcionSeo: "Polo estampado para niño. Algodón suave, no irrita la piel.",
    marca: "Qiling",
    categoriaSlug: "ninos",
    precio: 25.9,
    variantes: [
      { talla: "6", color: "Celeste", stock: 10 },
      { talla: "8", color: "Celeste", stock: 12 },
      { talla: "10", color: "Gris", stock: 6 },
    ],
  },
  {
    slug: "medias-basicas-nino",
    nombre: "Medias Básicas Pack x3 Niño",
    descripcion:
      "Pack de 3 medias de algodón, talla única. Resistentes para el uso escolar y el juego diario.",
    descripcionCorta: "Pack x3, uso escolar.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Medias Básicas Pack x3 Niño | Tienda",
    descripcionSeo: "Pack de 3 medias básicas para niño. Uso escolar diario.",
    marca: "Amanecer",
    categoriaSlug: "ninos",
    precio: 13.9,
    variantes: [
      { talla: "Única", color: "Blanco", stock: 30 },
      { talla: "Única", color: "Gris", stock: 20 },
    ],
  },
  {
    slug: "medias-deportivas-running-nino",
    nombre: "Medias Deportivas Running Niño",
    descripcion:
      "Medias deportivas con refuerzo en talón y punta, ideales para educación física.",
    descripcionCorta: "Refuerzo talón y punta.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Medias Deportivas Running Niño | Tienda",
    descripcionSeo: "Medias deportivas para niño con refuerzo en talón y punta.",
    marca: "Fila",
    categoriaSlug: "ninos",
    precio: 11.9,
    precioLista: 15.9,
    variantes: [
      { talla: "Única", color: "Blanco", stock: 18 },
      { talla: "Única", color: "Negro", stock: 14 },
    ],
  },
  {
    slug: "boxer-basico-nino",
    nombre: "Boxer Algodón Niño Pack x3",
    descripcion:
      "Pack de 3 boxers de algodón suave, pretina que no aprieta. Corte cómodo para el día a día.",
    descripcionCorta: "Pack x3, pretina suave.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Boxer Algodón Niño Pack x3 | Tienda",
    descripcionSeo: "Pack de 3 boxers de algodón para niño. Pretina suave.",
    marca: "Boston",
    categoriaSlug: "ninos",
    precio: 17.9,
    variantes: [
      { talla: "6", color: "Azul marino", stock: 14 },
      { talla: "8", color: "Azul marino", stock: 16 },
      { talla: "10", color: "Gris", stock: 8 },
    ],
  },
  {
    slug: "boxer-estampado-divertido-nino",
    nombre: "Boxer Estampado Divertido Niño",
    descripcion:
      "Boxer de algodón con estampado, pretina elástica suave. Diseño divertido pensado para niños.",
    descripcionCorta: "Estampado, pretina suave.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Boxer Estampado Divertido Niño | Tienda",
    descripcionSeo: "Boxer estampado de algodón para niño.",
    marca: "San Shan",
    categoriaSlug: "ninos",
    precio: 14.9,
    precioLista: 19.9,
    variantes: [
      { talla: "6", color: "Celeste", stock: 9 },
      { talla: "8", color: "Celeste", stock: 11 },
    ],
  },

  // ═══ BEBÉS ═════════════════════════════════════════════════════════════
  {
    slug: "body-manga-corta-de-algodon-bebe",
    nombre: "Body Manga Corta de Algodón Bebé",
    descripcion:
      "Body de algodón con broches en la entrepierna para facilitar el cambio de pañal. Suave e hipoalergénico.",
    descripcionCorta: "Broches en entrepierna, hipoalergénico.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Body Manga Corta de Algodón Bebé | Tienda",
    descripcionSeo: "Body de algodón para bebé. Broches en entrepierna, hipoalergénico.",
    marca: "Qiling",
    categoriaSlug: "bebes",
    precio: 19.9,
    variantes: [
      { talla: "3M", color: "Blanco", stock: 20 },
      { talla: "6M", color: "Blanco", stock: 18 },
      { talla: "12M", color: "Celeste", stock: 10 },
    ],
  },
  {
    slug: "polo-basico-de-algodon-bebe",
    nombre: "Polo Básico de Algodón Bebé",
    descripcion:
      "Polo de algodón suave para bebé, cuello ancho para facilitar el vestido. Costuras planas que no irritan.",
    descripcionCorta: "Cuello ancho, costuras planas.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Polo Básico de Algodón Bebé | Tienda",
    descripcionSeo: "Polo básico de algodón para bebé. Cuello ancho, costuras planas.",
    marca: "Amanecer",
    categoriaSlug: "bebes",
    precio: 17.9,
    variantes: [
      { talla: "3M", color: "Rosa palo", stock: 10 },
      { talla: "6M", color: "Celeste", stock: 12 },
    ],
  },
  {
    slug: "medias-suaves-pack3-bebe",
    nombre: "Medias Suaves Pack x3 Bebé",
    descripcion:
      "Pack de 3 medias de algodón extra suave, elástico delicado que no marca la piel del bebé.",
    descripcionCorta: "Pack x3, algodón extra suave.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Medias Suaves Pack x3 Bebé | Tienda",
    descripcionSeo: "Pack de 3 medias suaves para bebé. Algodón extra suave.",
    marca: "Fila",
    categoriaSlug: "bebes",
    precio: 12.9,
    variantes: [
      { talla: "Única", color: "Blanco", stock: 30 },
      { talla: "Única", color: "Celeste", stock: 20 },
    ],
  },
  {
    slug: "medias-antideslizantes-bebe",
    nombre: "Medias Antideslizantes Bebé",
    descripcion:
      "Medias con puntos antideslizantes en la planta, ideales para cuando el bebé empieza a gatear o caminar.",
    descripcionCorta: "Puntos antideslizantes.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Medias Antideslizantes Bebé | Tienda",
    descripcionSeo: "Medias antideslizantes para bebé. Ideales para gatear o caminar.",
    marca: "Boston",
    categoriaSlug: "bebes",
    precio: 10.9,
    precioLista: 14.9,
    variantes: [
      { talla: "Única", color: "Blanco", stock: 15 },
      { talla: "Única", color: "Rosa palo", stock: 12 },
    ],
  },
  {
    slug: "calzon-algodon-pack3-bebe",
    nombre: "Calzón de Algodón Bebé Pack x3",
    descripcion:
      "Pack de 3 calzones de algodón suave para bebé, pretina delicada que no marca. Ideales para debajo del pañal de tela.",
    descripcionCorta: "Pack x3, pretina delicada.",
    etiqueta: "Más vendido",
    destacada: true,
    tituloSeo: "Calzón de Algodón Bebé Pack x3 | Tienda",
    descripcionSeo: "Pack de 3 calzones de algodón para bebé. Pretina delicada.",
    marca: "San Shan",
    categoriaSlug: "bebes",
    precio: 15.9,
    variantes: [
      { talla: "3M", color: "Blanco", stock: 16 },
      { talla: "6M", color: "Blanco", stock: 14 },
      { talla: "12M", color: "Celeste", stock: 8 },
    ],
  },
  {
    slug: "body-broches-estampado-bebe",
    nombre: "Body con Broches Estampado",
    descripcion:
      "Body de algodón estampado con broches laterales y en entrepierna. Facil de poner y quitar.",
    descripcionCorta: "Broches laterales, estampado.",
    etiqueta: "Oferta",
    destacada: false,
    tituloSeo: "Body con Broches Estampado Bebé | Tienda",
    descripcionSeo: "Body estampado con broches para bebé. Fácil de poner y quitar.",
    marca: "Qiling",
    categoriaSlug: "bebes",
    precio: 13.9,
    precioLista: 17.9,
    variantes: [
      { talla: "3M", color: "Celeste", stock: 9 },
      { talla: "6M", color: "Rosa palo", stock: 7 },
    ],
  },

  // ═══ NUEVAS MARCAS ═════════════════════════════════════════════════════════
  {
    slug: "polo-premium-algodon-pesail-hombre",
    nombre: "Polo Premium Algodón Pesail",
    descripcion: "Polo premium de algodón de alta calidad. Diseño exclusivo Pesail.",
    descripcionCorta: "Algodón premium, diseño Pesail.",
    etiqueta: "Nuevo",
    destacada: true,
    tituloSeo: "Polo Premium Algodón Pesail | Tienda",
    descripcionSeo: "Polo premium Pesail de algodón. Calidad superior.",
    marca: "Pesail",
    categoriaSlug: "hombres",
    precio: 49.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 10 },
      { talla: "M", color: "Negro", stock: 12 },
      { talla: "L", color: "Blanco", stock: 8 },
    ],
  },
  {
    slug: "medias-premium-xy-mujer",
    nombre: "Medias Premium X&Y Mujer",
    descripcion: "Medias premium con tecnología microtech X&Y. Máxima comodidad.",
    descripcionCorta: "Tecnología microtech X&Y.",
    etiqueta: "Nuevo",
    destacada: true,
    tituloSeo: "Medias Premium X&Y Mujer | Tienda",
    descripcionSeo: "Medias premium X&Y para mujer. Tecnología microtech.",
    marca: "X&Y",
    categoriaSlug: "mujeres",
    precio: 25.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 18 },
      { talla: "Única", color: "Beige", stock: 15 },
    ],
  },
  {
    slug: "calzon-americano-premium-mujer",
    nombre: "Calzón Americano Premium",
    descripcion: "Calzón premium corte americano con tela de alta densidad.",
    descripcionCorta: "Corte americano, alta densidad.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Calzón Americano Premium Mujer | Tienda",
    descripcionSeo: "Calzón americano premium para mujer.",
    marca: "Americano",
    categoriaSlug: "mujeres",
    precio: 28.9,
    variantes: [
      { talla: "S", color: "Negro", stock: 14 },
      { talla: "M", color: "Negro", stock: 16 },
      { talla: "L", color: "Blanco", stock: 10 },
    ],
  },
  {
    slug: "boxer-unno-premium-hombre",
    nombre: "Boxer Unno Premium Hombre",
    descripcion: "Boxer premium Unno con tecnología de microfibra avanzada.",
    descripcionCorta: "Microfibra avanzada, corte premium.",
    etiqueta: "Nuevo",
    destacada: true,
    tituloSeo: "Boxer Unno Premium Hombre | Tienda",
    descripcionSeo: "Boxer premium Unno para hombre. Microfibra avanzada.",
    marca: "Unno",
    categoriaSlug: "hombres",
    precio: 35.9,
    variantes: [
      { talla: "S", color: "Gris", stock: 12 },
      { talla: "M", color: "Gris", stock: 14 },
      { talla: "L", color: "Negro", stock: 10 },
    ],
  },
  {
    slug: "medias-sport-galufei-joven",
    nombre: "Medias Sport Galufei Joven",
    descripcion: "Medias deportivas Galufei con compresión y ventilación.",
    descripcionCorta: "Sport, compresión y ventilación.",
    etiqueta: "Nuevo",
    destacada: false,
    tituloSeo: "Medias Sport Galufei Joven | Tienda",
    descripcionSeo: "Medias sport Galufei para jóvenes. Compresión y ventilación.",
    marca: "Galufei",
    categoriaSlug: "jovenes",
    precio: 21.9,
    variantes: [
      { talla: "Única", color: "Negro", stock: 20 },
      { talla: "Única", color: "Gris", stock: 16 },
    ],
  },
];

// ── Ejecucion ─────────────────────────────────────────────────────────────

function skuDe(slugProducto: string, variante: VarianteSeed): string {
  const talla = variante.talla.replace(/\s+/g, "").toUpperCase();
  const color = variante.color.replace(/\s+/g, "-").toUpperCase();
  return `${slugProducto}-${talla}-${color}`.toUpperCase();
}

async function crearCategorias() {
  for (const categoria of categorias) {
    const resultado = await prisma.categoria.upsert({
      where: { slug: categoria.slug },
      update: categoria,
      create: categoria,
    });
    console.log(`✔ categoria: ${resultado.nombre} (${resultado.slug})`);
  }
}

async function crearProductos() {
  for (const p of productos) {
    const categoria = await prisma.categoria.findUniqueOrThrow({
      where: { slug: p.categoriaSlug },
    });

    const { variantes, categoriaSlug, ...datosProducto } = p;

    const producto = await prisma.producto.upsert({
      where: { slug: p.slug },
      update: { ...datosProducto, categoriaId: categoria.id },
      create: { ...datosProducto, categoriaId: categoria.id },
    });

    // Idempotente: se borran variantes e imagenes del producto y se recrean,
    // asi correr el seed otra vez no choca con el @@unique([productoId, talla, color]).
    await prisma.variante.deleteMany({ where: { productoId: producto.id } });
    await prisma.imagenProducto.deleteMany({ where: { productoId: producto.id } });

    await prisma.variante.createMany({
      data: variantes.map((v) => ({
        productoId: producto.id,
        talla: v.talla,
        color: v.color,
        stock: v.stock,
        sku: skuDe(p.slug, v),
      })),
    });

    await prisma.imagenProducto.createMany({
      data: [
        { productoId: producto.id, url: `/producto.webp`, alt: p.nombre, orden: 0 },
        { productoId: producto.id, url: `/producto.webp`, alt: p.nombre, orden: 1 },
      ],
    });

    const oferta = p.precioLista ? ` (oferta desde S/ ${p.precioLista})` : "";
    console.log(`  ✔ ${producto.nombre} — S/ ${p.precio}${oferta} — ${variantes.length} variantes`);
  }
}

// ── Metodos de envio ─────────────────────────────────────────────────────

/**
 * Tarifas del carrito y el checkout. `gratisDesde` en S/ 99 para Lima y Callao
 * es la misma promesa que anuncian el hero y /envios: si cambia una, cambian
 * las tres.
 */
const metodosEnvio = [
  { nombre: "Lima y Callao", costo: 12, gratisDesde: 99, orden: 1 },
  { nombre: "Provincias (agencia)", costo: 22, gratisDesde: null, orden: 2 },
  { nombre: "Recojo en tienda", costo: 0, gratisDesde: null, orden: 3 },
];

async function crearMetodosEnvio() {
  console.log("Metodos de envio:");

  // MetodoEnvio no tiene una columna unica de negocio (el id es cuid), asi que
  // la idempotencia se consigue buscando por nombre antes de crear.
  for (const metodo of metodosEnvio) {
    const existente = await prisma.metodoEnvio.findFirst({
      where: { nombre: metodo.nombre },
      select: { id: true },
    });

    if (existente) {
      await prisma.metodoEnvio.update({ where: { id: existente.id }, data: metodo });
    } else {
      await prisma.metodoEnvio.create({ data: metodo });
    }

    const gratis = metodo.gratisDesde ? ` — gratis desde S/ ${metodo.gratisDesde}` : "";
    console.log(`  ✔ ${metodo.nombre} — S/ ${metodo.costo}${gratis}`);
  }
}

async function main() {
  await crearCategorias();
  console.log("");
  await crearProductos();
  console.log("");
  await crearMetodosEnvio();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
