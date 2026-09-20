"use client";

import Image from "next/image";
import { useState } from "react";

import "./primitivos.css";

export interface ImagenGaleria {
  url: string;
  alt: string;
}

export interface PropsGaleriaProducto {
  imagenes: ImagenGaleria[];
  /** Ya calculado por `resolverPrecio` de @appweb/core: aqui solo se pinta. */
  descuentoPct?: number | null;
  /** Insignia libre: "Nuevo", "Mas vendido". */
  etiqueta?: string | null;
}

/**
 * Isla cliente: la unica parte de la ficha que necesita estado. El resto del
 * marcado es estatico y se sirve cacheado.
 *
 * La imagen grande lleva `priority`: es el elemento mas grande de la pantalla
 * y decide el LCP de la ficha, asi que no debe cargarse en diferido.
 */
export function GaleriaProducto({ imagenes, descuentoPct, etiqueta }: PropsGaleriaProducto) {
  const [activa, setActiva] = useState(0);

  const principal = imagenes[activa] ?? imagenes[0];
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
        {descuentoPct ? (
          <span className="ui-galeria-producto__insignia">-{descuentoPct}%</span>
        ) : null}
        {etiqueta ? <span className="ui-galeria-producto__etiqueta">{etiqueta}</span> : null}
      </div>

      {imagenes.length > 1 ? (
        <ul className="ui-galeria-producto__miniaturas">
          {imagenes.map((imagen, indice) => (
            <li key={`${imagen.url}-${indice}`}>
              <button
                type="button"
                className={
                  indice === activa
                    ? "ui-galeria-producto__miniatura ui-galeria-producto__miniatura--activa"
                    : "ui-galeria-producto__miniatura"
                }
                onClick={() => setActiva(indice)}
                aria-label={`Ver imagen ${indice + 1} de ${imagenes.length}`}
                aria-current={indice === activa}
              >
                {/* alt vacio: el boton ya se anuncia con su aria-label, y
                    repetirlo haria que el lector lea la misma frase dos veces. */}
                <Image src={imagen.url} alt="" width={160} height={160} sizes="64px" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
