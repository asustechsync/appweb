// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/comercio/camion.svg
import Svg, { Circle, Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoCamion({ tamano = 20, color }: PropsIconoNativo) {
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
      <Path d="M2.75 5.75h11v10.5h-11z" />
      <Path d="M13.75 9.25h4l3.5 3.5v3.5h-7.5z" />
      <Circle cx="6.5" cy="17.75" r="1.75" />
      <Circle cx="17.5" cy="17.75" r="1.75" />
    </Svg>
  );
}
