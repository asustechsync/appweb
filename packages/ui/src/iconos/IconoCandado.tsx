import type { PropsIcono } from "./tipos";

/** Candado, de trazo: hereda `currentColor`. */
export function IconoCandado({ tamano = 20, className }: PropsIcono) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M9 15.5h.01M12 15.5h.01M15 15.5h.01" />
    </svg>
  );
}
