// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/interfaz/papelera.svg
import Svg, { Ellipse, Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoPapelera({ tamano = 16, color }: PropsIconoNativo) {
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
      <Path d="m3 4l2.303 14.077a4 4 0 0 0 2.738 3.166l.328.104a12 12 0 0 0 7.262 0l.328-.104a4 4 0 0 0 2.738-3.166L21 4" />
      <Ellipse cx="12" cy="4" rx="9" ry="2" />
    </Svg>
  );
}
