/**
 * Atributos del catalogo: tipos de prenda (con sus tallas), colores, diseños
 * y etiquetas. Son las listas que el editor de productos ofrece elegir.
 *
 * No se borran ni se renombran: la variante y el producto guardan el nombre
 * como texto y el SKU lleva el codigo. Lo que ya no se usa se oculta, y deja
 * de ofrecerse al crear sin tocar lo ya creado. Por eso casi ninguna
 * escritura de aqui regenera la tienda: solo mover un tipo de categoria.
 */

import { TRPCError } from "@trpc/server";

import { detallesDeSpecs, mismoNombre, siguienteCodigoColor } from "@appweb/core";
import { esquemaAtributo, esquemaOrdenAtributos, esquemaTipoPrenda } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const gestionar = exige("gestionar_productos");

/** Que regenerar en la tienda tras guardar un tipo: solo si movio productos. */
interface RevalidarTipo {
  productos: { slug: string; slugCategoria: string }[];
  catalogo: boolean;
}

const SIN_CAMBIOS_EN_TIENDA: RevalidarTipo = { productos: [], catalogo: false };

function traducirError(error: unknown, que: string): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const campos = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
    if (campos.includes("codigo")) rechazar(`Ya hay ${que} con ese código.`, "CONFLICT");
    rechazar(`Ya hay ${que} con ese nombre.`, "CONFLICT");
  }
  throw error;
}

/** Cuantas veces aparece cada texto, sin importar mayusculas ni tildes. */
function contarUsos(valores: { valor: string | null; cantidad: number }[]) {
  return (nombre: string) =>
    valores
      .filter((v) => v.valor !== null && mismoNombre(v.valor, nombre))
      .reduce((suma, v) => suma + v.cantidad, 0);
}

