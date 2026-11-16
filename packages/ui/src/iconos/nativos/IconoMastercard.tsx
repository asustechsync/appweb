// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/marcas/mastercard.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

/** Logo de Mastercard (isotipo): conserva sus tres colores de marca, no hereda `currentColor`. */
export function IconoMastercard({ tamano = 24, color }: PropsIconoNativo) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 -49 256 256" {...(color ? { color } : {})}>
      <Path fill="#ff5f00" d="M93.298 16.903h69.15v124.251h-69.15z" />
      <Path
        fill="#eb001b"
        d="M97.689 79.029c0-25.245 11.854-47.637 30.074-62.126C114.373 6.366 97.47 0 79.03 0C35.343 0 0 35.343 0 79.029s35.343 79.029 79.029 79.029c18.44 0 35.343-6.366 48.734-16.904c-18.22-14.269-30.074-36.88-30.074-62.125"
      />
      <Path
        fill="#f79e1b"
        d="M255.746 79.029c0 43.685-35.343 79.029-79.029 79.029c-18.44 0-35.343-6.366-48.734-16.904c18.44-14.488 30.075-36.88 30.075-62.125s-11.855-47.637-30.075-62.126C141.373 6.366 158.277 0 176.717 0c43.686 0 79.03 35.563 79.03 79.029"
      />
    </Svg>
  );
}
