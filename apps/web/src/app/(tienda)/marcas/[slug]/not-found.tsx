import { ContenidoNoEncontrado } from "@/lib/no-encontrado";

/** Marca que no existe o se dio de baja. La cabecera ya la pone el layout. */
export default function MarcaNoEncontrada() {
  return (
    <ContenidoNoEncontrado texto="Esta marca no está disponible o el enlace está mal escrito." />
  );
}
