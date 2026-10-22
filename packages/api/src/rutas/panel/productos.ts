/**
 * Productos del panel: lista, alta, edicion y variantes.
 *
 * El stock de una variante NO se edita aqui: el stock inicial de una variante
 * nueva entra como un INGRESO, y el resto pasa por la seccion de stock. Asi
 * cada unidad tiene su movimiento (regla 5).
 *
 * Cada escritura devuelve que paginas de la tienda hay que regenerar; el panel
 * se lo pasa a la tienda, que es donde vive la cache.
 */

import { TRPCError } from "@trpc/server";

import {
  esImagenDemo,
  IMAGEN_DEMO,
  planMovimientoManual,
  skuDeVariante,
  varianteRepetida,
} from "@appweb/core";
import {
  esquemaCambioActivoVariante,
  esquemaEdicionProducto,
  esquemaProducto,
  esquemaVarianteNueva,
} from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";
import { z } from "zod";

import { almacen } from "../../almacen";
import { aplicarMovimientos, rechazar, type ProductoTocado } from "../../stock";
import { exige, router } from "../../trpc";

const gestionar = exige("gestionar_productos");

/** Hasta cuantos productos trae la lista; la busqueda filtra en el cliente. */
const TOPE_LISTA = 300;

/** Que regenerar en la tienda. `catalogo` cuando cambia que productos existen. */
export interface Revalidar {
  productos: ProductoTocado[];
  catalogo: boolean;
}

function datosDeProducto(datos: z.infer<typeof esquemaProducto>) {
  return {
    nombre: datos.nombre,
    slug: datos.slug,
    categoriaId: datos.categoriaId,
    marcaId: datos.marcaId ?? null,
    precio: datos.precio,
    precioLista: datos.precioLista ?? null,
    descripcionCorta: datos.descripcionCorta || null,
    descripcion: datos.descripcion || null,
    etiqueta: datos.etiqueta || null,
    envioGratis: datos.envioGratis,
    destacado: datos.destacado,
    activo: datos.activo,
  };
}

/** El slug es unico: el mensaje dice cual elegir en vez de un error de base. */
function traducirError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const campos = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
    if (campos.includes("sku")) rechazar("Ya existe una variante con ese SKU.", "CONFLICT");
    rechazar("Ya hay un producto con esa dirección web. Cambia el slug.", "CONFLICT");
  }
  throw error;
}

