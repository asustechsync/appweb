/**
 * CLASE C — mi cuenta. Presupuesto: 0 ms de navegacion.
 *
 * Esta ruta se monta UNA vez. A partir de ahi la navegacion entre secciones
 * (pedidos, direcciones, datos) es del router del cliente y los datos salen de
 * la cache de TanStack Query: sin tocar el servidor.
 */

export const metadata = { title: "Mi cuenta" };

export default function PaginaMiCuenta() {
  return (
    <main>
      <h1>Mi cuenta</h1>
    </main>
  );
}
