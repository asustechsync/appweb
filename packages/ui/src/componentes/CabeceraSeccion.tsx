import Link from "next/link";

import "./primitivos.css";

export interface PropsCabeceraSeccion {
  titulo: string;
  /** Si falta, no se muestra el enlace — evita apuntar a una ruta que no existe. */
  hrefVerTodo?: string;
  textoVerTodo?: string;
}

/** Cabecera de una seccion de la portada: titulo en capsula + "Ver todo". */
export function CabeceraSeccion({
  titulo,
  hrefVerTodo,
  textoVerTodo = "Ver todo",
}: PropsCabeceraSeccion) {
  return (
    <div className="ui-cabecera-seccion">
      <h2 className="ui-cabecera-seccion__titulo">{titulo}</h2>
      {hrefVerTodo ? (
        <Link className="ui-cabecera-seccion__ver-todo" href={hrefVerTodo}>
          {textoVerTodo}
        </Link>
      ) : null}
    </div>
  );
}
