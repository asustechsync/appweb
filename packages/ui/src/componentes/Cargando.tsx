import "./primitivos.css";

export interface PropsCargando {
  texto?: string;
}

/**
 * Espera breve dentro de una isla cliente que aun no tiene datos.
 *
 * `aria-live` para que un lector de pantalla anuncie la espera; el punto que
 * late se queda quieto si el sistema pide menos movimiento (regla global en
 * globals.css).
 */
export function Cargando({ texto = "Cargando…" }: PropsCargando) {
  return (
    <p className="ui-cargando" role="status" aria-live="polite">
      <span className="ui-cargando__punto" aria-hidden="true" />
      {texto}
    </p>
  );
}
