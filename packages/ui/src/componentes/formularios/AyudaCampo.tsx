import { useId } from "react";

import { IconoAyuda } from "../../iconos";

import "./ayuda-campo.css";

/** Interrogante junto a una etiqueta: al pasar el cursor o enfocarla, explica en una nota flotante. */
export function AyudaCampo({ texto }: { texto: string }) {
  const id = useId();
  return (
    <span className="ui-ayuda-campo">
      <button type="button" className="ui-ayuda-campo__boton" aria-describedby={id}>
        <IconoAyuda tamano={14} />
        <span className="ui-ayuda-campo__oculto">Qué significa</span>
      </button>
      <span role="tooltip" id={id} className="ui-ayuda-campo__nota">
        {texto}
      </span>
    </span>
  );
}
