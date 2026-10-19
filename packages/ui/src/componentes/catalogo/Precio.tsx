import { MONEDA } from "@appweb/core/formato";

import "../estilos.css";

export interface PropsPrecio {
  valor: number;
  /** Precio tachado. Se omite si no hay oferta. */
  antes?: number | null;
  tamano?: "sm" | "md" | "lg";
  /** Pinta el simbolo de moneda aparte de la cifra, para darles fuentes distintas. */
  separarSimbolo?: boolean;
}

/** Parte el precio en simbolo y cifra respetando el orden de la configuracion regional. */
function partesDelPrecio(valor: number) {
  const partes: { tipo: "simbolo" | "cifra"; texto: string }[] = [];
  for (const parte of MONEDA.formatToParts(valor)) {
    // El espacio entre simbolo y cifra lo pone el CSS, no el texto.
    if (parte.type === "literal" && parte.value.trim() === "") continue;

    const ultima = partes.at(-1);
    if (parte.type === "currency") {
      partes.push({ tipo: "simbolo", texto: parte.value });
    } else if (ultima?.tipo === "cifra") {
      ultima.texto += parte.value;
    } else {
      partes.push({ tipo: "cifra", texto: parte.value });
    }
  }
  return partes;
}

/** No calcula nada: recibe las cifras ya resueltas por `resolverPrecio` de @appweb/core. */
export function Precio({ valor, antes, tamano = "md", separarSimbolo = false }: PropsPrecio) {
  return (
    <span className={`ui-precio ui-precio--${tamano}`}>
      {separarSimbolo ? (
        <span
          className="ui-precio__actual ui-precio__actual--separado"
          aria-label={MONEDA.format(valor)}
        >
          {partesDelPrecio(valor).map((parte, indice) => (
            <span
              key={indice}
              aria-hidden="true"
              className={parte.tipo === "simbolo" ? "ui-precio__simbolo" : "ui-precio__cifra"}
            >
              {parte.texto}
            </span>
          ))}
        </span>
      ) : (
        <span className="ui-precio__actual">{MONEDA.format(valor)}</span>
      )}
      {antes ? <span className="ui-precio__antes">{MONEDA.format(antes)}</span> : null}
    </span>
  );
}
