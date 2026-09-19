/**
 * CLASE A — ficha de producto. Etiqueta `producto:{slug}`.
 *
 * Todo el marcado es estatico salvo la galeria y el panel de compra, que son
 * islas cliente y se hidratan sin bloquear el resto.
 */

// TEMPORAL: sigue siendo un stub que lee `params` sin `use cache`. Cuando se
// implemente la ficha real con `generateStaticParams`, este export sobra.
export const instant = false;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PaginaProducto({ params }: Props) {
  const { slug } = await params;
  return (
    <main>
      <h1>{slug}</h1>
    </main>
  );
}
