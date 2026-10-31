/**
 * Carga los tipos de prenda y los atributos (colores, diseños, etiquetas) en
 * sus tablas: los valores iniciales del nucleo y, ademas, los diseños y
 * etiquetas que el catalogo ya usa, para que el panel los ofrezca al editar.
 *
 * Idempotente: lo que ya existe no se toca (ni su orden ni si esta oculto).
 * La usan la semilla y `npm run atributos -w @appweb/db`.
 */
import type { PrismaClient } from "@prisma/client";
import { COLORES, DISENOS, ETIQUETAS_PRODUCTO, TIPOS_PRENDA } from "@appweb/core";

type Clase = "COLOR" | "DISENO" | "ETIQUETA";

export async function sembrarAtributos(prisma: PrismaClient): Promise<void> {
  let tiposNuevos = 0;
  for (const [orden, tipo] of TIPOS_PRENDA.entries()) {
    const existe = await prisma.tipoPrenda.findUnique({ where: { codigo: tipo.codigo } });
    if (existe) continue;
    await prisma.tipoPrenda.create({
      data: {
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        palabras: [...tipo.palabras],
        tallas: [...tipo.tallas],
        orden,
      },
    });
    tiposNuevos++;
  }

  const [disenosUsados, etiquetasUsadas] = await Promise.all([
    prisma.variante.findMany({ distinct: ["diseno"], select: { diseno: true } }),
    prisma.producto.findMany({
      where: { etiqueta: { not: null } },
      distinct: ["etiqueta"],
      select: { etiqueta: true },
    }),
  ]);

  const valores: { clase: Clase; nombre: string; codigo?: string; hex?: string }[] = [
    ...COLORES.map((c) => ({
      clase: "COLOR" as const,
      nombre: c.nombre,
      codigo: c.codigo,
      ...("hex" in c ? { hex: c.hex } : {}),
    })),
    ...[...DISENOS, ...disenosUsados.map((v) => v.diseno)].map((nombre) => ({
      clase: "DISENO" as const,
      nombre,
    })),
    ...[
      ...ETIQUETAS_PRODUCTO,
      ...etiquetasUsadas.flatMap((p) => (p.etiqueta ? [p.etiqueta] : [])),
    ].map((nombre) => ({ clase: "ETIQUETA" as const, nombre })),
  ];

  const existentes = await prisma.atributo.findMany({ select: { clase: true, nombre: true } });
  const vistos = new Set(existentes.map((a) => `${a.clase}|${a.nombre.trim().toLowerCase()}`));
  const nuevos = valores.filter((v) => {
    const llave = `${v.clase}|${v.nombre.trim().toLowerCase()}`;
    if (v.nombre.trim() === "" || vistos.has(llave)) return false;
    vistos.add(llave);
    return true;
  });
  // El orden sigue el de las listas: Negro antes que Blanco, Liso primero.
  const ordenDe = new Map<Clase, number>();
  await prisma.atributo.createMany({
    data: nuevos.map((v) => {
      const orden = ordenDe.get(v.clase) ?? 0;
      ordenDe.set(v.clase, orden + 1);
      return {
        clase: v.clase,
        nombre: v.nombre.trim(),
        codigo: v.codigo ?? null,
        hex: v.hex ?? null,
        orden,
      };
    }),
    skipDuplicates: true,
  });

  // Muestra de los colores iniciales que aun no la tienen (anteriores a la columna).
  let muestras = 0;
  for (const color of COLORES) {
    if (!("hex" in color)) continue;
    const { count } = await prisma.atributo.updateMany({
      where: { clase: "COLOR", codigo: color.codigo, hex: null },
      data: { hex: color.hex },
    });
    muestras += count;
  }

  console.log(
    `  ✔ ${tiposNuevos} tipos de prenda, ${nuevos.length} atributos nuevos y ${muestras} muestras de color`,
  );
}
