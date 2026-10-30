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
      fill="currentColor"
      {...(color ? { color } : {})}
    >
      <Path d="M9 16.17L5.53 12.7a1 1 0 0 0-1.41 1.41l4.18 4.18a1 1 0 0 0 1.41 0L20.3 7.7a1 1 0 0 0-1.41-1.41L9 16.17Z" />
    </Svg>
  );
}
