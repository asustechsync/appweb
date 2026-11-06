import { IconoRefrescar } from "../../iconos";

import "./limpiar-filtros.css";

export interface PropsLimpiarFiltros {
  onClick: () => void;
}

/**
 * Boton de solo icono (refrescar) que limpia los filtros de la barra de un listado. Quien lo usa decide cuando
 * mostrarlo: solo tiene sentido con algun filtro activo.
 */
export function LimpiarFiltros({ onClick }: PropsLimpiarFiltros) {
  return (
    <button
      type="button"
      className="ui-limpiar-filtros"
      onClick={onClick}
      aria-label="Limpiar filtros"
      title="Limpiar filtros"
    >
      <IconoRefrescar tamano={20} />
    </button>
  );
}
