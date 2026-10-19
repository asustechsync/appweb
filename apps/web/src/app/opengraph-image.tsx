import { ImageResponse } from "next/og";

import { NOMBRE_MARCA, SIMBOLO_LOGO } from "@appweb/ui/marca";
import { tokens } from "@appweb/ui/tokens";

/**
 * Imagen que se ve al compartir la tienda en WhatsApp, Facebook o Instagram.
 * Una sola para todo el sitio; la ficha de producto usa la foto del producto.
 */
export const alt = `${NOMBRE_MARCA} — boxers, medias y básicos`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagenParaCompartir() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        background: tokens.color.superficie,
        color: tokens.color.texto,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <svg
          aria-hidden="true"
          width="160"
          height="180"
          viewBox={SIMBOLO_LOGO.viewBox}
          fill={tokens.color.logo}
        >
          <path fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
        </svg>
        <div style={{ fontSize: 140, letterSpacing: 8, color: tokens.color.textoSuave }}>
          {NOMBRE_MARCA}
        </div>
      </div>
      <div style={{ fontSize: 44, color: tokens.color.textoSuave }}>
        Boxers, medias y básicos para todos los días
      </div>
    </div>,
    size,
  );
}
