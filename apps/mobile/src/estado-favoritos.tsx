import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

/**
 * Favoritos en el celular: solo los slugs, el ultimo agregado primero.
 *
 * No hay tabla de favoritos en la base, y la web tampoco los tiene: viven en
 * el telefono. Precio, foto y stock se piden al servidor al abrir la pestaña
 * (`catalogo.productos`), asi un favorito de hace un mes no muestra cifras viejas.
 */

const LLAVE = "appweb:favoritos";
/** Tope de la lista: coincide con lo que acepta `catalogo.productos`. */
const MAXIMO = 100;

interface ValorFavoritos {
  slugs: string[];
  esFavorito: (slug: string) => boolean;
  alternar: (slug: string) => void;
}

const ContextoFavoritos = createContext<ValorFavoritos | null>(null);

export function ProveedorFavoritos({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(LLAVE)
      .then((guardado) => {
        const lista: unknown = guardado ? JSON.parse(guardado) : [];
        if (Array.isArray(lista)) {
          setSlugs(lista.filter((s): s is string => typeof s === "string").slice(0, MAXIMO));
        }
      })
      // Guardado corrupto o inaccesible: se arranca sin favoritos.
      .catch(() => {});
  }, []);

  function alternar(slug: string) {
    setSlugs((actuales) => {
      const siguientes = actuales.includes(slug)
        ? actuales.filter((s) => s !== slug)
        : [slug, ...actuales].slice(0, MAXIMO);
      AsyncStorage.setItem(LLAVE, JSON.stringify(siguientes)).catch(() => {});
      return siguientes;
    });
  }

  const valor: ValorFavoritos = {
    slugs,
    esFavorito: (slug) => slugs.includes(slug),
    alternar,
  };

  return <ContextoFavoritos.Provider value={valor}>{children}</ContextoFavoritos.Provider>;
}

export function useFavoritos(): ValorFavoritos {
  const valor = useContext(ContextoFavoritos);
  if (!valor) throw new Error("useFavoritos necesita <ProveedorFavoritos> arriba.");
  return valor;
}
