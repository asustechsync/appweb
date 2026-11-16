// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/interfaz/marcar.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoMarcar({ tamano = 16, color }: PropsIconoNativo) {
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
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}
