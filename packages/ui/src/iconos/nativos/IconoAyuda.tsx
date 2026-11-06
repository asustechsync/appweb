// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/interfaz/ayuda.svg
import Svg, { Circle, Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoAyuda({ tamano = 20, color }: PropsIconoNativo) {
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
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}
