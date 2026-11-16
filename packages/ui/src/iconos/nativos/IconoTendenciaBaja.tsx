// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/navegacion/tendencia-baja.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoTendenciaBaja({ tamano = 20, color }: PropsIconoNativo) {
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
      <Path d="M16 17h6v-6" />
      <Path d="m22 17-8.5-8.5-5 5L2 7" />
    </Svg>
  );
}
