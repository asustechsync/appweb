import { describe, expect, it } from "vitest";

import { IMAGEN_DEMO } from "./gestion";
import { esImagenDemo, MAX_BYTES_IMAGEN, revisarImagen, rutaDeImagen, urlDeFoto } from "./imagenes";

describe("fotos de producto", () => {
  it("acepta JPG, PNG y WEBP de hasta 5 MB", () => {
    expect(revisarImagen({ tipo: "image/webp", bytes: 1000, yaTiene: 0 })).toBeNull();
    expect(revisarImagen({ tipo: "image/jpeg", bytes: MAX_BYTES_IMAGEN, yaTiene: 7 })).toBeNull();
  });

  it("rechaza otros formatos, archivos vacios, pesados o de mas", () => {
    expect(revisarImagen({ tipo: "image/gif", bytes: 1000, yaTiene: 0 })).toBe("tipo");
    expect(revisarImagen({ tipo: "application/pdf", bytes: 1000, yaTiene: 0 })).toBe("tipo");
    expect(revisarImagen({ tipo: "image/png", bytes: 0, yaTiene: 0 })).toBe("vacia");
    expect(revisarImagen({ tipo: "image/png", bytes: MAX_BYTES_IMAGEN + 1, yaTiene: 0 })).toBe(
      "tamano",
    );
    expect(revisarImagen({ tipo: "image/png", bytes: 1000, yaTiene: 8 })).toBe("demasiadas");
  });

  it("guarda cada foto en la carpeta de su producto con la extension del tipo", () => {
    expect(rutaDeImagen("boxer-clasico", "image/jpeg", "abc")).toBe(
      "productos/boxer-clasico/abc.jpg",
    );
  });

  it("reconoce la imagen de relleno", () => {
    expect(esImagenDemo(IMAGEN_DEMO)).toBe(true);
    expect(esImagenDemo("https://x.supabase.co/storage/v1/object/public/a.webp")).toBe(false);
  });

  it("muestra la foto de relleno; solo lo vacio sale como sin foto", () => {
    expect(urlDeFoto(IMAGEN_DEMO)).toBe(IMAGEN_DEMO);
    expect(urlDeFoto(null)).toBe("");
    expect(urlDeFoto("/subidas/productos/a/b.webp")).toBe("/subidas/productos/a/b.webp");
  });
});
