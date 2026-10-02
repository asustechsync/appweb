import type { KeyboardEvent } from "react";

interface OpcionesDeNavegacion {
  evento: KeyboardEvent;
  abierto: boolean;
  cantidad: number;
  indiceActivo: number;
  abrir: () => void;
  activar: (indice: number) => void;
  elegir: (indice: number) => void;
}

/** Mantiene el foco en el disparador mientras recorre las opciones. */
export function navegarOpciones({
  evento,
  abierto,
  cantidad,
  indiceActivo,
  abrir,
  activar,
  elegir,
}: OpcionesDeNavegacion) {
  if (cantidad === 0) return;

  if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
    evento.preventDefault();
    if (!abierto) {
      abrir();
      return;
    }
    const paso = evento.key === "ArrowDown" ? 1 : -1;
    activar((indiceActivo + paso + cantidad) % cantidad);
  } else if (
    abierto &&
    (evento.key === "Enter" ||
      (evento.key === " " && evento.currentTarget instanceof HTMLButtonElement))
  ) {
    evento.preventDefault();
    elegir(indiceActivo);
  } else if (
    abierto &&
    (evento.key === "Home" || evento.key === "End") &&
    evento.currentTarget instanceof HTMLButtonElement
  ) {
    evento.preventDefault();
    activar(evento.key === "Home" ? 0 : cantidad - 1);
  }
}
