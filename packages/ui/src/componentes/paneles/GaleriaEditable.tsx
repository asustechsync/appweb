"use client";

import { Boton } from "../base/Boton";
import { Insignia } from "../base/Insignia";

import "../estilos.css";

export interface ImagenEditable {
  id: string;
  url: string;
  alt: string | null;
}

export interface PropsGaleriaEditable {
  imagenes: ImagenEditable[];
  onSubir: (archivos: File[]) => void;
  onQuitar: (id: string) => void;
  onPrincipal: (id: string) => void;
  /** Mientras sube o guarda: los botones se desactivan. */
  ocupado?: boolean;
  /** Tope de fotos: al llegar, desaparece el recuadro de agregar. */
  maximo: number;
  /** Tipos MIME aceptados por el selector de archivos. */
  aceptar: string;
}

/**
 * Fotos de un producto en el panel: la primera es la principal (la de la
 * tarjeta del catalogo), cada una se puede quitar o subir al primer lugar, y
 * el ultimo recuadro abre el selector de archivos. Base movil en dos columnas.
 *
 * `<img>` y no `next/image`: el panel no optimiza, solo muestra miniaturas, y
 * asi no depende de la lista de dominios permitidos de la tienda.
 */
export function GaleriaEditable({
  imagenes,
  onSubir,
  onQuitar,
  onPrincipal,
  ocupado = false,
  maximo,
  aceptar,
}: PropsGaleriaEditable) {
  return (
    <div className="ui-galeria-editable">
      {imagenes.map((imagen, posicion) => (
        <figure key={imagen.id} className="ui-galeria-editable__foto">
          {/* biome-ignore lint/performance/noImgElement: miniatura del panel, sin optimizar a proposito */}
          <img src={imagen.url} alt={imagen.alt ?? ""} loading="lazy" />
          <figcaption className="ui-galeria-editable__acciones">
            {posicion === 0 ? (
              <Insignia tono="exito">Principal</Insignia>
            ) : (
              <Boton
                variante="secundario"
                onClick={() => onPrincipal(imagen.id)}
                disabled={ocupado}
              >
                Hacer principal
              </Boton>
            )}
            <Boton variante="secundario" onClick={() => onQuitar(imagen.id)} disabled={ocupado}>
              Quitar
            </Boton>
          </figcaption>
        </figure>
      ))}
      {imagenes.length < maximo ? (
        <label className="ui-galeria-editable__agregar" aria-disabled={ocupado || undefined}>
          <input
            type="file"
            accept={aceptar}
            multiple
            disabled={ocupado}
            onChange={(evento) => {
              const archivos = [...(evento.target.files ?? [])];
              // Se limpia para que elegir otra vez el mismo archivo vuelva a disparar.
              evento.target.value = "";
              if (archivos.length > 0) onSubir(archivos);
            }}
          />
          <span>{ocupado ? "Subiendo…" : "+ Agregar fotos"}</span>
        </label>
      ) : null}
    </div>
  );
}
