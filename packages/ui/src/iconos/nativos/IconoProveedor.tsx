// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/comercio/proveedor.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

export function IconoProveedor({ tamano = 16, color }: PropsIconoNativo) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...(color ? { color } : {})}
    >
      <Path d="M11.66 2.08a.75.75 0 0 1 .68 0l8.5 4.25a.75.75 0 0 1 .41.67v10a.75.75 0 0 1-.41.67l-8.5 4.25a.75.75 0 0 1-.68 0l-8.5-4.25A.75.75 0 0 1 2.75 17V7a.75.75 0 0 1 .41-.67l8.5-4.25ZM4.25 8.21v8.33l7 3.5v-8.33l-7-3.5Zm8.5 3.5v8.33l7-3.5V8.21l-7 3.5ZM18.82 7 12 3.59 9.43 4.88l6.82 3.41L18.82 7Zm-4.25 2.13L7.75 5.71 5.18 7 12 10.41l2.57-1.28Z" />
    </Svg>
  );
}
