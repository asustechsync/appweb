import type { PropsIcono } from "../tipos";

/** Cubo de basura: borde ovalado, cuerpo que se angosta y una marca al fondo. Dibujado a partir de trash.svg. */
export function IconoPapelera({ tamano = 20, className }: PropsIcono) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="12" cy="5.5" rx="8.5" ry="2.5" />
      <path d="M3.5 5.5L6 19.5C6.25 20.5 7 21 8 21H16C17 21 17.75 20.5 18 19.5L20.5 5.5" />
      <path d="M10 17H14" />
    </svg>
  );
}
