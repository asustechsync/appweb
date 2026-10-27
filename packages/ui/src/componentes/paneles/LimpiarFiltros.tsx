import "./limpiar-filtros.css";

export interface PropsLimpiarFiltros {
  onClick: () => void;
}

/**
 * "Limpiar filtros" para la barra de un listado. Quien lo usa decide cuando
 * mostrarlo: solo tiene sentido con algun filtro activo.
 */
export function LimpiarFiltros({ onClick }: PropsLimpiarFiltros) {
  return (
    <button type="button" className="ui-limpiar-filtros" onClick={onClick}>
      Limpiar filtros
    </button>
  );
}
