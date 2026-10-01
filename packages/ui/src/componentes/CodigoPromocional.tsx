"use client";

import { IconoEtiqueta } from "../iconos";

import "./primitivos.css";

export interface PropsCodigoPromocional {
  valor: string;
  onCambio: (valor: string) => void;
  onAplicar: () => void;
  /** Respuesta bajo el campo: codigo invalido, aplicado, no disponible. */
  mensaje?: string | null;
  tonoMensaje?: "error" | "exito" | "info";
}

/**
 * Campo fijo de codigo promocional, con su boton Aplicar.
 *
 * No valida ni descuenta: recibe el texto y avisa hacia arriba cuando se
 * pulsa Aplicar. Quien lo use decide que significa un codigo valido.
 */
export function CodigoPromocional({
  valor,
  onCambio,
  onAplicar,
  mensaje,
  tonoMensaje = "info",
}: PropsCodigoPromocional) {
  return (
    <div className="ui-codigo-promocional">
      <form
        className="ui-codigo-promocional__form"
        onSubmit={(evento) => {
          evento.preventDefault();
          onAplicar();
        }}
      >
        <label className="ui-codigo-promocional__campo">
          <IconoEtiqueta tamano={16} />
          <input
            type="text"
            value={valor}
            onChange={(evento) => onCambio(evento.target.value)}
            placeholder="Código promocional"
            aria-label="Código promocional"
            autoComplete="off"
            autoCapitalize="characters"
          />
        </label>
        <button type="submit" disabled={valor.trim() === ""}>
          Aplicar
        </button>
      </form>

      {mensaje ? (
        <p className={`ui-codigo-promocional__mensaje ui-codigo-promocional__mensaje--${tonoMensaje}`}>
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
