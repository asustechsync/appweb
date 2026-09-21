import { FormularioIngreso } from "./FormularioIngreso";

/**
 * Dinamica: lee `next` de la URL para saber a donde volver tras ingresar
 * (por ejemplo, de vuelta al checkout). Con `cacheComponents` eso exige esta
 * declaracion, igual que en /buscar.
 */
export const instant = false;

export const metadata = { title: "Ingresar" };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function PaginaIngresar({ searchParams }: Props) {
  const { next } = await searchParams;

  return <FormularioIngreso siguiente={next && next.startsWith("/") ? next : "/mi-cuenta"} />;
}