export const productos = router({
  /** Categorias y marcas para los selectores del formulario. */
  opciones: gestionar.query(async ({ ctx }) => {
    const [categorias, marcas] = await Promise.all([
      ctx.prisma.categoria.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
        select: { id: true, nombre: true, activo: true, padre: { select: { nombre: true } } },
      }),
      ctx.prisma.marca.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, activo: true },
      }),
    ]);
    return {
      categorias: categorias.map((c) => ({
        id: c.id,
        nombre: c.padre ? `${c.padre.nombre} › ${c.nombre}` : c.nombre,
        activo: c.activo,
      })),
      marcas,
    };
  }),

  listar: gestionar.query(async ({ ctx }) => {
    const filas = await ctx.prisma.producto.findMany({
      orderBy: { creadoEn: "desc" },
      take: TOPE_LISTA,
      select: {
        id: true,
        slug: true,
        nombre: true,
        precio: true,
        precioLista: true,
        activo: true,
        destacado: true,
        categoria: { select: { nombre: true } },
        marca: { select: { nombre: true } },
        variantes: { select: { stock: true, activo: true } },
      },
    });
    return filas.map((p) => ({
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      precio: Number(p.precio),
      precioLista: p.precioLista === null ? null : Number(p.precioLista),
      activo: p.activo,
      destacado: p.destacado,
      categoria: p.categoria.nombre,
      marca: p.marca?.nombre ?? null,
      variantes: p.variantes.filter((v) => v.activo).length,
      stockTotal: p.variantes.filter((v) => v.activo).reduce((suma, v) => suma + v.stock, 0),
    }));
  }),

  detalle: gestionar
    .input(z.object({ productoId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const p = await ctx.prisma.producto.findUnique({
        where: { id: input.productoId },
        include: {
          imagenes: { orderBy: { orden: "asc" }, select: { id: true, url: true, alt: true } },
          variantes: {
            orderBy: [{ talla: "asc" }, { color: "asc" }],
            select: {
              id: true,
              talla: true,
              color: true,
              sku: true,
              stock: true,
              costo: true,
              activo: true,
            },
          },
        },
      });
      if (p === null) rechazar("Ese producto no existe.", "NOT_FOUND");

      return {
        id: p.id,
        datos: {
          nombre: p.nombre,
          slug: p.slug,
          categoriaId: p.categoriaId,
          marcaId: p.marcaId,
          precio: Number(p.precio),
          precioLista: p.precioLista === null ? null : Number(p.precioLista),
          descripcionCorta: p.descripcionCorta ?? "",
          descripcion: p.descripcion ?? "",
          etiqueta: p.etiqueta ?? "",
          envioGratis: p.envioGratis,
          destacado: p.destacado,
          activo: p.activo,
        },
        // La de relleno no se lista: no es una foto que se pueda quitar ni ordenar.
        imagenes: p.imagenes.filter((i) => !esImagenDemo(i.url)),
        // El costo es el de la ultima compra (cache de ItemCompra): solo se lee.
        variantes: p.variantes.map((v) => ({
          ...v,
          costo: v.costo === null ? null : Number(v.costo),
        })),
      };
    }),

  /** Alta. Nace con la imagen demo hasta que existan las fotos propias. */
  crear: gestionar.input(esquemaProducto).mutation(async ({ ctx, input }) => {
    try {
      const producto = await ctx.prisma.producto.create({
        data: {
          ...datosDeProducto(input),
          imagenes: { create: { url: IMAGEN_DEMO, alt: input.nombre, orden: 0 } },
        },
        select: { id: true, slug: true, categoria: { select: { slug: true } } },
      });
      const revalidar: Revalidar = {
        productos: [{ slug: producto.slug, slugCategoria: producto.categoria.slug }],
        catalogo: true,
      };
      return { id: producto.id, revalidar };
    } catch (error) {
      traducirError(error);
    }
  }),

  editar: gestionar.input(esquemaEdicionProducto).mutation(async ({ ctx, input }) => {
    const antes = await ctx.prisma.producto.findUnique({
      where: { id: input.productoId },
      select: { slug: true, activo: true, categoria: { select: { slug: true } } },
    });
    if (antes === null) rechazar("Ese producto no existe.", "NOT_FOUND");

    try {
      const despues = await ctx.prisma.producto.update({
        where: { id: input.productoId },
        data: datosDeProducto(input.datos),
        select: { slug: true, activo: true, categoria: { select: { slug: true } } },
      });

      // Si cambio el slug o la categoria, la pagina vieja tambien se regenera
      // (para que deje de mostrarlo) ademas de la nueva.
      const tocados = new Map<string, ProductoTocado>();
      for (const p of [antes, despues]) {
        tocados.set(`${p.slug}|${p.categoria.slug}`, {
          slug: p.slug,
          slugCategoria: p.categoria.slug,
        });
      }
      const revalidar: Revalidar = {
        productos: [...tocados.values()],
        catalogo: antes.slug !== despues.slug || antes.activo !== despues.activo,
      };
      return { revalidar };
    } catch (error) {
      traducirError(error);
    }
  }),

  /** Variante nueva. El stock inicial entra como INGRESO, en la misma transaccion. */
  agregarVariante: gestionar.input(esquemaVarianteNueva).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.$transaction(async (tx) => {
        const producto = await tx.producto.findUnique({
          where: { id: input.productoId },
          select: {
            slug: true,
            categoria: { select: { slug: true } },
            variantes: { select: { talla: true, color: true } },
          },
        });
        if (producto === null) rechazar("Ese producto no existe.", "NOT_FOUND");
        if (varianteRepetida(producto.variantes, input)) {
          rechazar(`Ya existe la talla ${input.talla} en color ${input.color}.`, "CONFLICT");
        }

        const variante = await tx.variante.create({
          data: {
            productoId: input.productoId,
            talla: input.talla,
            color: input.color,
            sku: skuDeVariante(producto.slug, input.talla, input.color),
          },
          select: { id: true },
        });

        if (input.stockInicial > 0) {
          const plan = planMovimientoManual({
            tipo: "INGRESO",
            varianteId: variante.id,
            cantidad: input.stockInicial,
            stockActual: 0,
            nota: "Stock inicial",
          });
          if ("movimiento" in plan) {
            await aplicarMovimientos(tx, [plan.movimiento], ctx.sesion.usuarioId);
          }
        }

        const revalidar: Revalidar = {
          productos: [{ slug: producto.slug, slugCategoria: producto.categoria.slug }],
          catalogo: false,
        };
        return { revalidar };
      });
    } catch (error) {
      traducirError(error);
    }
  }),

  /** Ocultar una variante deja de ofrecerla; su historial y sus ventas quedan. */
  cambiarActivoVariante: gestionar
    .input(esquemaCambioActivoVariante)
    .mutation(async ({ ctx, input }) => {
      const variante = await ctx.prisma.variante.update({
        where: { id: input.varianteId },
        data: { activo: input.activo },
        select: { producto: { select: { slug: true, categoria: { select: { slug: true } } } } },
      });
      const revalidar: Revalidar = {
        productos: [
          { slug: variante.producto.slug, slugCategoria: variante.producto.categoria.slug },
        ],
        catalogo: false,
      };
      return { revalidar };
    }),
  /**
   * Quita una foto del producto y la borra del almacen. Si era la ultima, el
   * producto vuelve a la imagen de relleno: la ficha nunca queda sin imagen.
   */
  quitarImagen: gestionar
    .input(z.object({ imagenId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const imagen = await ctx.prisma.imagenProducto.findUnique({
        where: { id: input.imagenId },
        select: {
          id: true,
          url: true,
          producto: {
            select: { id: true, slug: true, nombre: true, categoria: { select: { slug: true } } },
          },
        },
      });
      if (imagen === null) rechazar("Esa foto no existe.", "NOT_FOUND");

      const { producto } = imagen;
      await ctx.prisma.$transaction(async (tx) => {
        await tx.imagenProducto.delete({ where: { id: imagen.id } });
        const quedan = await tx.imagenProducto.count({ where: { productoId: producto.id } });
        if (quedan === 0) {
          await tx.imagenProducto.create({
            data: { productoId: producto.id, url: IMAGEN_DEMO, alt: producto.nombre, orden: 0 },
          });
        }
      });
      // Despues de la base: si el almacen falla, queda un archivo huerfano,
      // nunca una foto en la ficha que apunta a un archivo borrado.
      await almacen.borrar(imagen.url).catch((error) => {
        console.error("No se pudo borrar la foto del almacén:", error);
      });

      const revalidar: Revalidar = {
        productos: [{ slug: producto.slug, slugCategoria: producto.categoria.slug }],
        catalogo: false,
      };
      return { revalidar };
    }),

  /** Pone una foto primero: es la que sale en la tarjeta del catalogo. */
  imagenPrincipal: gestionar
    .input(z.object({ imagenId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const imagen = await ctx.prisma.imagenProducto.findUnique({
        where: { id: input.imagenId },
        select: {
          id: true,
          producto: {
            select: {
              id: true,
              slug: true,
              categoria: { select: { slug: true } },
              imagenes: { orderBy: { orden: "asc" }, select: { id: true } },
            },
          },
        },
      });
      if (imagen === null) rechazar("Esa foto no existe.", "NOT_FOUND");

      const { producto } = imagen;
      const orden = [
        imagen.id,
        ...producto.imagenes.map((i) => i.id).filter((id) => id !== imagen.id),
      ];
      await ctx.prisma.$transaction(
        orden.map((id, posicion) =>
          ctx.prisma.imagenProducto.update({ where: { id }, data: { orden: posicion } }),
        ),
      );

      const revalidar: Revalidar = {
        productos: [{ slug: producto.slug, slugCategoria: producto.categoria.slug }],
        catalogo: false,
      };
      return { revalidar };
    }),
});
