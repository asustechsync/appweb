/** "escritorio": la etiqueta se ve en movil y se oculta desde 48rem. */
export type EtiquetaOculta = boolean | "escritorio";

export function claseEtiquetaOculta(oculta: EtiquetaOculta | undefined): string | undefined {
  if (oculta === "escritorio") return "ui-solo-lectores-escritorio";
  return oculta ? "ui-solo-lectores" : undefined;
}
