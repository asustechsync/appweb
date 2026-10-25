import type { ReactNode } from "react";

import "./vista-previa.css";

export interface PropsVistaPrevia {
  /** Logo del medio, ya renderizado. */
  logo: ReactNode;
  /** Estado arriba a la derecha. */
  estado: { texto: string; tono: "exito" | "alerta" | "error" | "neutro" };
  /** Sobre la cifra: "Yape". */
  etiqueta: string;
  /** Cifra ya formateada: "S/ 104.44". */
  monto: string;
  /** Bajo la cifra: la fecha. */
  detalle?: string;
  /** El resto de datos, uno por linea. */
  filas?: { etiqueta: string; valor: ReactNode }[];
  /** Botones al pie: "Abrir pago". */
  acciones?: ReactNode;
  /** Contenido propio (cuadros bento): sustituye cabecera, cifra y filas. */
  children?: ReactNode;
  /** Sin nada elegido: el aviso que se ve en su lugar. */
  vacio?: string;
}

/** Resumen de lo elegido en una lista: monto grande, datos clave y acciones. */
export function VistaPrevia({
  logo,
  estado,
  etiqueta,
  monto,
  detalle,
  filas,
  acciones,
  children,
  vacio,
}: PropsVistaPrevia) {
  if (vacio) {
    return (
      <div className="ui-vista-previa">
        <p className="ui-vista-previa__vacio">{vacio}</p>
      </div>
    );
  }
  if (children) {
    return (
      <div className="ui-vista-previa-cuadros">
        {children}
        {acciones ? <div className="ui-vista-previa__acciones">{acciones}</div> : null}
      </div>
    );
  }
  return (
    <div className="ui-vista-previa">
      <div className="ui-vista-previa__cabecera">
        {logo}
        <span className={`ui-vista-previa__estado ui-vista-previa__estado--${estado.tono}`}>
          {estado.texto}
        </span>
      </div>
      <div>
        <p className="ui-vista-previa__etiqueta">{etiqueta}</p>
        <p className="ui-vista-previa__monto">{monto}</p>
        {detalle ? <p className="ui-vista-previa__detalle">{detalle}</p> : null}
      </div>
      <dl className="ui-vista-previa__filas">
        {(filas ?? []).map((fila) => (
          <div key={fila.etiqueta} className="ui-vista-previa__fila">
            <dt>{fila.etiqueta}</dt>
            <dd>{fila.valor}</dd>
          </div>
        ))}
      </dl>
      {acciones ? <div className="ui-vista-previa__acciones">{acciones}</div> : null}
    </div>
  );
}
