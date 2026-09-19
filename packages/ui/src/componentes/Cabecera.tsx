import { AccionesCuenta } from "./AccionesCuenta";
import { AlternarTema } from "./AlternarTema";
import { Buscador, type PropsBuscador } from "./Buscador";
import { Logo } from "./Logo";

import "./primitivos.css";

export interface PropsCabecera {
  textoBuscar?: PropsBuscador["textoBuscar"];
}

/**
 * Cabecera de la tienda — parte del shell estatico (Clase A).
 *
 * Compone Logo, Buscador, AccionesCuenta (usuario + carrito) y AlternarTema.
 * Solo AlternarTema es isla cliente: el resto se sirve como HTML estatico y
 * se hidrata aparte sin bloquear el pintado.
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
        <div className="ui-cabecera__acciones">
          <AccionesCuenta />
          <AlternarTema />
        </div>
      </div>
    </header>
  );
}
