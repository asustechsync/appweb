import type { PropsIcono } from "./tipos";

export function IconoChevronAbajo({ tamano = 14, className }: PropsIcono) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 15.5a1 1 0 0 1-.71-.29l-5-5a1 1 0 1 1 1.42-1.42L12 13.09l4.29-4.3a1 1 0 1 1 1.42 1.42l-5 5a1 1 0 0 1-.71.29Z" />
    </svg>
  );
}
