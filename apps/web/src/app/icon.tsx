import { ImageResponse } from "next/og";

import { SIMBOLO_LOGO } from "@appweb/ui/marca";
import { tokens } from "@appweb/ui/tokens";

/** Favicon: el simbolo del logo en su verde, generado al compilar. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icono() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        aria-hidden="true"
        width="58"
        height="58"
        viewBox={SIMBOLO_LOGO.viewBox}
        fill={tokens.color.logo}
      >
        <path fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
      </svg>
    </div>,
    size,
  );
}
