import { AccionesCuenta } from "./AccionesCuenta";
import { AlternarTema } from "./AlternarTema";
import { Buscador, type PropsBuscador } from "./Buscador";
import { Logo } from "./Logo";
import { NavegacionSecciones, type SeccionDeNavegacion } from "./NavegacionSecciones";
import { SelectorUbicacion } from "./SelectorUbicacion";

import "./primitivos.css";

export interface PropsCabecera {
  textoBuscar?: PropsBuscador["textoBuscar"];
  /** Categorias reales + anclas de la portada. Vacio no pinta la barra. */
  secciones?: SeccionDeNavegacion[];
}

/**
 * Cabecera de la tienda — parte del shell estatico (Clase A).
 *
 * Fila principal: Logo, Buscador, AccionesCuenta (usuario + carrito) y
 * AlternarTema. Fila secundaria: SelectorUbicacion (mock, sin geolocalizacion
 * todavia) y NavegacionSecciones. AlternarTema y SelectorUbicacion son islas
 * cliente; el resto se sirve como HTML estatico y se hidrata aparte sin
 * bloquear el pintado.
 */
export function Cabecera({ textoBuscar, secciones = [] }: PropsCabecera) {
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
      <div className="ui-cabecera__secundaria">
        <div className="ui-cabecera__secundaria-contenido">
          <SelectorUbicacion />
          <NavegacionSecciones secciones={secciones} />
        </div>
      </div>
    </header>
  );
}
