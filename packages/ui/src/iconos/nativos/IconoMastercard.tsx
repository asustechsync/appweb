// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/marcas/mastercard.svg
import Svg, { G, Path, Rect } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

/** Logo de Mastercard: conserva sus tres colores de marca, no hereda `currentColor`. */
export function IconoMastercard({ tamano = 24, color }: PropsIconoNativo) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...(color ? { color } : {})}>
      <G transform="matrix(0.023182,0,0,0.023182,-1.908975,2.72736)">
        <G transform="matrix(1.348054,0,0,1.348054,168.622693,133.333333)">
          <Rect x="224.833" y="42.298" width="190.416" height="311.005" fill="#FF5F00" />
          <Path
            fill="#EB001B"
            d="M244.446,197.828C244.398,137.19 272.286,79.792 319.986,42.353C285.144,14.971 242.091,0.078 197.778,0.078C89.28,0.078 0.001,89.358 0.001,197.855C0.001,306.352 89.28,395.632 197.778,395.632C242.091,395.632 285.144,380.739 319.986,353.357C272.271,315.906 244.381,258.484 244.446,197.827L244.446,197.828Z"
          />
          <Path
            fill="#F79E1B"
            d="M640,197.828C639.997,306.323 550.718,395.6 442.223,395.6C397.897,395.6 354.831,380.698 319.985,353.302C367.664,315.831 395.554,258.441 395.554,197.8C395.554,137.159 367.664,79.769 319.985,42.298C354.831,14.902 397.897,-0 442.223,-0C550.719,-0 639.998,89.277 640,197.773L640,197.828Z"
          />
        </G>
      </G>
    </Svg>
  );
}
