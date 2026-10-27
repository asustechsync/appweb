"use client";

import { useState, type ReactNode } from "react";

import { IconoCopiar, IconoVerificado } from "../../iconos";
import "./rejilla-bento.css";

export interface PropsRejillaBento {
  /** Un `CuadroMonto` primero y luego los `CuadroBento`. */
  children: ReactNode;
}

/**
 * Rejilla de cuadros de distinto tamaño. En movil dos columnas; desde tablet
 * cuatro, con el cuadro destacado ocupando dos columnas y dos filas.
 */
export function RejillaBento({ children }: PropsRejillaBento) {
  return <div className="ui-rejilla-bento">{children}</div>;
}

export interface PropsCuadroBento {
  /** Icono pequeño junto al titulo: `<IconoTicket tamano={14} />`. */
  icono?: ReactNode;
  /** "N.º de operación". */
  titulo: string;
  /** El dato principal. */
  children: ReactNode;
  /** Linea suave bajo el dato: la hora, el correo. */
  detalle?: ReactNode;
  /** "ancho" ocupa dos columnas; "normal", una. */
  ancho?: "normal" | "ancho";
  /** Dato que falta (sin comprobante): borde punteado y texto tenue. */
  vacio?: boolean;
  /** Texto que se copia con el boton junto al dato: el numero de operacion. */
  copiable?: string;
  /** Arriba a la derecha, junto al titulo: una `Insignia`. */
  marca?: ReactNode;
  /** Cifras cortas en fila bajo el dato: "7 pedidos", "S/ 1,284 comprado". */
  cifras?: { valor: string; etiqueta: string }[];
}

