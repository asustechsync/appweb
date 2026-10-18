import "../estilos.css";

export interface MigaDeRuta {
  nombre: string;
  /** Sin `href` es el tramo actual: se pinta como texto, no como enlace. */
  href?: string;
}

export interface PropsMigas {
  tramos: MigaDeRuta[];
}

/**
 * Migas de pan: la ruta corta que dice donde esta la pagina
 * (Inicio / Hombre / Jeans / Producto). El ultimo tramo es la pagina actual.
 */
export function Migas({ tramos }: PropsMigas) {
  return (
    <nav className="ui-migas" aria-label="Ruta de navegación">
      <ol className="ui-migas__lista">
        {tramos.map((tramo, indice) => {
          const actual = indice === tramos.length - 1;
          return (
            <li key={`${indice}-${tramo.nombre}`} className="ui-migas__item">
              {tramo.href && !actual ? (
                <a href={tramo.href} className="ui-migas__enlace">
                  {tramo.nombre}
                </a>
              ) : (
                <span className="ui-migas__actual" aria-current={actual ? "page" : undefined}>
                  {tramo.nombre}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
