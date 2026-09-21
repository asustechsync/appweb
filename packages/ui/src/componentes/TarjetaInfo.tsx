import type { ReactNode } from "react";

import { IconoPregunta } from "../iconos";

import "./estilos/tarjeta-info.css";

export interface PropsTarjetaInfo {
  titulo: string;
  children: ReactNode;
}

/** Bloque informativo (tono neutro, sin acciones): notas o contexto al lado
    de un formulario, no otro bloque de datos como `Tarjeta`. */
export function TarjetaInfo({ titulo, children }: PropsTarjetaInfo) {
  return (
    <section className="ui-tarjeta-info">
      <IconoPregunta tamano={18} className="ui-tarjeta-info__icono" />
      <div>
        <h2 className="ui-tarjeta-info__titulo">{titulo}</h2>
        <div className="ui-tarjeta-info__cuerpo">{children}</div>
      </div>
    </section>
  );
}
