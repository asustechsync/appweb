/** Props comunes a todos los iconos. `currentColor` hereda del texto del padre. */
export interface PropsIcono {
  tamano?: number;
  className?: string;
}

/** Props de los iconos de la app movil. Sin texto padre, el color se pasa. */
export interface PropsIconoNativo {
  tamano?: number;
  color?: string;
}
