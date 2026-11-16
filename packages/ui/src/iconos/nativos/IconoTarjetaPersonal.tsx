// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/cuenta/tarjeta-personal.svg
import Svg, { Circle, Path, Rect } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoTarjetaPersonal({ tamano = 20, color }: PropsIconoNativo) {
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
      <Path d="M13 19a4 4 0 00-8 0" />
      <Path d="M16 10h2" />
      <Path d="M16 14h2" />
      <Circle cx="9" cy="12" r="3" />
      <Rect x="2" y="5" width="20" height="14" rx="2" />
    </Svg>
  );
}
