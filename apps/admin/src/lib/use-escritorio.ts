import { useEffect, useState } from "react";

/** Desde este ancho el panel muestra el bloque de al lado de las listas (`lg`, 1024 px). */
const ESCRITORIO = "(min-width: 64rem)";

/** `true` cuando la pantalla es de escritorio. En el servidor y al montar, `false`. */
export function useEscritorio(): boolean {
  const [escritorio, setEscritorio] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia(ESCRITORIO);
    setEscritorio(consulta.matches);
    function alCambiar(evento: MediaQueryListEvent) {
      setEscritorio(evento.matches);
    }
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return escritorio;
}
