/**
 * Datos de arranque: las categorias raiz de la tienda.
 *
 *     npm run db:semilla
 *
 * Idempotente: usa `upsert` por slug, asi que correrlo varias veces no
 * duplica nada.
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: "../../.env.local" });

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

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

async function main() {
  for (const categoria of categorias) {
    const resultado = await prisma.categoria.upsert({
      where: { slug: categoria.slug },
      update: categoria,
      create: categoria,
    });
    console.log(`✔ ${resultado.nombre} (${resultado.slug})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
