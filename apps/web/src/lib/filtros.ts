import { ETIQUETAS_ORDEN, ORDENES, type FiltrosListado, urlDeFiltros } from "@appweb/core";
import type { GrupoDeFiltro } from "@appweb/ui";

import type { Facetas } from "./consultas";

/**
 * De los filtros actuales a los grupos de enlaces de `BarraFiltros`. Cada
 * opcion apunta a la URL con ese filtro puesto, o quitado si ya estaba: un
 * clic lo activa y otro lo desactiva. Solo se ofrecen opciones que existen
 * en el listado (tallas con stock, marcas presentes).
 */
export function gruposDeFiltros(
  base: string,
  filtros: FiltrosListado,
  opciones: { hijas?: { slug: string; nombre: string }[]; facetas?: Facetas },
): GrupoDeFiltro[] {
  const { hijas = [], facetas } = opciones;
  const grupos: GrupoDeFiltro[] = [];

  // El precio va primero y es una barra deslizable: navega al soltarla.
  if (facetas?.precio) {
    const { min, max } = facetas.precio;
    const valorMin = Math.min(Math.max(filtros.precioMin ?? min, min), max);
    const valorMax = Math.max(Math.min(filtros.precioMax ?? max, max), valorMin);
    grupos.push({
      titulo: "Precio",
      opciones: [],
      rango: {
        min,
        max,
        valorMin,
        valorMax,
        hrefBase: urlDeFiltros(base, filtros, {
          precioMin: null,
          precioMax: null,
        }),
        parametroMin: "precioMin",
        parametroMax: "precioMax",
        prefijo: "S/ ",
      },
    });
  }
  if (hijas.length > 0) {
    grupos.push({
      titulo: "Tipo",
      opciones: hijas.map((h) => ({
        etiqueta: h.nombre,
        href: urlDeFiltros(base, filtros, {
          sub: filtros.sub === h.slug ? null : h.slug,
        }),
        activa: filtros.sub === h.slug,
      })),
    });
  }
  if (facetas && facetas.tallas.length > 0) {
    grupos.push({
      titulo: "Talla",
      opciones: facetas.tallas.map((t) => ({
        etiqueta: t,
        href: urlDeFiltros(base, filtros, {
          talla: filtros.talla === t ? null : t,
        }),
        activa: filtros.talla === t,
      })),
    });
  }
  if (facetas && facetas.colores.length > 1) {
    grupos.push({
      titulo: "Color",
      opciones: facetas.colores.map((c) => {
        const activa = filtros.color?.toLowerCase() === c.toLowerCase();
        return {
          etiqueta: c,
          href: urlDeFiltros(base, filtros, { color: activa ? null : c }),
          activa,
        };
      }),
    });
  }
  if (facetas && facetas.marcas.length > 1) {
    grupos.push({
      titulo: "Marca",
      opciones: facetas.marcas.map((m) => ({
        etiqueta: m.nombre,
        href: urlDeFiltros(base, filtros, {
          marca: filtros.marca === m.slug ? null : m.slug,
        }),
        activa: filtros.marca === m.slug,
      })),
    });
  }
  if (facetas) {
    grupos.push({
      titulo: "Ofertas",
      opciones: [
        {
          etiqueta: "Solo ofertas",
          href: urlDeFiltros(base, filtros, { ofertas: !filtros.ofertas }),
          activa: filtros.ofertas,
        },
      ],
    });
    grupos.push({
      titulo: "Disponibilidad",
      opciones: [
        {
          etiqueta: "Solo en stock",
          href: urlDeFiltros(base, filtros, { stock: !filtros.stock }),
          activa: filtros.stock,
        },
      ],
    });
  }
  grupos.push({
    titulo: "Ordenar",
    opciones: ORDENES.map((orden) => ({
      etiqueta: ETIQUETAS_ORDEN[orden],
      href: urlDeFiltros(base, filtros, { orden }),
      activa: filtros.orden === orden,
    })),
  });
  return grupos;
}

/** "1 producto", "12 productos". */
export function resumenDeCantidad(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? "producto" : "productos"}`;
}
