import type { ReactNode } from "react";

import "./solo-lectura.css";

/** Contenido de solo lectura dentro del lateral: no recibe clics ni foco. */
export function SoloLectura({ children }: { children: ReactNode }) {
  return (
    <div className="ui-solo-lectura" inert>
      {children}
    </div>
  );
}
