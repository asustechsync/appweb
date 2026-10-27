import "./contadores-resumen.css";

export interface ContadorResumen {
  id: string;
  etiqueta: string;
  valor: number;
}

export interface PropsContadoresResumen {
  items: ContadorResumen[];
  /** Nombre accesible del grupo: "Que revisar". */
  etiqueta: string;
}

/** Cifras grandes del inicio del panel: solo informan, no se tocan. */
export function ContadoresResumen({ items, etiqueta }: PropsContadoresResumen) {
  return (
    <div className="ui-contadores-resumen" role="group" aria-label={etiqueta}>
      {items.map((item) => (
        <div key={item.id} className="ui-contadores-resumen__item">
          <span className="ui-contadores-resumen__valor">{item.valor}</span>
          <span className="ui-contadores-resumen__etiqueta">{item.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}
