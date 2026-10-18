import { useEffect, type RefObject } from "react";

/** Mantiene visible la opcion recorrida con las flechas. */
export function useOpcionVisible(
  listaRef: RefObject<HTMLUListElement | null>,
  indiceActivo: number,
  claveOpciones: string,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: claveOpciones vuelve a centrar la opcion cuando el filtro cambia la lista.
  useEffect(() => {
    const lista = listaRef.current;
    const opcion = lista?.children[indiceActivo];
    if (!lista || !(opcion instanceof HTMLElement)) return;

    const arriba =
      opcion.getBoundingClientRect().top - lista.getBoundingClientRect().top + lista.scrollTop;
    const abajo = arriba + opcion.offsetHeight;
    if (arriba < lista.scrollTop) lista.scrollTop = arriba;
    else if (abajo > lista.scrollTop + lista.clientHeight) {
      lista.scrollTop = abajo - lista.clientHeight;
    }
  }, [listaRef, indiceActivo, claveOpciones]);
}
