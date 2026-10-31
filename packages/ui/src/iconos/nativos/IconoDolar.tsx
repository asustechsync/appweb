// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/comercio/dolar.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

/** Signo de dolar: el modulo de ventas del panel. */
export function IconoDolar({ tamano = 24, color }: PropsIconoNativo) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(color ? { color } : {})}
    >
      <Path d="M12 3v18" />
      <Path d="M17 5H9.5a1 1 0 0 0 0 7h5a1 1 0 0 1 0 7H6" />
    </Svg>
  );
}
