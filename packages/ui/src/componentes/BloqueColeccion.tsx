import Image from "next/image";
import Link from "next/link";

import "./estilos/bloque-coleccion.css";

export interface PropsBloqueColeccion {
  etiqueta: string;
  titulo: string;
  texto: string;
  imagen: string;
  altImagen?: string;
  href: string;
}

/** Presenta una colección y enlaza a su catálogo. Todo el contenido llega por props. */
export function BloqueColeccion({ etiqueta, titulo, texto, imagen, altImagen = titulo, href }: PropsBloqueColeccion) {
  return (
    <Link className="ui-bloque-coleccion" href={href} aria-label={`${titulo}: ver colección`}>
      <span className="ui-bloque-coleccion__etiqueta">{etiqueta}</span>
      {imagen ? <Image className="ui-bloque-coleccion__imagen" src={imagen} alt={altImagen} width={480} height={240} sizes="(min-width: 64rem) 480px, 100vw" unoptimized /> : null}
      <span className="ui-bloque-coleccion__contenido">
        <h2 className="ui-bloque-coleccion__titulo">{titulo}</h2>
        <span className="ui-bloque-coleccion__texto">{texto}</span>
      </span>
    </Link>
  );
}
