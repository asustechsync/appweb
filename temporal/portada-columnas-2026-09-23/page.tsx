import { EscaparatePortada, Header } from "@appweb/ui";

/** CLASE A — portada. Layout con estructura de producto. */
export default function PaginaPortada() {
  return (
    <>
      <Header />
      <EscaparatePortada
        nombre="Boxer Botánico"
        subtitulo="Comodidad premium para todos los días"
        imagen="/producto.webp"
        categoria="Nueva colección"
        precio="S/ 39.90"
      />
    </>
  );
}
