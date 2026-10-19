import { ContenidoNoEncontrado } from "@/lib/no-encontrado";

/** Producto que no existe o se dio de baja. La cabecera ya la pone el layout. */
export default function ProductoNoEncontrado() {
  return (
    <ContenidoNoEncontrado texto="Este producto ya no está disponible o el enlace está mal escrito." />
  );
}
