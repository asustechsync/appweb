/**
 * Unica ruta del panel: todo lo demas navega en el cliente.
 *
 * Las secciones viven en src/secciones/ y se montan segun la ruta:
 *   resumen · productos · pedidos · envios · usuarios · ajustes
 *
 * Que secciones ve cada rol lo decide `seccionesDelPanel` de @appweb/core.
 */

export default function PaginaPanel() {
  return (
    <main>
      <h1>Panel</h1>
    </main>
  );
}
