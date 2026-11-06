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
  detallesDeSpecs,
  combinacionesDeVariantes,
  listoParaPublicar,
  MAX_DISENOS,
  mismoNombre,
  requisitosDePublicacion,
  siguienteCodigoProducto,
  skuDeVariante,
  tipoDeCodigo,
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
    etiqueta: datos.etiquetas[0] ?? null,
    etiquetasExtra: datos.etiquetas.slice(1),
    envioGratis: datos.envioGratis,
    tituloSeo: datos.tituloSeo || null,
    descripcionSeo: datos.descripcionSeo || null,
    nuevoHasta: datos.nuevoHasta ? new Date(`${datos.nuevoHasta}T00:00:00.000Z`) : null,
    destacado: datos.destacado,
    mostrarAgotado: datos.mostrarAgotado,
    permiteResenas: datos.permiteResenas,
    enPacks: datos.enPacks,
    enBuscador: datos.enBuscador,
    activo: datos.activo,
  };
}

/**
 * Los detalles de la prenda viajan dentro de `specs`, junto a lo que ya tuviera
 * (material y composicion en texto libre). Sin detalles en la peticion, `specs`
 * no se toca.
 */
function specsConDetalles(
  actual: Prisma.JsonValue | null,
  detalles: z.infer<typeof esquemaProducto>["detalles"],
): { specs?: Prisma.InputJsonValue } {
  if (detalles === undefined) return {};
  const base =
    typeof actual === "object" && actual !== null && !Array.isArray(actual) ? actual : {};
  return { specs: { ...base, detalles } as Prisma.InputJsonValue };
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
async function exigirEtiquetas(
  prisma: Prisma.TransactionClient,
  etiquetas: string[],
  anteriores: string[],
): Promise<void> {
  const nuevas = etiquetas.filter((e) => !anteriores.some((a) => mismoNombre(e, a)));
  if (nuevas.length === 0) return;
  const visibles = await prisma.atributo.findMany({
    where: { clase: "ETIQUETA", activo: true },
    select: { nombre: true },
  });
  if (nuevas.some((e) => !visibles.some((v) => mismoNombre(v.nombre, e)))) {
    rechazar("Elige etiquetas de la lista.");
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
      materiales: deClase("MATERIAL"),
      ajustes: deClase("AJUSTE"),
      caracteristicas: deClase("CARACTERISTICA"),
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
          etiquetas: [p.etiqueta, ...p.etiquetasExtra].filter((e): e is string => !!e),
          envioGratis: p.envioGratis,
          tituloSeo: p.tituloSeo ?? "",
          descripcionSeo: p.descripcionSeo ?? "",
          nuevoHasta: p.nuevoHasta === null ? "" : p.nuevoHasta.toISOString().slice(0, 10),
          destacado: p.destacado,
          mostrarAgotado: p.mostrarAgotado,
          permiteResenas: p.permiteResenas,
          enPacks: p.enPacks,
          enBuscador: p.enBuscador,
          activo: p.activo,
          detalles: detallesDeSpecs(p.specs),
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
    await exigirEtiquetas(ctx.prisma, input.datos.etiquetas, []);
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
          ...specsConDetalles(null, input.datos.detalles),
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
        etiquetasExtra: true,
        specs: true,
      },
    });
    if (antes === null) rechazar("Ese producto no existe.", "NOT_FOUND");
    await exigirEtiquetas(ctx.prisma, input.datos.etiquetas, [
      ...(antes.etiqueta ? [antes.etiqueta] : []),
      ...antes.etiquetasExtra,
    ]);

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
        data: {
          ...datosDeProducto(input.datos),
          ...specsConDetalles(antes.specs, input.datos.detalles),
        },
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
   * Copia un producto como borrador: mismos datos y variantes, pero oculto,
   * sin stock y con la imagen demo. Las fotos no se comparten: quitar una de la
   * copia borraria el archivo del original.
   */
  duplicar: gestionar
    .input(z.object({ productoId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const origen = await ctx.prisma.producto.findUnique({
        where: { id: input.productoId },
        select: {
          nombre: true,
          slug: true,
          codigo: true,
          descripcion: true,
          descripcionCorta: true,
          etiqueta: true,
          etiquetasExtra: true,
          envioGratis: true,
          nuevoHasta: true,
          mostrarAgotado: true,
          permiteResenas: true,
          enPacks: true,
          enBuscador: true,
          specs: true,
          categoriaId: true,
          marcaId: true,
          precio: true,
          precioLista: true,
          tituloSeo: true,
          descripcionSeo: true,
          variantes: {
            select: { talla: true, color: true, diseno: true, disenoCodigo: true, costo: true },
          },
        },
      });
      if (origen === null) rechazar("Ese producto no existe.", "NOT_FOUND");
      if (origen.codigo === null) {
        rechazar("Este producto aún no tiene código de modelo. Regenera los SKU.", "CONFLICT");
      }
      const tipo = tipoDeCodigo(origen.codigo);
      if (tipo === null) rechazar("No se pudo leer el tipo de prenda del código.", "CONFLICT");

      const [usados, parecidos, atributos] = await Promise.all([
        ctx.prisma.producto.findMany({
          where: { codigo: { startsWith: tipo } },
          select: { codigo: true },
        }),
        ctx.prisma.producto.findMany({
          where: { slug: { startsWith: `${origen.slug}-copia` } },
          select: { slug: true },
        }),
        ctx.prisma.atributo.findMany({
          where: { clase: "COLOR" },
          select: { nombre: true, codigo: true },
        }),
      ]);

      // El primer "-copia" libre: x-copia, x-copia-2, x-copia-3...
      const tomados = new Set(parecidos.map((p) => p.slug));
      let slug = `${origen.slug}-copia`;
      for (let n = 2; tomados.has(slug); n += 1) slug = `${origen.slug}-copia-${n}`;

      const codigo = siguienteCodigoProducto(
        tipo,
        usados.flatMap((u) => (u.codigo ? [u.codigo] : [])),
      );
      const codigoDeColor = new Map(
        atributos.flatMap((a) => (a.codigo ? [[a.nombre, a.codigo] as const] : [])),
      );
      const nombre = `${origen.nombre} (copia)`;

      try {
        const copia = await ctx.prisma.producto.create({
          data: {
            slug,
            codigo,
            nombre,
            descripcion: origen.descripcion,
            descripcionCorta: origen.descripcionCorta,
            etiqueta: origen.etiqueta,
            etiquetasExtra: origen.etiquetasExtra,
            envioGratis: origen.envioGratis,
            nuevoHasta: origen.nuevoHasta,
            mostrarAgotado: origen.mostrarAgotado,
            permiteResenas: origen.permiteResenas,
            enPacks: origen.enPacks,
            enBuscador: origen.enBuscador,
            ...(origen.specs === null ? {} : { specs: origen.specs as Prisma.InputJsonValue }),
            categoriaId: origen.categoriaId,
            marcaId: origen.marcaId,
            precio: origen.precio,
            precioLista: origen.precioLista,
            tituloSeo: origen.tituloSeo,
            descripcionSeo: origen.descripcionSeo,
            activo: false,
            destacado: false,
            imagenes: { create: { url: IMAGEN_DEMO, alt: nombre, orden: 0 } },
            variantes: {
              create: origen.variantes.flatMap((v) => {
                const color = codigoDeColor.get(v.color);
                // Un color que ya no existe en Atributos no se puede codificar en el SKU.
                if (color === undefined) return [];
                return [
                  {
                    talla: v.talla,
                    color: v.color,
                    diseno: v.diseno,
                    disenoCodigo: v.disenoCodigo,
                    sku: skuDeVariante(codigo, v.talla, color, v.disenoCodigo),
                    costo: v.costo,
                    stock: 0,
                  },
                ];
              }),
            },
          },
          select: { id: true, slug: true, categoria: { select: { slug: true } } },
        });
        const revalidar: Revalidar = {
          productos: [{ slug: copia.slug, slugCategoria: copia.categoria.slug }],
          catalogo: true,
        };
        return { id: copia.id, nombre, revalidar };
      } catch (error) {
        traducirError(error);
      }
    }),

  /**
   * Elimina un producto creado por error. Solo si nunca se vendio, compro ni
   * entro en un pack: con historial real se oculta, no se borra. Se van con el
   * sus variantes, sus movimientos de stock propios, sus reseñas y sus fotos.
   */
  eliminar: gestionar
    .input(z.object({ productoId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const producto = await ctx.prisma.producto.findUnique({
        where: { id: input.productoId },
        select: {
          slug: true,
          categoria: { select: { slug: true } },
          imagenes: { select: { url: true } },
          variantes: {
            select: {
              _count: { select: { itemsPedido: true, itemsCompra: true, itemsPack: true } },
            },
          },
        },
      });
      if (producto === null) rechazar("Ese producto no existe.", "NOT_FOUND");

      const conHistorial = producto.variantes.some(
        (v) => v._count.itemsPedido + v._count.itemsCompra + v._count.itemsPack > 0,
      );
      const movimientosDeVenta = await ctx.prisma.movimientoStock.count({
        where: {
          variante: { productoId: input.productoId },
          OR: [{ pedidoId: { not: null } }, { compraId: { not: null } }],
        },
      });
      if (conHistorial || movimientosDeVenta > 0) {
        rechazar(
          "Ese producto ya tiene ventas, compras o packs. Ocúltalo en vez de eliminarlo.",
          "CONFLICT",
        );
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.movimientoStock.deleteMany({
          where: { variante: { productoId: input.productoId } },
        });
        await tx.producto.delete({ where: { id: input.productoId } });
      });
      // Despues de la base: si el almacen falla queda un archivo huerfano, nunca
      // una ficha apuntando a un archivo borrado.
      for (const imagen of producto.imagenes) {
        if (esImagenDemo(imagen.url)) continue;
        await almacen.borrar(imagen.url).catch((error) => {
          console.error("No se pudo borrar la foto del almacén:", error);
        });
      }

      const revalidar: Revalidar = {
        productos: [{ slug: producto.slug, slugCategoria: producto.categoria.slug }],
        catalogo: true,
      };
      return { revalidar };
    }),

  /**
   * Variantes en bloque: cada talla con cada color, en un mismo diseño. Las que
   * ya existen se saltan y se avisan. El stock inicial de cada una entra como
   * INGRESO, todo en la misma transaccion: o se crean todas o ninguna.
   */
  agregarVariantes: gestionar.input(esquemaVariantesNuevas).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.$transaction(
        async (tx) => {
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
        },
        { timeout: 20_000 },
      );
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
   * Elimina una variante creada por error. Solo si nunca se vendio, compro ni
   * entro en un pack: con historial real se oculta, no se borra. Sus propios
   * movimientos (el stock inicial, ajustes a mano) se van con ella.
   */
  eliminarVariante: gestionar
    .input(z.object({ varianteId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const variante = await ctx.prisma.variante.findUnique({
        where: { id: input.varianteId },
        select: {
          producto: { select: { slug: true, categoria: { select: { slug: true } } } },
          _count: { select: { itemsPedido: true, itemsCompra: true, itemsPack: true } },
          movimientos: { select: { pedidoId: true, compraId: true }, take: 1000 },
        },
      });
      if (variante === null) rechazar("Esa variante no existe.", "NOT_FOUND");

      const { itemsPedido, itemsCompra, itemsPack } = variante._count;
      const conMovimientoDeVenta = variante.movimientos.some(
        (m) => m.pedidoId !== null || m.compraId !== null,
      );
      if (itemsPedido + itemsCompra + itemsPack > 0 || conMovimientoDeVenta) {
        rechazar(
          "Esa variante ya tiene ventas, compras o packs. Ocúltala en vez de eliminarla.",
          "CONFLICT",
        );
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.movimientoStock.deleteMany({ where: { varianteId: input.varianteId } });
        await tx.variante.delete({ where: { id: input.varianteId } });
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