export const atributos = router({
  /** Todo junto: son listas cortas y las cuatro secciones las comparten. */
  listar: gestionar.query(async ({ ctx }) => {
    const [tipos, valores, productos, colores, disenos, etiquetas, conDetalles, categorias] =
      await Promise.all([
        ctx.prisma.tipoPrenda.findMany({
          orderBy: [{ orden: "asc" }, { nombre: "asc" }],
          include: { categoria: { select: { nombre: true } } },
        }),
        ctx.prisma.atributo.findMany({
          orderBy: [{ orden: "asc" }, { codigo: "asc" }, { nombre: "asc" }],
        }),
        ctx.prisma.producto.findMany({
          where: { codigo: { not: null } },
          select: { codigo: true },
        }),
        ctx.prisma.variante.groupBy({ by: ["color"], _count: { _all: true } }),
        ctx.prisma.variante.groupBy({ by: ["diseno"], _count: { _all: true } }),
        ctx.prisma.producto.groupBy({ by: ["etiqueta"], _count: { _all: true } }),
        ctx.prisma.producto.findMany({
          where: { specs: { not: Prisma.DbNull } },
          select: { specs: true },
        }),
        // Las categorias que un tipo puede llenar: solo las de tipo.
        ctx.prisma.categoria.findMany({
          where: { publico: null },
          orderBy: [{ orden: "asc" }, { nombre: "asc" }],
          select: { id: true, nombre: true, activo: true },
        }),
      ]);

    // Los detalles viven en `specs`: cada producto cuenta una vez por valor.
    const detalles = conDetalles.map((p) => detallesDeSpecs(p.specs));
    const usosEn = (textos: (d: (typeof detalles)[number]) => string[]) => (nombre: string) =>
      detalles.filter((d) => textos(d).some((t) => mismoNombre(t, nombre))).length;

    const usosPorClase = {
      MATERIAL: usosEn((d) => d.materiales),
      AJUSTE: usosEn((d) => (d.ajuste ? [d.ajuste] : [])),
      CARACTERISTICA: usosEn((d) => d.caracteristicas),
      COLOR: contarUsos(colores.map((c) => ({ valor: c.color, cantidad: c._count._all }))),
      DISENO: contarUsos(disenos.map((d) => ({ valor: d.diseno, cantidad: d._count._all }))),
      ETIQUETA: contarUsos(etiquetas.map((e) => ({ valor: e.etiqueta, cantidad: e._count._all }))),
    };

    return {
      tipos: tipos.map((t) => ({
        id: t.id,
        codigo: t.codigo,
        nombre: t.nombre,
        tallas: t.tallas,
        palabras: t.palabras,
        categoriaId: t.categoriaId,
        categoria: t.categoria?.nombre ?? null,
        orden: t.orden,
        activo: t.activo,
        usos: productos.filter((p) => p.codigo?.startsWith(t.codigo)).length,
      })),
      categorias,
      valores: valores.map((a) => ({
        id: a.id,
        clase: a.clase,
        codigo: a.codigo,
        nombre: a.nombre,
        hex: a.hex,
        orden: a.orden,
        activo: a.activo,
        usos: usosPorClase[a.clase](a.nombre),
      })),
    };
  }),

  /**
   * El codigo de un tipo solo se fija al crearlo: es el prefijo de sus modelos.
   * Su categoria si cambia, y arrastra a sus productos: la categoria de un
   * producto es siempre la de su tipo. Solo ese cambio regenera la tienda.
   */
  guardarTipo: gestionar.input(esquemaTipoPrenda).mutation(async ({ ctx, input }) => {
    if (input.categoriaId !== null) {
      const categoria = await ctx.prisma.categoria.findUnique({
        where: { id: input.categoriaId },
        select: { publico: true },
      });
      if (categoria === null) rechazar("Esa categoría ya no existe.", "NOT_FOUND");
      if (categoria.publico !== null) {
        rechazar(
          "Elige una categoría de tipo, como Boxers. Hombre o Mujer se marcan en el producto.",
        );
      }
    }
    const datos = {
      nombre: input.nombre,
      tallas: input.tallas,
      palabras: input.palabras,
      categoriaId: input.categoriaId,
      orden: input.orden,
      activo: input.activo,
    };
    try {
      if (!input.tipoId) {
        const fila = await ctx.prisma.tipoPrenda.create({
          data: { ...datos, codigo: input.codigo },
        });
        return { id: fila.id, revalidar: SIN_CAMBIOS_EN_TIENDA };
      }

      const antes = await ctx.prisma.tipoPrenda.findUnique({
        where: { id: input.tipoId },
        select: { codigo: true, categoriaId: true },
      });
      if (antes === null) rechazar("Ese tipo de prenda ya no existe.", "NOT_FOUND");
      const fila = await ctx.prisma.tipoPrenda.update({ where: { id: input.tipoId }, data: datos });
      if (input.categoriaId === null || input.categoriaId === antes.categoriaId) {
        return { id: fila.id, revalidar: SIN_CAMBIOS_EN_TIENDA };
      }

      // Sus productos se mudan con el: la pagina vieja y la nueva se regeneran.
      const deEsteTipo = { codigo: { startsWith: antes.codigo } };
      const viejos = await ctx.prisma.producto.findMany({
        where: deEsteTipo,
        select: { slug: true, categoria: { select: { slug: true } } },
      });
      await ctx.prisma.producto.updateMany({
        where: deEsteTipo,
        data: { categoriaId: input.categoriaId },
      });
      const nueva = await ctx.prisma.categoria.findUniqueOrThrow({
        where: { id: input.categoriaId },
        select: { slug: true },
      });
      return {
        id: fila.id,
        revalidar: {
          productos: viejos.flatMap((p) => [
            { slug: p.slug, slugCategoria: p.categoria.slug },
            { slug: p.slug, slugCategoria: nueva.slug },
          ]),
          catalogo: viejos.length > 0,
        },
      };
    } catch (error) {
      traducirError(error, "un tipo de prenda");
    }
  }),

  /**
   * Color, diseño o etiqueta. Al editar solo cambian la visibilidad y, en los
   * colores, la muestra. Uno nuevo va al final de su lista; un color nuevo
   * toma el siguiente codigo libre de su familia.
   */
  guardar: gestionar.input(esquemaAtributo).mutation(async ({ ctx, input }) => {
    const que = {
      COLOR: "un color",
      DISENO: "un diseño",
      ETIQUETA: "una etiqueta",
      MATERIAL: "un material",
      AJUSTE: "un ajuste",
      CARACTERISTICA: "una característica",
    }[input.clase];
    const hex = input.clase === "COLOR" ? input.hex : undefined;
    try {
      if (input.atributoId) {
        const fila = await ctx.prisma.atributo.update({
          where: { id: input.atributoId },
          data: { activo: input.activo, ...(hex !== undefined ? { hex } : {}) },
        });
        return { id: fila.id, codigo: fila.codigo };
      }

      const mismos = await ctx.prisma.atributo.findMany({
        where: { clase: input.clase },
        select: { nombre: true, codigo: true, orden: true },
      });
      // "Azul Marino" y "azul marino" serian dos filas para la base, pero el mismo color.
      if (mismos.some((a) => mismoNombre(a.nombre, input.nombre))) {
        rechazar(`Ya hay ${que} con ese nombre.`, "CONFLICT");
      }

      let codigo: string | null = null;
      if (input.clase === "COLOR") {
        codigo = siguienteCodigoColor(
          input.familia ?? 0,
          mismos.flatMap((a) => (a.codigo ? [a.codigo] : [])),
        );
        if (codigo === null) rechazar("Esa familia ya tiene sus diez colores.", "CONFLICT");
      }

      const fila = await ctx.prisma.atributo.create({
        data: {
          clase: input.clase,
          nombre: input.nombre,
          codigo,
          hex: hex ?? null,
          orden: mismos.reduce((mayor, a) => Math.max(mayor, a.orden + 1), 0),
          activo: input.activo,
        },
      });
      return { id: fila.id, codigo };
    } catch (error) {
      traducirError(error, que);
    }
  }),

  /** El orden en que el editor ofrece los valores: el que quedo al arrastrar. */
  ordenar: gestionar.input(esquemaOrdenAtributos).mutation(async ({ ctx, input }) => {
    await ctx.prisma.$transaction(
      input.ids.map((id, orden) =>
        ctx.prisma.atributo.update({ where: { id, clase: input.clase }, data: { orden } }),
      ),
    );
    return { ok: true };
  }),
});
