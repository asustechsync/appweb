/**
 * CLASE A (variante) — busqueda. Presupuesto: 60-90 ms.
 *
 * No se pre-genera porque el termino es libre, pero si se cachea por termino
 * con una vida corta. No vale la pena invalidarla por evento.
 */

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function PaginaBuscar({ searchParams }: Props) {
  const { q } = await searchParams;

  if (!q || q.trim().length < 2) {
    return (
      <main>
        <h1>Buscar</h1>
        <p>Escribe al menos 2 letras.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Resultados para &ldquo;{q}&rdquo;</h1>
    </main>
  );
}
