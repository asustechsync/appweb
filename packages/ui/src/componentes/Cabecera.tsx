import { Buscador, type PropsBuscador } from "./Buscador";
import { Logo } from "./Logo";

import "./primitivos.css";

export interface PropsCabecera {
  textoBuscar?: PropsBuscador["textoBuscar"];
}

/**
 * Cabecera de la tienda — parte del shell estatico (Clase A).
 *
 * Componente de servidor: no hay una sola linea de JavaScript aqui. Solo
 * compone Logo y Buscador y decide como se colocan uno junto al otro; el
 * aspecto de cada uno vive en su propio archivo de estilos.
 */
export function Cabecera({ textoBuscar }: PropsCabecera) {
  // `Buscador` ya trae su propio placeholder por defecto; solo se reenvia la
  // prop cuando de verdad llega un valor, para no chocar con
  // exactOptionalPropertyTypes (pasar `undefined` explicito no es lo mismo
  // que omitir la prop).
  const propsBuscador = textoBuscar !== undefined ? { textoBuscar } : {};

  return (
    <header className="ui-cabecera">
      <div className="ui-cabecera__contenido">
        <Logo />
        <Buscador {...propsBuscador} />
      </div>
    </header>
  );
}