/** Un dato en su propio cuadro: icono y titulo arriba, el dato debajo. */
export function CuadroBento({
  icono,
  titulo,
  children,
  detalle,
  ancho = "normal",
  vacio = false,
  copiable,
  marca,
  cifras,
}: PropsCuadroBento) {
  const clases = ["ui-cuadro-bento"];
  if (ancho === "ancho") clases.push("ui-cuadro-bento--ancho");
  if (vacio) clases.push("ui-cuadro-bento--vacio");
  return (
    <div className={clases.join(" ")}>
      <div className="ui-cuadro-bento__cabecera">
        <p className="ui-cuadro-bento__titulo">
          {icono ? (
            <span className="ui-cuadro-bento__icono" aria-hidden="true">
              {icono}
            </span>
          ) : null}
          {titulo}
        </p>
        {marca}
      </div>
      <div className="ui-cuadro-bento__valor">
        {children}
        {copiable ? <BotonCopiar texto={copiable} /> : null}
      </div>
      {detalle ? <p className="ui-cuadro-bento__detalle">{detalle}</p> : null}
      {cifras && cifras.length > 0 ? (
        <dl className="ui-cuadro-bento__cifras">
          {cifras.map((cifra) => (
            <div key={cifra.etiqueta} className="ui-cuadro-bento__cifra">
              <dt>{cifra.etiqueta}</dt>
              <dd>{cifra.valor}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export interface PropsCuadroDesglose {
  /** Icono pequeño junto al titulo. */
  icono?: ReactNode;
  /** "Desglose". */
  titulo: string;
  /** Lo que suma o resta, en orden. `rebaja` va en verde: un descuento. */
  lineas: { etiqueta: string; valor: string; rebaja?: boolean }[];
  /** La linea final, separada: lo cobrado. `nota` va en suave a su lado. Sin ella, solo lineas. */
  total?: { etiqueta: string; valor: string; nota?: string };
  /** "ancho" ocupa dos columnas; "normal", una. */
  ancho?: "normal" | "ancho";
}

/** De donde sale un monto: lineas que suman o restan y el total abajo. */
export function CuadroDesglose({
  icono,
  titulo,
  lineas,
  total,
  ancho = "normal",
}: PropsCuadroDesglose) {
  return (
    <div
      className={ancho === "ancho" ? "ui-cuadro-bento ui-cuadro-bento--ancho" : "ui-cuadro-bento"}
    >
      <p className="ui-cuadro-bento__titulo">
        {icono ? (
          <span className="ui-cuadro-bento__icono" aria-hidden="true">
            {icono}
          </span>
        ) : null}
        {titulo}
      </p>
      <dl className="ui-cuadro-bento__desglose">
        {lineas.map((linea) => (
          <div key={linea.etiqueta} className="ui-cuadro-bento__linea">
            <dt>{linea.etiqueta}</dt>
            <dd className={linea.rebaja ? "ui-cuadro-bento__rebaja" : undefined}>{linea.valor}</dd>
          </div>
        ))}
        {total ? (
          <div className="ui-cuadro-bento__linea ui-cuadro-bento__linea--total">
            <dt>
              {total.etiqueta}
              {total.nota ? <span className="ui-cuadro-bento__nota"> {total.nota}</span> : null}
            </dt>
            <dd>{total.valor}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/** Copia al portapapeles y avisa un momento con "Copiado". */
function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="ui-cuadro-bento__copiar"
      aria-label={copiado ? "Copiado" : `Copiar ${texto}`}
      onClick={() => {
        void navigator.clipboard.writeText(texto).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        });
      }}
    >
      {copiado ? <IconoVerificado tamano={16} /> : <IconoCopiar tamano={16} />}
    </button>
  );
}

export interface PropsCuadroMonto {
  /** Logo del medio, ya renderizado: `<LogoMedioPago medio="yape" />`. */
  logo: ReactNode;
  /** Estado arriba a la derecha. */
  estado: {
    texto: string;
    tono: "exito" | "alerta" | "error" | "neutro";
    icono?: ReactNode;
  };
  /** Sobre la cifra: "Yape" o "Visa •••• 4242". */
  etiqueta: string;
  /** Cifra ya formateada: "S/ 104.44". */
  monto: string;
  /** Bajo la cifra: la fecha. */
  detalle?: string;
  /** La "cifra" es un texto (un codigo, un distrito): letra de texto, mas pequeña. */
  texto?: boolean;
  /** La cifra no cuenta (pago rechazado): va tachada. */
  anulado?: boolean;
  /** Botones pequeños bajo la fecha: "Recibo PDF", "Reembolsar". No se imprimen. */
  acciones?: AccionBento[];
}

/** El cuadro grande del bento: logo, estado y el monto en grande. */
export function CuadroMonto({
  logo,
  estado,
  etiqueta,
  monto,
  detalle,
  texto = false,
  anulado,
  acciones,
}: PropsCuadroMonto) {
  return (
    <div className="ui-cuadro-bento ui-cuadro-bento--destacado">
      <div className="ui-cuadro-bento__cabecera">
        {logo}
        <span className={`ui-cuadro-bento__estado ui-cuadro-bento__estado--${estado.tono}`}>
          {estado.icono ? <span aria-hidden="true">{estado.icono}</span> : null}
          {estado.texto}
        </span>
      </div>
      <div>
        <p className="ui-cuadro-bento__titulo">{etiqueta}</p>
        <p
          className={[
            "ui-cuadro-bento__monto",
            texto ? "ui-cuadro-bento__monto--texto" : "",
            anulado ? "ui-cuadro-bento__monto--anulado" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {monto}
        </p>
        {detalle ? <p className="ui-cuadro-bento__detalle">{detalle}</p> : null}
        <AccionesBento acciones={acciones} />
      </div>
    </div>
  );
}

export interface AccionBento {
  etiqueta: string;
  icono?: ReactNode;
  onClick: () => void;
}

/** Botones pequeños de un cuadro: "Recibo PDF", "WhatsApp". No se imprimen. */
export function AccionesBento({ acciones }: { acciones?: AccionBento[] | undefined }) {
  if (!acciones || acciones.length === 0) return null;
  return (
    <div className="ui-cuadro-bento__acciones">
      {acciones.map((accion) => (
        <button
          key={accion.etiqueta}
          type="button"
          className="ui-cuadro-bento__accion"
          onClick={accion.onClick}
        >
          {accion.icono ? <span aria-hidden="true">{accion.icono}</span> : null}
          {accion.etiqueta}
        </button>
      ))}
    </div>
  );
}

export interface PropsZonaImprimible {
  children: ReactNode;
}

/**
 * Al imprimir (o "Guardar como PDF") solo sale lo de adentro: sin menu, sin
 * cabecera y sin botones. Fuera de la impresion no cambia nada.
 */
export function ZonaImprimible({ children }: PropsZonaImprimible) {
  return <div className="ui-zona-imprimible">{children}</div>;
}
