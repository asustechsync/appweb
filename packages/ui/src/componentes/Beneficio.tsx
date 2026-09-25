export interface PropsBeneficio {
  etiqueta: string;
  titulo: string;
  detalle: string;
}

export function Beneficio({ etiqueta, titulo, detalle }: PropsBeneficio) {
  return (
    <article className="ui-escaparate__tarjeta-beneficio">
      <span>{etiqueta}</span>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}
