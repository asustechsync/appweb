"use client";

import { Boton } from "./Boton";
import { Campo } from "./Campo";

import "./primitivos.css";

export interface PropsCodigoPromocional {
  valor: string;
  onCambio: (valor: string) => void;
  onAplicar: () => void;
  /** Respuesta bajo el campo: codigo invalido, aplicado, no disponible. */
  mensaje?: string | null;
  tonoMensaje?: "error" | "exito" | "info";
  /** Codigo ya aplicado: en vez del campo se muestra con un boton para quitarlo. */
  aplicado?: string | null;
  onQuitar?: () => void;
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
  aplicado = null,
  onQuitar,
}: PropsCodigoPromocional) {
  return (
    <div className="ui-codigo-promocional">
      {aplicado ? (
        <div className="ui-codigo-promocional__form">
          <p className="ui-codigo-promocional__aplicado">
            Cupón <strong>{aplicado}</strong> aplicado
          </p>
          <Boton variante="secundario" {...(onQuitar ? { onClick: onQuitar } : {})}>
            Quitar
          </Boton>
        </div>
      ) : (
        <form
          className="ui-codigo-promocional__form"
          onSubmit={(evento) => {
            evento.preventDefault();
            onAplicar();
          }}
        >
          <div className="ui-codigo-promocional__campo">
            <Campo
              id="codigo-promocional"
              etiqueta="Código promocional"
              valor={valor}
              onCambio={onCambio}
              placeholder="Código promocional"
              autoComplete="off"
              etiquetaOculta
            />
          </div>
          <Boton tipo="submit" disabled={valor.trim() === ""}>
            Aplicar
          </Boton>
        </form>
      )}

      {mensaje ? (
        <p className={`ui-codigo-promocional__mensaje ui-codigo-promocional__mensaje--${tonoMensaje}`}>
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
