import "./primitivos.css";

const FORMATO = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export interface PropsPrecio {
  valor: number;
  /** Precio tachado. Se omite si no hay oferta. */
  antes?: number | null;
  tamano?: "sm" | "md" | "lg";
}

/** No calcula nada: recibe las cifras ya resueltas por `resolverPrecio` de @appweb/core. */
export function Precio({ valor, antes, tamano = "md" }: PropsPrecio) {
  return (
    <span className={`ui-precio ui-precio--${tamano}`}>
      <span className="ui-precio__actual">{FORMATO.format(valor)}</span>
      {antes ? <span className="ui-precio__antes">{FORMATO.format(antes)}</span> : null}
    </span>
  );
}
