import { IconoUbicacion } from "../iconos";

import "./estilos/ubicacion.css";

export interface PropsUbicacion {
  ciudad?: string;
  region?: string;
}

/** Ubicacion visible de la tienda. Por ahora es solo un mockup informativo. */
export function Ubicacion({ ciudad = "Tacna", region = "Tacna" }: PropsUbicacion) {
  return (
    <div className="ui-ubicacion" aria-label={`Ubicacion: ${ciudad}, ${region}`}>
      <IconoUbicacion tamano={18} />
      <span>{ciudad}, {region}</span>
    </div>
  );
}
