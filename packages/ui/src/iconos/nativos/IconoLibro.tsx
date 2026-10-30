// GENERADO POR generar-iconos.ts — NO EDITAR A MANO. Corre: npm run ui:iconos
// Fuente: src/iconos/fuente/contacto/libro.svg
import Svg, { Path } from "react-native-svg";

import type { PropsIconoNativo } from "../tipos";

/** Libro abierto: Libro de Reclamaciones. Trazo como el de soporte; el encuadre cierra sobre el dibujo. */
export function IconoLibro({ tamano = 20, color }: PropsIconoNativo) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="1.4 2.4 21.2 21.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(color ? { color } : {})}
    >
      <Path d="M12 7.5v13" />
      <Path d="M12 7.5C10.5 5.9 8.2 5 5.5 5H3.5a1 1 0 0 0-1 1v11.5a1 1 0 0 0 1 1h2c2.7 0 5 .8 6.5 2.5" />
      <Path d="M12 7.5c1.5-1.6 3.8-2.5 6.5-2.5h2a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1h-2c-2.7 0-5 .8-6.5 2.5" />
    </Svg>
  );
}
