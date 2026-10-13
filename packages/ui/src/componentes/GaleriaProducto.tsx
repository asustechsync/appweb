import Image from "next/image";
import "./primitivos.css";

export interface ImagenGaleria {
  url: string;
  alt: string;
}

export interface PropsGaleriaProducto {
  imagenes: ImagenGaleria[];
}

/**
 * Imagen principal del producto, sin insignias ni miniaturas.
 *
 * La imagen grande lleva `priority`: es el elemento mas grande de la pantalla
 * y decide el LCP de la ficha, asi que no debe cargarse en diferido.
 */
export function GaleriaProducto({ imagenes }: PropsGaleriaProducto) {
  const principal = imagenes[0];
  if (principal === undefined) return null;

  return (
    <div className="ui-galeria-producto">
      <div className="ui-galeria-producto__principal">
        <Image
          src={principal.url}
          alt={principal.alt}
          width={800}
          height={800}
          /* Columna de ~660px menos su padding en escritorio; a pantalla
             completa por debajo de 64rem, donde la ficha es de una columna. */
          sizes="(min-width: 64rem) 640px, 100vw"
          priority
        />
      </div>
    </div>
  );
}
