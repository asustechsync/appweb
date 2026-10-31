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
  codigoDeDiseno,
  colorRegistrado,
  combinacionesDeVariantes,
  listoParaPublicar,
  MAX_DISENOS,
  mismoNombre,
  requisitosDePublicacion,
  siguienteCodigoProducto,
  skuDeVariante,
} from "@appweb/core";
import {
  esquemaCambioActivoVariante,
  esquemaCostoVariante,
  esquemaEdicionProducto,
  type esquemaProducto,
  esquemaProductoNuevo,
  esquemaVariantesNuevas,
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

/**
 * La etiqueta tiene que ser una de las visibles en Atributos. La que el
 * producto ya tenia se acepta aunque se haya ocultado: guardar otra cosa del
 * producto no obliga a cambiarla.
 */
async function exigirEtiqueta(
  prisma: Prisma.TransactionClient,
  etiqueta: string | undefined,
  anterior: string | null,
): Promise<void> {
  if (!etiqueta || (anterior !== null && mismoNombre(etiqueta, anterior))) return;
  const visibles = await prisma.atributo.findMany({
    where: { clase: "ETIQUETA", activo: true },
    select: { nombre: true },
  });
  if (!visibles.some((e) => mismoNombre(e.nombre, etiqueta))) {
    rechazar("Elige una etiqueta de la lista.");
  }
}

export const productos = router({
  /**
   * Lo que el formulario ofrece elegir: categorias y marcas, los tipos con
   * sus tallas y los colores, diseños y etiquetas visibles.
   */
  opciones: gestionar.query(async ({ ctx }) => {
    const [categorias, marcas, tipos, atributos] = await Promise.all([
      ctx.prisma.categoria.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
        select: { id: true, nombre: true, activo: true, padre: { select: { nombre: true } } },
      }),
      ctx.prisma.marca.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, activo: true },
      }),
      // Tambien los ocultos: un producto de un tipo oculto sigue ofreciendo sus tallas.
      ctx.prisma.tipoPrenda.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
        select: { codigo: true, nombre: true, palabras: true, tallas: true, activo: true },
      }),
      ctx.prisma.atributo.findMany({
        where: { activo: true },
        orderBy: [{ orden: "asc" }, { codigo: "asc" }, { nombre: "asc" }],
        select: { clase: true, codigo: true, nombre: true, hex: true },
      }),
    ]);
    const deClase = (clase: (typeof atributos)[number]["clase"]) =>
      atributos.filter((a) => a.clase === clase).map((a) => a.nombre);
    return {
      tipos,
      colores: atributos
        .filter((a) => a.clase === "COLOR")
        .map((a) => ({ nombre: a.nombre, hex: a.hex })),
      disenos: deClase("DISENO"),
      etiquetas: deClase("ETIQUETA"),
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
        imagenes: { take: 1, orderBy: { orden: "asc" }, select: { url: true } },
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
      imagen: p.imagenes[0]?.url ?? null,
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
            orderBy: [{ talla: "asc" }, { color: "asc" }, { disenoCodigo: "asc" }],
            select: {
              id: true,
              talla: true,
              color: true,
              diseno: true,
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
        codigo: p.codigo,
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

  /**
   * Alta. Nace oculta y con la imagen demo: se muestra cuando cumple los
   * requisitos de publicacion, que piden al menos una variante con stock.
   */
  crear: gestionar.input(esquemaProductoNuevo).mutation(async ({ ctx, input }) => {
    const tipo = await ctx.prisma.tipoPrenda.findUnique({ where: { codigo: input.tipo } });
    if (tipo === null || !tipo.activo) rechazar("Elige un tipo de prenda de la lista.");
    await exigirEtiqueta(ctx.prisma, input.datos.etiqueta, null);
    try {
      // Codigo de modelo: el siguiente del tipo elegido. Si dos altas chocan,
      // el indice unico rechaza la segunda.
      const usados = await ctx.prisma.producto.findMany({
        where: { codigo: { startsWith: input.tipo } },
        select: { codigo: true },
      });
      const producto = await ctx.prisma.producto.create({
        data: {
          ...datosDeProducto(input.datos),
          activo: false,
          codigo: siguienteCodigoProducto(
            input.tipo,
            usados.flatMap((u) => (u.codigo ? [u.codigo] : [])),
          ),
          imagenes: { create: { url: IMAGEN_DEMO, alt: input.datos.nombre, orden: 0 } },
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
      select: {
        slug: true,
        activo: true,
        categoria: { select: { slug: true } },
        variantes: { select: { activo: true, stock: true } },
        imagenes: { select: { url: true } },
        etiqueta: true,
      },
    });
    if (antes === null) rechazar("Ese producto no existe.", "NOT_FOUND");
    await exigirEtiqueta(ctx.prisma, input.datos.etiqueta, antes.etiqueta);

    // Solo se exige al pasar de oculto a visible: un producto que ya se vende
    // no queda bloqueado si mañana se agota.
    if (!antes.activo && input.datos.activo) {
      const requisitos = requisitosDePublicacion({
        precio: input.datos.precio,
        variantes: antes.variantes,
        fotosPropias: antes.imagenes.filter((i) => !esImagenDemo(i.url)).length,
        descripcionCorta: input.datos.descripcionCorta ?? "",
      });
      if (!listoParaPublicar(requisitos)) {
        const faltan = requisitos.filter((r) => r.obligatorio && !r.cumplido);
        rechazar(
          `Aún no se puede mostrar: ${faltan.map((r) => r.texto.toLowerCase()).join(" y ")}.`,
          "CONFLICT",
        );
      }
    }

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

  /**
   * Variantes en bloque: cada talla con cada color, en un mismo diseño. Las que
   * ya existen se saltan y se avisan. El stock inicial de cada una entra como
   * INGRESO, todo en la misma transaccion: o se crean todas o ninguna.
   */
  agregarVariantes: gestionar.input(esquemaVariantesNuevas).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.$transaction(async (tx) => {
        const producto = await tx.producto.findUnique({
          where: { id: input.productoId },
          select: {
            slug: true,
            codigo: true,
            categoria: { select: { slug: true } },
            variantes: {
              select: { talla: true, color: true, diseno: true, disenoCodigo: true },
            },
          },
        });
        if (producto === null) rechazar("Ese producto no existe.", "NOT_FOUND");
        if (producto.codigo === null) {
          rechazar("Este producto aún no tiene código de modelo. Regenera los SKU.", "CONFLICT");
        }
        const codigoProducto = producto.codigo;

        const atributos = await tx.atributo.findMany({
          where: { clase: { in: ["COLOR", "DISENO"] }, activo: true },
          select: { clase: true, codigo: true, nombre: true },
        });
        const colores = atributos.flatMap((a) =>
          a.clase === "COLOR" && a.codigo ? [{ codigo: a.codigo, nombre: a.nombre }] : [],
        );
        const diseno = atributos.find(
          (a) => a.clase === "DISENO" && mismoNombre(a.nombre, input.diseno),
        );
        if (diseno === undefined) rechazar("Elige un diseño de la lista.");

        const disenoCodigo = codigoDeDiseno(producto.variantes, diseno.nombre);
        if (disenoCodigo === null) {
          rechazar(`Un producto admite hasta ${MAX_DISENOS} diseños.`, "CONFLICT");
        }

        const { nuevas, yaExistian } = combinacionesDeVariantes(producto.variantes, {
          ...input,
          diseno: diseno.nombre,
        });
        if (nuevas.length === 0) {
          rechazar("Todas esas combinaciones ya existen en este producto.", "CONFLICT");
        }

        const creadas = await tx.variante.createManyAndReturn({
          data: nuevas.map((v) => {
            const color = colorRegistrado(v.color, colores);
            if (color === null) rechazar("Elige colores de la lista.", "BAD_REQUEST");
            return {
              productoId: input.productoId,
              talla: v.talla,
              // El nombre de la lista, no el que llego: "azul MARINO" -> "Azul marino".
              color: color.nombre,
              diseno: v.diseno,
              disenoCodigo,
              sku: skuDeVariante(codigoProducto, v.talla, color.codigo, disenoCodigo),
              costo: input.costo,
            };
          }),
          select: { id: true },
        });

        if (input.stockInicial > 0) {
          const movimientos = creadas.flatMap((variante) => {
            const plan = planMovimientoManual({
              tipo: "INGRESO",
              varianteId: variante.id,
              cantidad: input.stockInicial,
              stockActual: 0,
              nota: "Stock inicial",
            });
            return "movimiento" in plan ? [plan.movimiento] : [];
          });
          await aplicarMovimientos(tx, movimientos, ctx.sesion.usuarioId);
        }

        const revalidar: Revalidar = {
          productos: [{ slug: producto.slug, slugCategoria: producto.categoria.slug }],
          catalogo: false,
        };
        return { creadas: creadas.length, yaExistian, revalidar };
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
   * Costo de una variante a mano, sin compra ni cambio de stock. Solo mira
   * hacia adelante: las ventas ya hechas conservan el costo que congelaron.
   */
  fijarCosto: gestionar.input(esquemaCostoVariante).mutation(async ({ ctx, input }) => {
    await ctx.prisma.variante.update({
      where: { id: input.varianteId },
      data: { costo: input.costo },
    });
    return { ok: true };
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
