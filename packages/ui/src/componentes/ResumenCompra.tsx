"use client";

import Link from "next/link";

import { Precio } from "./Precio";

import "./primitivos.css";

export interface MetodoEnvioElegible {
  id: string;
  nombre: string;
  costo: number;
  gratisDesde: number | null;
}

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
  metodos: MetodoEnvioElegible[];
  metodoElegidoId: string | null;
  onMetodo: (id: string) => void;
  /** Bloquea el paso a pagar (lineas sin stock, por ejemplo). */
  motivoBloqueo?: string | null;
  hrefContinuar: string;
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
  metodos,
  metodoElegidoId,
  onMetodo,
  motivoBloqueo,
  hrefContinuar,
}: PropsResumenCompra) {
  const bloqueado = Boolean(motivoBloqueo);

  return (
    <aside className="ui-resumen-compra" aria-label="Resumen de la compra">
      <h2 className="ui-resumen-compra__titulo">Resumen</h2>

      {faltaEnvioGratis !== null ? (
        <p className="ui-resumen-compra__envio-gratis">
          Te faltan <strong>{FORMATO.format(faltaEnvioGratis)}</strong> para el envío gratis.
        </p>
      ) : costoEnvio === 0 ? (
        <p className="ui-resumen-compra__envio-gratis ui-resumen-compra__envio-gratis--logrado">
          ¡Tienes envío gratis!
        </p>
      ) : null}

      {metodos.length > 0 ? (
        <fieldset className="ui-resumen-compra__envios">
          <legend>Envío</legend>
          {metodos.map((metodo) => (
            <label key={metodo.id} className="ui-resumen-compra__envio">
              <input
                type="radio"
                name="metodo-envio"
                value={metodo.id}
                checked={metodo.id === metodoElegidoId}
                onChange={() => onMetodo(metodo.id)}
              />
              <span className="ui-resumen-compra__envio-nombre">{metodo.nombre}</span>
              <span className="ui-resumen-compra__envio-costo">
                {metodo.costo === 0 ? "Gratis" : FORMATO.format(metodo.costo)}
              </span>
            </label>
          ))}
        </fieldset>
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

        <div>
          <dt>Envío</dt>
          <dd>
            {costoEnvio === null
              ? "Elige un método"
              : costoEnvio === 0
                ? "Gratis"
                : FORMATO.format(costoEnvio)}
          </dd>
        </div>
      </dl>

      <div className="ui-resumen-compra__total">
        <span>Total</span>
        <Precio valor={total} tamano="lg" />
      </div>

      {bloqueado ? (
        <>
          <span className="ui-resumen-compra__continuar ui-resumen-compra__continuar--bloqueado">
            Continuar compra
          </span>
          <p className="ui-resumen-compra__bloqueo">{motivoBloqueo}</p>
        </>
      ) : (
        <Link className="ui-resumen-compra__continuar" href={hrefContinuar}>
          Continuar compra
        </Link>
      )}

      <p className="ui-resumen-compra__nota">
        El costo final y la dirección se confirman en el siguiente paso.
      </p>
    </aside>
  );
}
