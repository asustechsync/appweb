import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";

/** Cierra un desplegable al salir de el o pulsar Escape. */
export function usarCierreDesplegable(
  abierto: boolean,
  contenedorRef: RefObject<HTMLDivElement | null>,
  setAbierto: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!abierto) return;

    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto, contenedorRef, setAbierto]);
}
