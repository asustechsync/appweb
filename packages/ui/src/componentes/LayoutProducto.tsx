import type { ReactNode } from "react";

import "./estilos/layout-producto.css";

export interface PropsLayoutProducto {
  izquierda?: ReactNode;
  centro: ReactNode;
  derecha?: ReactNode;
  inferior?: ReactNode;
}

/**
 * Layout de dos/tres columnas con sección inferior.
 * Similar a: [izquierda] [centro/imagen] [derecha] / [inferior info]
 */
export function LayoutProducto({ izquierda, centro, derecha, inferior }: PropsLayoutProducto) {
  return (
    <div className="ui-layout-producto">
      <div className="ui-layout-producto__contenedor-principal">
        {izquierda && <aside className="ui-layout-producto__izquierda">{izquierda}</aside>}
        <main className="ui-layout-producto__centro">{centro}</main>
        {derecha && <aside className="ui-layout-producto__derecha">{derecha}</aside>}
      </div>
      {inferior && <section className="ui-layout-producto__inferior">{inferior}</section>}
    </div>
  );
}
