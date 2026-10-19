"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, type KeyboardEvent, useRef, useState } from "react";

import "../estilos.css";

export interface PropsFiltroRango {
  /** Nombre del filtro, para los lectores de pantalla ("Precio"). */
  titulo: string;
  /** Limites de la barra. */
  min: number;
  max: number;
  /** Valores puestos ahora (los limites si no hay filtro). */
  valorMin: number;
  valorMax: number;
  /** URL del listado sin este filtro: se le agregan los dos parametros. */
  hrefBase: string;
  parametroMin: string;
  parametroMax: string;
  /** Texto antes de cada valor ("S/ "). */
  prefijo?: string;
}

/**
 * Barra deslizable de dos manijas (minimo y maximo) con dos cajas debajo para
 * escribir los valores a mano, por si arrastrar es incomodo. Isla cliente solo
 * para esto y para navegar al soltar o confirmar: el listado sigue siendo una
 * URL que el servidor cachea, igual que el resto de los filtros. Un valor que
 * queda en el limite no se escribe en la URL.
 */
export function FiltroRango({
  titulo,
  min,
  max,
  valorMin,
  valorMax,
  hrefBase,
  parametroMin,
  parametroMax,
  prefijo = "",
}: PropsFiltroRango) {
  const router = useRouter();
  const [bajo, setBajo] = useState(valorMin);
  const [alto, setAlto] = useState(valorMax);
  // Lo que se esta escribiendo en las cajas; se iguala al numero al confirmar.
  const [textoBajo, setTextoBajo] = useState(String(valorMin));
  const [textoAlto, setTextoAlto] = useState(String(valorMax));
  // Ultimo rango al que se navego: no se navega de nuevo al mismo.
  const confirmado = useRef({ bajo: valorMin, alto: valorMax });

  const recorrido = max - min;
  const inicio = ((bajo - min) / recorrido) * 100;
  const fin = ((alto - min) / recorrido) * 100;

  function confirmar(nuevoBajo: number, nuevoAlto: number) {
    if (confirmado.current.bajo === nuevoBajo && confirmado.current.alto === nuevoAlto) return;
    confirmado.current = { bajo: nuevoBajo, alto: nuevoAlto };
    const parametros: string[] = [];
    if (nuevoBajo > min) parametros.push(`${parametroMin}=${nuevoBajo}`);
    if (nuevoAlto < max) parametros.push(`${parametroMax}=${nuevoAlto}`);
    const separador = hrefBase.includes("?") ? "&" : "?";
    const href =
      parametros.length > 0 ? `${hrefBase}${separador}${parametros.join("&")}` : hrefBase;
    router.push(href, { scroll: false });
  }

  function moverBajo(valor: number) {
    setBajo(valor);
    setTextoBajo(String(valor));
  }
  function moverAlto(valor: number) {
    setAlto(valor);
    setTextoAlto(String(valor));
  }

  /** Lo escrito en una caja, llevado a un valor valido dentro del rango. */
  function confirmarBajo() {
    const escrito = textoBajo === "" ? min : Number(textoBajo);
    const valor = Math.min(Math.max(escrito, min), alto);
    moverBajo(valor);
    confirmar(valor, alto);
  }
  function confirmarAlto() {
    const escrito = textoAlto === "" ? max : Number(textoAlto);
    const valor = Math.max(Math.min(escrito, max), bajo);
    moverAlto(valor);
    confirmar(bajo, valor);
  }

  /** Enter confirma: suelta la caja y su `onBlur` hace el resto. */
  function alPulsarEnter(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter") evento.currentTarget.blur();
  }

  // Con las dos manijas juntas en un extremo, la de arriba tiene que ser la
  // que se puede mover hacia adentro: la minima si estan en el tope alto.
  const minimaArriba = bajo > (min + max) / 2;

  return (
    <div className="ui-filtro-rango">
      <div
        className="ui-filtro-rango__barra"
        style={{ "--inicio": `${inicio}%`, "--fin": `${fin}%` } as CSSProperties}
      >
        <div className="ui-filtro-rango__pista" />
        <input
          type="range"
          className={`ui-filtro-rango__manija${minimaArriba ? " ui-filtro-rango__manija--arriba" : ""}`}
          min={min}
          max={max}
          step={1}
          value={bajo}
          aria-label={`${titulo} mínimo`}
          onChange={(evento) => moverBajo(Math.min(Number(evento.target.value), alto))}
          onPointerUp={() => confirmar(bajo, alto)}
          onKeyUp={() => confirmar(bajo, alto)}
        />
        <input
          type="range"
          className="ui-filtro-rango__manija"
          min={min}
          max={max}
          step={1}
          value={alto}
          aria-label={`${titulo} máximo`}
          onChange={(evento) => moverAlto(Math.max(Number(evento.target.value), bajo))}
          onPointerUp={() => confirmar(bajo, alto)}
          onKeyUp={() => confirmar(bajo, alto)}
        />
      </div>
      <div className="ui-filtro-rango__cajas">
        <label className="ui-filtro-rango__caja">
          <span className="ui-filtro-rango__prefijo">{prefijo.trim()}</span>
          <input
            type="text"
            inputMode="numeric"
            className="ui-filtro-rango__valor"
            value={textoBajo}
            aria-label={`${titulo} mínimo, valor`}
            onChange={(evento) => setTextoBajo(evento.target.value.replace(/\D/g, "").slice(0, 5))}
            onBlur={confirmarBajo}
            onKeyDown={alPulsarEnter}
          />
        </label>
        <span className="ui-filtro-rango__guion" aria-hidden="true">
          –
        </span>
        <label className="ui-filtro-rango__caja">
          <span className="ui-filtro-rango__prefijo">{prefijo.trim()}</span>
          <input
            type="text"
            inputMode="numeric"
            className="ui-filtro-rango__valor"
            value={textoAlto}
            aria-label={`${titulo} máximo, valor`}
            onChange={(evento) => setTextoAlto(evento.target.value.replace(/\D/g, "").slice(0, 5))}
            onBlur={confirmarAlto}
            onKeyDown={alPulsarEnter}
          />
        </label>
      </div>
    </div>
  );
}
