import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { exige, router } from "../../trpc";

const ajustar = exige("gestionar_ajustes");
const slugCategoria = "hombres";

const esquemaContenido = z.object({
  etiqueta: z.string().trim().min(1).max(60),
  titulo: z.string().trim().min(1).max(120),
  texto: z.string().trim().min(1).max(240),
  imagen: z.string().trim().max(500).refine(
    (valor) => valor === "" || (valor.startsWith("/") && !valor.startsWith("//")) || valor.startsWith("https://"),
    "Usa una ruta local o una URL segura que empiece con https://",
  ),
  href: z.string().trim().regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/, "Usa una ruta interna que empiece con /"),
});

export const coleccionPortada = router({
  contenido: ajustar.query(async ({ ctx }) => {
    const categoria = await ctx.prisma.categoria.findUnique({
      where: { slug: slugCategoria },
      select: {
        portadaEtiqueta: true,
        portadaTitulo: true,
        portadaTexto: true,
        portadaImagen: true,
        portadaHref: true,
      },
    });

    if (!categoria) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró la colección de portada." });

    return {
      etiqueta: categoria.portadaEtiqueta ?? "Colección destacada",
      titulo: categoria.portadaTitulo ?? "Comodidad con personalidad",
      texto: categoria.portadaTexto ?? "Básicos cómodos para acompañarte todos los días.",
      imagen: categoria.portadaImagen ?? "/producto.webp",
      href: categoria.portadaHref ?? "/categorias/hombres",
    };
  }),

  guardar: ajustar.input(esquemaContenido).mutation(async ({ ctx, input }) => {
    const categoria = await ctx.prisma.categoria.update({
      where: { slug: slugCategoria },
      data: {
        portadaEtiqueta: input.etiqueta,
        portadaTitulo: input.titulo,
        portadaTexto: input.texto,
        portadaImagen: input.imagen,
        portadaHref: input.href,
      },
      select: { nombre: true },
    });

    return { categoria: categoria.nombre };
  }),
});
