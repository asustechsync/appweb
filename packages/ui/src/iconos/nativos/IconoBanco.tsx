// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/comercio/banco.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoBanco({ tamano = 16, color }: PropsIconoNativo) {
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
      <Path d="M10 18v-7" />
      <Path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" />
      <Path d="M14 18v-7" />
      <Path d="M18 18v-7" />
      <Path d="M3 22h18" />
      <Path d="M6 18v-7" />
    </Svg>
  );
}
