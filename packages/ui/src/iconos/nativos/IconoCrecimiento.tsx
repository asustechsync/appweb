// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/comercio/crecimiento.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

/** Barras con una linea que sube: el modulo de marketing del panel. */
export function IconoCrecimiento({ tamano = 24, color }: PropsIconoNativo) {
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
      <Path d="M12 16v5" />
      <Path d="M16 14.639V21" />
      <Path d="M20 10.656V21" />
      <Path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
      <Path d="M4 18.463V21" />
      <Path d="M8 14.656V21" />
    </Svg>
  );
}
