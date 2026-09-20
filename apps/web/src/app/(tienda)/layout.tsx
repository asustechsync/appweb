import { Cabecera } from "@appweb/ui";

import { categoriasDestacadas } from "@/lib/consultas";

/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera es casi toda HTML estatico: solo SelectorUbicacion y
 * AlternarTema son islas cliente. Las secciones de la barra de navegacion
 * son categorias reales (cacheadas, etiqueta `navegacion`) mas las anclas
 * de Ofertas y Nuevos Ingresos, que solo existen en la portada — por eso
 * apuntan con `/#...` y no con `#...`, para funcionar desde cualquier pagina.
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDestacadas();

  const secciones = [
    ...categorias.map((categoria) => ({
      etiqueta: categoria.nombre,
      href: `/categorias/${categoria.slug}`,
    })),
    { etiqueta: "Ofertas", href: "/#ofertas" },
    { etiqueta: "Nuevos Ingresos", href: "/#nuevos-ingresos" },
  ];

  return (
    <>
      <Cabecera secciones={secciones} />
      {children}
    </>
  );
}
