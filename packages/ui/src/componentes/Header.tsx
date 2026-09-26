import { AccionesCuenta } from "./AccionesCuenta";
import { Buscador } from "./Buscador";
import { Logo } from "./Logo";
import { Ubicacion } from "./Ubicacion";
import { IconoMenu } from "../iconos";
import "./estilos/header.css";

export type PropsHeader = Record<string, never>;

export function Header() {
  return (
    <header className="ui-header">
      <div className="ui-header__interior">
        <div className="ui-header__marca">
          <Logo />
        </div>
        <div className="ui-header__buscador">
          <Buscador id="busqueda-header" textoBuscar="Buscar productos" />
        </div>
        <button className="ui-header__menu" type="button" aria-label="Menú" title="Menú">
          <IconoMenu />
        </button>
        <div className="ui-header__ubicacion"><Ubicacion /></div>
        <div className="ui-header__acciones">
          <AccionesCuenta />
        </div>
      </div>
    </header>
  );
}
