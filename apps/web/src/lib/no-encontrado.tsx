import { EstadoVacio, IconoBuscar } from "@appweb/ui";

/**
 * Cuerpo del 404. Lo usan el 404 general (app/not-found.tsx, que pone su
 * propia cabecera) y los de la ficha y el pedido, que ya estan dentro del
 * layout con cabecera: ahi poner otra la duplicaria.
 */
export function ContenidoNoEncontrado({ texto }: { texto?: string }) {
  return (
    <EstadoVacio
      icono={<IconoBuscar tamano={28} />}
      titulo="No encontramos esta página"
      texto={texto ?? "Puede que el enlace esté mal escrito o que la página ya no exista."}
      textoAccion="Ir a la portada"
      hrefAccion="/"
    />
  );
}
