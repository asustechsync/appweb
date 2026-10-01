import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsDisposicionCompra {
  titulo: string;
  /** Texto bajo el titulo: "3 productos", "Paso 2 de 3"... */
  subtitulo?: string;
  /** Columna principal: las lineas del carrito, el formulario del checkout. */
  children: ReactNode;
  /** Columna lateral pegajosa: normalmente ResumenCompra. */
  lateral?: ReactNode;
  /** A la derecha del titulo: "Seguir comprando". */
  accion?: ReactNode;
  /** "acceso": usa la fuente que el layout haya definido en --tipo-familia-acceso. */
  fuente?: "acceso";
}

/**
 * Disposicion de las pantallas de compra (Clase B): contenido a la izquierda,
 * resumen a la derecha.
 *
 * Lo comparten carrito y checkout para que el resumen no salte de sitio al
 * pasar de una pantalla a la otra. En movil el resumen va debajo, porque la
 * decision de compra se toma despues de revisar lo que hay.
 */
export function DisposicionCompra({
  titulo,
  subtitulo,
  children,
  lateral,
  accion,
  fuente,
}: PropsDisposicionCompra) {
  return (
    <div className={fuente === "acceso" ? "ui-disposicion-compra ui-disposicion-compra--acceso" : "ui-disposicion-compra"}>
      <header className="ui-disposicion-compra__cabecera">
        <div className="ui-disposicion-compra__titulo">
          <h1>{titulo}</h1>
          {subtitulo ? <p>{subtitulo}</p> : null}
        </div>
        {accion ? <div className="ui-disposicion-compra__accion">{accion}</div> : null}
      </header>

      <div className="ui-disposicion-compra__principal">{children}</div>

      {lateral ? <div className="ui-disposicion-compra__lateral">{lateral}</div> : null}
    </div>
  );
}
