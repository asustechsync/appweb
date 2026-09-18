/**
 * CLASE A — listado de categoria. Etiqueta `categoria:{slug}`.
 *
 * Los filtros viajan en la URL y entran como argumento de la funcion cacheada,
 * asi que cada combinacion es su propia entrada bajo la misma etiqueta. El
 * panel de filtros son enlaces: no hay estado de cliente que hidratar.
 */

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PaginaCategoria({ params }: Props) {
  const { slug } = await params;
  return (
    <main>
      <h1>{slug}</h1>
    </main>
  );
}
