import Image from "next/image";
import IconoSearch from "../iconos/search.svg";
import "./primitivos.css";

export interface PropsBuscador {
  textoBuscar?: string;
  /**
   * Id del campo, que el <label> referencia. Solo hace falta cambiarlo si hay
   * mas de un buscador en la misma pagina (cabecera + menu movil): dos ids
   * iguales rompen la asociacion para lectores de pantalla.
   */
  id?: string;
}

/**
 * Buscador del catalogo.
 *
 * Es un <form> nativo: envia a /buscar?q=... sin una linea de JavaScript,
 * asi que funciona dentro del HTML estatico de Clase A.
 *
 * Independiente de la cabecera: su aspecto vive en estilos/buscador.css y no
 * depende de donde se monte. Cuanto espacio ocupa lo decide el contenedor.
 */
export function Buscador({
  textoBuscar = "Buscar productos, marcas y más",
  id = "busqueda",
}: PropsBuscador) {
  return (
    <form className="ui-buscador" action="/buscar" role="search">
      <label className="ui-solo-lectores" htmlFor={id}>
        Buscar en el catálogo
      </label>
      <input id={id} name="q" type="search" placeholder={textoBuscar} />
      <button type="submit" aria-label="Buscar">
        <Image src={IconoSearch} alt="" width={20} height={20} aria-hidden="true" />
      </button>
    </form>
  );
}
