import { ImageResponse } from "next/og";

import { SIMBOLO_LOGO } from "@appweb/ui/marca";
import { tokens } from "@appweb/ui/tokens";

/** Icono de "agregar a inicio" en iPhone: fondo solido, iOS no respeta transparencias. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconoApple() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: tokens.color.fondo,
      }}
    >
      <svg
        aria-hidden="true"
        width="120"
        height="120"
        viewBox={SIMBOLO_LOGO.viewBox}
        fill={tokens.color.logo}
      >
        <path fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
      </svg>
    </div>,
    size,
  );
}
