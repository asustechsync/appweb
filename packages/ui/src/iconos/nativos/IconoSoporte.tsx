// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/contacto/soporte.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

/** Auriculares de atencion al cliente. El encuadre esta cerrado sobre el dibujo para que llene el cuadro como los iconos de la carpeta (~21 de 24). */
export function IconoSoporte({ tamano = 20, color }: PropsIconoNativo) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="1.95 2.2 20.1 20.1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(color ? { color } : {})}
    >
      <Path d="M4.5 13v-1.5a7.5 7.5 0 0 1 15 0V13" />
      <Path d="M4.5 13h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-4ZM19.5 13h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4Z" />
      <Path d="M19.5 17v.5a3 3 0 0 1-3 3H13" />
    </Svg>
  );
}
