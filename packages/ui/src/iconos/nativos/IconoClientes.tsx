// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/cuenta/clientes.svg
import Svg, { Circle, Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoClientes({ tamano = 20, color }: PropsIconoNativo) {
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
      <Path d="M18 21a8 8 0 0 0-16 0" />
      <Circle cx="10" cy="8" r="5" />
      <Path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </Svg>
  );
}
