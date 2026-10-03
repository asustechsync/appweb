import type { PropsIcono } from "../tipos";

/** Convertido de favorite.svg: fill:#fff -> currentColor. */
export function IconoFavorito({ tamano = 16, className }: PropsIcono) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.07,22.75c-0.51,0 -1.07,-0.15 -1.61,-0.46l-4.88,-2.71c-0.29,-0.16 -0.86,-0.16 -1.15,0l-4.88,2.71c-0.99,0.55 -2,0.61 -2.77,0.15c-0.77,-0.45 -1.21,-1.36 -1.21,-2.49l0,-14.09c0,-2.54 2.07,-4.61 4.61,-4.61l9.65,0c2.54,0 4.61,2.07 4.61,4.61l0,14.09c0,1.13 -0.44,2.04 -1.21,2.49c-0.35,0.21 -0.75,0.31 -1.16,0.31Zm-7.07,-4.79c0.47,0 0.93,0.1 1.3,0.31l4.88,2.71c0.51,0.29 0.98,0.35 1.28,0.17c0.3,-0.18 0.47,-0.61 0.47,-1.2l0,-14.09c0,-1.71 -1.4,-3.11 -3.11,-3.11l-9.64,0c-1.71,0 -3.11,1.4 -3.11,3.11l0,14.09c0,0.59 0.17,1.03 0.47,1.2c0.3,0.17 0.77,0.12 1.28,-0.17l4.88,-2.71c0.37,-0.21 0.83,-0.31 1.3,-0.31Z" />
    </svg>
  );
}
