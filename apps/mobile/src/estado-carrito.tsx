import {
  agregarAlCarrito,
  cambiarCantidad,
  type LineaGuardada,
  normalizarCarrito,
  quitarDelCarrito,
  unidadesEn,
} from "@appweb/core/carrito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

/**
 * El carrito en el celular.
 *
 * Solo el guardado vive aqui: como se modifica una linea es logica de negocio
 * y esta en `@appweb/core/carrito/guardado`, la misma que usa la web contra
 * localStorage. Se guarda lo minimo (varianteId y cantidad); precio y stock se
 * vuelven a pedir al servidor cada vez que se abre el carrito.
 */

const LLAVE = "appweb:carrito";

interface ValorCarrito {
  lineas: LineaGuardada[];
  unidades: number;
  agregar: (varianteId: string, cantidad: number) => void;
  cambiar: (varianteId: string, cantidad: number) => void;
  quitar: (varianteId: string) => void;
  /** Deja solo las variantes que el servidor aun reconoce. */
  conservar: (varianteIds: string[]) => void;
}

const ContextoCarrito = createContext<ValorCarrito | null>(null);

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaGuardada[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(LLAVE)
      .then((guardado) => {
        if (guardado) setLineas(normalizarCarrito(JSON.parse(guardado)));
      })
      // Guardado corrupto o inaccesible: se arranca con el carrito vacio.
      .catch(() => {});
  }, []);

  const aplicar = useCallback((cambio: (actuales: LineaGuardada[]) => LineaGuardada[]) => {
    setLineas((actuales) => {
      const siguientes = cambio(actuales);
      AsyncStorage.setItem(LLAVE, JSON.stringify(siguientes)).catch(() => {});
      return siguientes;
    });
  }, []);

  const valor: ValorCarrito = {
    lineas,
    unidades: unidadesEn(lineas),
    agregar: (varianteId, cantidad) => aplicar((l) => agregarAlCarrito(l, varianteId, cantidad)),
    cambiar: (varianteId, cantidad) => aplicar((l) => cambiarCantidad(l, varianteId, cantidad)),
    quitar: (varianteId) => aplicar((l) => quitarDelCarrito(l, varianteId)),
    conservar: (varianteIds) => {
      const vigentes = new Set(varianteIds);
      aplicar((l) => l.filter((linea) => vigentes.has(linea.varianteId)));
    },
  };

  return <ContextoCarrito.Provider value={valor}>{children}</ContextoCarrito.Provider>;
}

export function useCarrito(): ValorCarrito {
  const valor = useContext(ContextoCarrito);
  if (!valor) throw new Error("useCarrito necesita <ProveedorCarrito> arriba.");
  return valor;
}
