import type { ReactNode } from "react";
import Image from "next/image";

import { IconoPregunta } from "../iconos";

import "./estilos/tarjeta-info.css";

export interface PropsTarjetaInfo {
  titulo: string;
  children: ReactNode;
  /** Ilustracion opcional para dar contexto visual al bloque informativo. */
  imagen?: { src: string; alt: string };
}

/** Bloque informativo (tono neutro, sin acciones): notas o contexto al lado
    de un formulario, no otro bloque de datos como `Tarjeta`. */
export function TarjetaInfo({ titulo, children, imagen }: PropsTarjetaInfo) {
  const contenido = (
    <div>
      <h2 className="ui-tarjeta-info__titulo">{titulo}</h2>
      <div className="ui-tarjeta-info__cuerpo">{children}</div>
    </div>
  );

  return (
    <section className={imagen ? "ui-tarjeta-info ui-tarjeta-info--ilustrada" : "ui-tarjeta-info"}>
      {imagen ? (
        <>
          <div className="ui-tarjeta-info__ilustracion">
            <Image
              src={imagen.src}
              alt={imagen.alt}
              width={960}
              height={640}
              loading="eager"
              sizes="(min-width: 1024px) 256px, 70vw"
              className="ui-tarjeta-info__imagen"
            />
          </div>
          {contenido}
        </>
      ) : (
        <>
          <IconoPregunta tamano={18} className="ui-tarjeta-info__icono" />
          {contenido}
        </>
      )}
    </section>
  );
}
