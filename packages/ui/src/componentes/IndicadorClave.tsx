import "./primitivos.css";

export interface PropsIndicadorClave {
  requisitos: { id: string; texto: string; obligatorio: boolean; cumplido: boolean }[];
  /** Sin nada escrito no se pinta nada, para no dejar un hueco en el formulario. */
  vacia?: boolean;
}

const NIVELES = ["", "uno", "dos", "tres", "cuatro", "cinco"] as const;

/**
 * Barra de fortaleza: un tramo al escribir y otro por requisito cumplido (el ultimo es un extra) y una linea con lo
 * que falta. Con todo cumplido dice "Segura".
 */
export function IndicadorClave({ requisitos, vacia = false }: PropsIndicadorClave) {
  if (vacia) return null;

  // El primer tramo se enciende con solo escribir; cada obligatorio cumplido, en
  // cualquier orden, enciende uno mas. El extra solo suma con todos los obligatorios,
  // asi el verde exige los tres.
  const obligatorios = requisitos.filter((r) => r.obligatorio);
  const faltanObligatorios = obligatorios.filter((r) => !r.cumplido).length;
  const extraCumplido = requisitos.some((r) => !r.obligatorio && r.cumplido);
  const activos =
    1 + (obligatorios.length - faltanObligatorios) + (faltanObligatorios === 0 && extraCumplido ? 1 : 0);
  const nivel = NIVELES[Math.min(activos, NIVELES.length - 1)] ?? "";
  const faltan = requisitos.filter((r) => r.obligatorio && !r.cumplido).map((r) => r.texto.toLowerCase());

  return (
    <div className={`ui-indicador-clave ui-indicador-clave--${nivel || "vacia"}`}>
      <div className="ui-indicador-clave__barra" aria-hidden="true">
        {[null, ...requisitos].map((r, i) => (
          <span key={r?.id ?? "inicio"} className={i < activos ? "ui-indicador-clave__tramo ui-indicador-clave__tramo--activo" : "ui-indicador-clave__tramo"} />
        ))}
      </div>
      <p className="ui-indicador-clave__texto" aria-live="polite">
        {faltan.length > 0
          ? `Falta: ${faltan.join(", ")}`
          : extraCumplido
            ? "Muy segura"
            : "Segura"}
      </p>
    </div>
  );
}
