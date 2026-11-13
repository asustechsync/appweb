import "./momentos-tendencia.css";

export interface DatoMomento {
  /** Que dato es: sirve de clave. */
  tipo: "pico" | "actividad";
  /** Pregunta corta que responde la cifra: "Mejor momento", "Horas activas". */
  etiqueta: string;
  /** La cifra. */
  valor: string;
  /** Texto tenue junto a la cifra: "de 16". */
  sufijo?: string;
  /** Pildora de apoyo a la derecha; lleva el color del tono. */
  apoyo: string;
  /** Color del apoyo: sube en verde, baja en rojo, suave si no cambia. */
  tono?: "sube" | "baja" | "igual";
  /** Columnas: una por hora o tramo, tan altas como su valor. */
  barras?: number[];
  /** Posicion de la columna resaltada (el pico). Sin ella, ninguna. */
  destacada?: number | undefined;
  /** Columnas: una por hora o tramo, llena si hubo actividad. */
  puntos?: boolean[];
}

interface Columna {
  /** Alto en porcentaje de la franja. */
  alto: number;
  /** Va en color fuerte: el pico o un tramo activo. */
  fuerte: boolean;
}

/** Mas columnas que esto ya no se distinguen: se agrupan sumando vecinas. */
const MAX_COLUMNAS = 24;

function columnasDeBarras(barras: number[], destacada: number | undefined): Columna[] {
  const grupo = Math.max(1, Math.ceil(barras.length / MAX_COLUMNAS));
  const valores: number[] = [];
  for (let i = 0; i < barras.length; i += grupo) {
    valores.push(barras.slice(i, i + grupo).reduce((suma, valor) => suma + valor, 0));
  }
  const marcada = destacada === undefined ? undefined : Math.floor(destacada / grupo);
  const maximo = Math.max(...valores, 1);
  return valores.map((valor, indice) => ({
    alto: Math.round(15 + (valor / maximo) * 85),
    fuerte: indice === marcada,
  }));
}

function Columnas({ columnas }: { columnas: Columna[] }) {
  return (
    <div className="ui-momentos-tendencia__columnas" aria-hidden="true">
      {columnas.map((columna, indice) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: la posicion es la identidad de la columna
          key={indice}
          className={`ui-momentos-tendencia__columna${columna.fuerte ? " ui-momentos-tendencia__columna--fuerte" : ""}`}
          // El alto depende del dato: es la unica medida que no puede ir en el CSS.
          style={{ blockSize: `${columna.alto}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Dos tarjetas bajo la grafica: arriba la pregunta y la cifra con una pildora de
 * apoyo a la derecha; abajo, a todo el ancho, una columna por hora o tramo.
 */
export function MomentosTendencia({ datos }: { datos: DatoMomento[] }) {
  if (datos.length === 0) return null;
  return (
    <div className="ui-momentos-tendencia" role="group" aria-label="Resumen del periodo">
      {datos.map((dato) => {
        const columnas = dato.barras?.length
          ? columnasDeBarras(dato.barras, dato.destacada)
          : [];
        if (dato.puntos?.length) {
          const activos = dato.puntos.filter(Boolean).length;
          const parte = Math.round((activos / dato.puntos.length) * 100);
          return (
            <div
              key={dato.tipo}
              className={`ui-momentos-tendencia__dato ui-momentos-tendencia__dato--${dato.tono ?? "igual"}`}
            >
              <span className="ui-momentos-tendencia__etiqueta">{dato.etiqueta}</span>
              <div className="ui-momentos-tendencia__cifra ui-momentos-tendencia__cifra--grande">
                <strong className="ui-momentos-tendencia__valor">{dato.valor}</strong>
                {dato.sufijo ? (
                  <span className="ui-momentos-tendencia__sufijo">{dato.sufijo}</span>
                ) : null}
                <span className="ui-momentos-tendencia__apoyo-texto">{dato.apoyo}</span>
              </div>
              <div className="ui-momentos-tendencia__segmentos" aria-hidden="true">
                {dato.puntos.map((lleno, indice) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: la posicion es la identidad del segmento
                    key={indice}
                    className={`ui-momentos-tendencia__segmento${lleno ? " ui-momentos-tendencia__segmento--lleno" : ""}`}
                  />
                ))}
              </div>
              <div className="ui-momentos-tendencia__progreso" aria-hidden="true">
                {/* El ancho depende del dato: es la unica medida que no puede ir en el CSS. */}
                <span className="ui-momentos-tendencia__progreso-lleno" style={{ inlineSize: `${parte}%` }} />
              </div>
            </div>
          );
        }
        return (
          <div
            key={dato.tipo}
            className={`ui-momentos-tendencia__dato ui-momentos-tendencia__dato--${dato.tono ?? "igual"}`}
          >
            <div className="ui-momentos-tendencia__cabecera">
              <div className="ui-momentos-tendencia__texto">
                <span className="ui-momentos-tendencia__etiqueta">{dato.etiqueta}</span>
                <div className="ui-momentos-tendencia__cifra">
                  <strong className="ui-momentos-tendencia__valor">{dato.valor}</strong>
                  {dato.sufijo ? (
                    <span className="ui-momentos-tendencia__sufijo">{dato.sufijo}</span>
                  ) : null}
                </div>
              </div>
              <span className="ui-momentos-tendencia__apoyo">{dato.apoyo}</span>
            </div>
            {columnas.length > 0 ? <Columnas columnas={columnas} /> : null}
          </div>
        );
      })}
    </div>
  );
}
