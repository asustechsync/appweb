// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/comercio/devolucion.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoDevolucion({ tamano = 16, color }: PropsIconoNativo) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...(color ? { color } : {})}
    >
      <Path d="M9.53 3.47a.75.75 0 0 1 0 1.06L6.81 7.25H15a6.75 6.75 0 0 1 0 13.5H9a.75.75 0 0 1 0-1.5h6a5.25 5.25 0 0 0 0-10.5H6.81l2.72 2.72a.75.75 0 1 1-1.06 1.06l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 0 1 1.06 0Z" />
    </Svg>
  );
}
