import "./primitivos.css";

/**
 * Titulos de las columnas de LineaDeCarrito. Solo existe desde 40rem: en
 * movil las lineas van apiladas y no hay columnas que titular.
 */
export function CabeceraLineas() {
  return (
    <div className="ui-cabecera-lineas" aria-hidden="true">
      <span>Producto</span>
      <span className="ui-cabecera-lineas__columna">Cantidad</span>
      <span className="ui-cabecera-lineas__columna ui-cabecera-lineas__columna--fin">Precio</span>
    </div>
  );
}
