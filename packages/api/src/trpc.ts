/**
 * Base de tRPC: contexto y procedimientos con su nivel de acceso.
 *
 * Aqui se comprueba el rol, no en cada pantalla. Un procedimiento protegido
 * cubre la web, el panel y la app movil a la vez — esconder un boton en el
 * panel no es seguridad.
 */

import { initTRPC, TRPCError } from "@trpc/server";

import {
  puede,
  type Accion,
  type BannerDePortada,
  type FiltrosListado,
  type Rol,
} from "@appweb/core";
import { prisma } from "@appweb/db";

import {
  type CategoriaDeListado,
  type Facetas,
  leerBanners,
  leerBusqueda,
  leerCategoria,
  leerCategorias,
  leerFacetas,
  leerFicha,
  leerListado,
  leerMarca,
  leerNovedades,
  leerOfertas,
  leerPorSlugs,
  leerVarianteDeCarrito,
  type MarcaConProductos,
  type ProductoDeFicha,
  type ProductoDeRejilla,
  type VarianteDeCarrito,
} from "./catalogo";

export interface Sesion {
  usuarioId: string;
  rol: Rol;
  /** Viaja dentro del token para pintar "conectado como ..." sin consultar. */
  nombre: string;
}

/**
 * Lecturas del catalogo publico. La tienda web pasa las suyas, envueltas en
 * `use cache`; sin ellas se lee directo de la base (panel y pruebas).
 */
export interface LecturasCatalogo {
  novedades(limite: number): Promise<ProductoDeRejilla[]>;
  ofertas(limite: number): Promise<ProductoDeRejilla[]>;
  categorias(): Promise<{ slug: string; nombre: string }[]>;
  banners(): Promise<BannerDePortada[]>;
  ficha(slug: string): Promise<ProductoDeFicha | null>;
  variante(varianteId: string): Promise<VarianteDeCarrito | null>;
  categoria(slug: string): Promise<CategoriaDeListado | null>;
  facetas(slug: string): Promise<Facetas>;
  listado(slug: string, filtros: FiltrosListado): Promise<ProductoDeRejilla[]>;
  busqueda(terminos: string[]): Promise<ProductoDeRejilla[]>;
  marca(slug: string): Promise<MarcaConProductos | null>;
  porSlugs(slugs: string[]): Promise<ProductoDeRejilla[]>;
}

export interface Contexto {
  prisma: typeof prisma;
  sesion: Sesion | null;
  catalogo: LecturasCatalogo;
  /** IP de quien pregunta: la usan los limites de ingreso y registro. */
  ip: string;
}

const CATALOGO_DIRECTO: LecturasCatalogo = {
  novedades: leerNovedades,
  ofertas: leerOfertas,
  categorias: leerCategorias,
  banners: leerBanners,
  ficha: leerFicha,
  variante: leerVarianteDeCarrito,
  categoria: leerCategoria,
  facetas: leerFacetas,
  listado: leerListado,
  busqueda: leerBusqueda,
  marca: leerMarca,
  porSlugs: leerPorSlugs,
};

export function crearContexto(
  sesion: Sesion | null,
  catalogo: LecturasCatalogo = CATALOGO_DIRECTO,
  ip = "desconocida",
): Contexto {
  return { prisma, sesion, catalogo, ip };
}

const t = initTRPC.context<Contexto>().create({
  // Un error de validacion (zod) llegaria como el JSON crudo de todos los
  // problemas. Se deja solo el primer mensaje, ya escrito para la persona, y
  // los mensajes por campo aparte para quien quiera pintarlos junto al campo.
  errorFormatter({ shape, error }) {
    const causa = error.cause as
      | { issues?: { path: PropertyKey[]; message: string }[] }
      | undefined;
    if (
      error.code !== "BAD_REQUEST" ||
      !Array.isArray(causa?.issues) ||
      causa.issues.length === 0
    ) {
      return shape;
    }
    const campos: Record<string, string> = {};
    for (const problema of causa.issues) {
      campos[String(problema.path[0] ?? "")] ??= problema.message;
    }
    return {
      ...shape,
      message: causa.issues[0]?.message ?? "Revisa los datos e inténtalo de nuevo.",
      data: { ...shape.data, campos },
    };
  },
});

export const router = t.router;

/** Abierto: catalogo y cualquier lectura publica. */
export const publico = t.procedure;

/** Exige sesion iniciada. */
export const privado = t.procedure.use(({ ctx, next }) => {
  if (!ctx.sesion) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Inicia sesion" });
  }
  return next({ ctx: { ...ctx, sesion: ctx.sesion } });
});

/** Exige sesion y una accion concreta permitida para su rol. */
export function exige(accion: Accion) {
  return privado.use(({ ctx, next }) => {
    if (!puede(ctx.sesion.rol, accion)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso" });
    }
    return next({ ctx });
  });
}
