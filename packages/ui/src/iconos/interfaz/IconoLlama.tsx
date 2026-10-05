import type { PropsIcono } from "../tipos";

/** Llama de contorno: trazo redondeado, `currentColor` hereda del texto del padre. */
export function IconoLlama({ tamano = 16, className }: PropsIcono) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M13 3C13.5 6.5 17.5 8.5 17.5 13.6C17.5 17.2 15.1 20.5 11.7 20.5C8.3 20.5 6 17.8 6 14.4C6 12.4 6.8 10.9 7.9 9.7C8.2 11.2 8.9 12 9.8 12.3C9.3 9 10.4 5.3 13 3Z" />
    </svg>
  );
}
