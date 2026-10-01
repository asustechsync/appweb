"use client";

import type { ReactNode } from "react";

import { Boton } from "./Boton";
import { Precio } from "./Precio";

import "./primitivos.css";

/** Estructuralmente igual a `TotalesCompra` de @appweb/core, que es quien lo
    calcula. Se declara aqui porque el paquete visual no depende de core. */
export interface PropsResumenCompra {
  unidades: number;
  subtotal: number;
  descuento: number;
  /** `null` mientras no se haya elegido metodo de envio. */
  costoEnvio: number | null;
  total: number;
  /** Cuanto falta para el envio gratis. `null` si ya lo tiene o no aplica. */
  faltaEnvioGratis: number | null;
  /** Ranura bajo el titulo para la lista de productos (checkout). */
  articulos?: ReactNode;
  /** Texto bajo los botones. */
  nota?: ReactNode;
  /** Segundo boton, bajo el principal: "Seguir comprando". */
  hrefSeguir?: string;
  textoSeguir?: string;
  /** Ranura bajo el titulo para el codigo promocional. */
  codigo?: ReactNode;
  /** Bloquea el paso a pagar (lineas sin stock, por ejemplo). */
  motivoBloqueo?: string | null;
  /** Carrito -> navega al checkout. */
  hrefContinuar?: string;
  /** Checkout -> confirma el pedido en el sitio, sin navegar. */
  onConfirmar?: () => void;
  textoContinuar?: string;
  confirmando?: boolean;
}

const FORMATO = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/**
 * Resumen de la compra: cifras y paso a pagar.
 *
 * Ninguna cifra se calcula aqui — todas llegan de `calcularTotales` de
 * @appweb/core, la misma funcion que cerrara el pedido en el servidor. Si el
 * resumen sumara por su cuenta, el total mostrado y el cobrado podrian
 * separarse.
 */
export function ResumenCompra({
  unidades,
  subtotal,
  descuento,
  costoEnvio,
  total,
  faltaEnvioGratis,
  articulos,
  nota = "El costo final y la dirección se confirman en el siguiente paso.",
  hrefSeguir,
  textoSeguir = "Seguir comprando",
  codigo,
  motivoBloqueo,
  hrefContinuar,
  onConfirmar,
  textoContinuar = "Continuar compra",
  confirmando,
}: PropsResumenCompra) {
  const bloqueado = Boolean(motivoBloqueo) || confirmando;

  return (
    <aside className="ui-resumen-compra" aria-label="Resumen de la compra">
      <h2 className="ui-resumen-compra__titulo">Resumen del pedido</h2>

      {articulos}

      {codigo}

      {faltaEnvioGratis !== null ? (
        <p className="ui-resumen-compra__envio-gratis">
          Te faltan <strong>{FORMATO.format(faltaEnvioGratis)}</strong> para el envío gratis.
        </p>
      ) : costoEnvio === 0 ? (
        <p className="ui-resumen-compra__envio-gratis ui-resumen-compra__envio-gratis--logrado">
          ¡Tienes envío gratis!
        </p>
      ) : null}

      <dl className="ui-resumen-compra__cifras">
        <div>
          <dt>
            Subtotal <span>({unidades} {unidades === 1 ? "unidad" : "unidades"})</span>
          </dt>
          <dd>{FORMATO.format(subtotal)}</dd>
        </div>

        {descuento > 0 ? (
          <div className="ui-resumen-compra__descuento">
            <dt>Descuento</dt>
            <dd>−{FORMATO.format(descuento)}</dd>
          </div>
        ) : null}

        {costoEnvio !== null ? (
          <div>
            <dt>Envío</dt>
            <dd>{costoEnvio === 0 ? "Gratis" : FORMATO.format(costoEnvio)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="ui-resumen-compra__total">
        <span>Total</span>
        <Precio valor={total} tamano="lg" />
      </div>
      {descuento > 0 ? (
        <p className="ui-resumen-compra__ahorro">
          Ahorras <strong>{FORMATO.format(descuento)}</strong> en este pedido
        </p>
      ) : null}

      {hrefContinuar || onConfirmar ? (
        <Boton
          disabled={Boolean(bloqueado)}
          {...(onConfirmar ? { onClick: onConfirmar } : hrefContinuar ? { href: hrefContinuar } : {})}
          anchoCompleto
        >
          {confirmando ? "Confirmando…" : textoContinuar}
        </Boton>
      ) : null}
      {motivoBloqueo ? <p className="ui-resumen-compra__bloqueo">{motivoBloqueo}</p> : null}

      {hrefSeguir ? (
        <Boton variante="secundario" href={hrefSeguir} anchoCompleto>
          {textoSeguir}
        </Boton>
      ) : null}

      {nota ? <p className="ui-resumen-compra__nota">{nota}</p> : null}
    </aside>
  );
}
