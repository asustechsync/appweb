import { z } from "zod";

import { exige, router } from "../../trpc";

const ajustar = exige("gestionar_ajustes");

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

/** El banner que edita el panel: el primero activo segun `orden`. */
const primerBanner = {
  where: { activo: true },
  orderBy: [{ orden: "asc" as const }, { creadoEn: "asc" as const }],
};

export const coleccionPortada = router({
  contenido: ajustar.query(async ({ ctx }) => {
    const banner = await ctx.prisma.banner.findFirst({
      ...primerBanner,
      select: { etiqueta: true, titulo: true, texto: true, imagenUrl: true, href: true },
    });

    return {
      etiqueta: banner?.etiqueta ?? "Colección destacada",
      titulo: banner?.titulo ?? "Comodidad con personalidad",
      texto: banner?.texto ?? "Básicos cómodos para acompañarte todos los días.",
      imagen: banner?.imagenUrl ?? "/producto.webp",
      href: banner?.href ?? "/categorias/hombres",
    };
  }),

  guardar: ajustar.input(esquemaContenido).mutation(async ({ ctx, input }) => {
    const datos = {
      etiqueta: input.etiqueta,
      titulo: input.titulo,
      texto: input.texto,
      imagenUrl: input.imagen,
      href: input.href,
    };

    // Si todavia no hay banner, el primer guardado lo crea.
    const existente = await ctx.prisma.banner.findFirst({ ...primerBanner, select: { id: true } });
    if (existente) {
      await ctx.prisma.banner.update({ where: { id: existente.id }, data: datos });
    } else {
      await ctx.prisma.banner.create({ data: datos });
    }

    return { titulo: input.titulo };
  }),
});
