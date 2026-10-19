import { ContenidoNoEncontrado } from "@/lib/no-encontrado";

/** Categoria que no existe o se oculto. La cabecera ya la pone el layout. */
export default function CategoriaNoEncontrada() {
  return (
    <ContenidoNoEncontrado texto="Esta categoría no está disponible o el enlace está mal escrito." />
  );
}
