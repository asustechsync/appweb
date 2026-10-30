import { TRPCClientError } from "@trpc/client";
import * as AlmacenSeguro from "expo-secure-store";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { api, usarToken } from "./api";

/**
 * La sesion en el celular.
 *
 * El token firmado que devuelve `acceso.ingresar` se guarda en el almacen
 * seguro del sistema (Keychain en iPhone, Keystore en Android), nunca en
 * AsyncStorage. Al abrir la app se pregunta al servidor si sigue valido: si
 * responde que no (vencido o de una clave cambiada) se descarta. Sin conexion
 * se conserva: no se cierra la sesion de nadie por entrar a un ascensor.
 */

const LLAVE = "appweb_sesion";

export interface SesionApp {
  nombre: string;
  rol: string;
}

type SesionGuardada = SesionApp & { token: string };

interface ValorSesion {
  /** `undefined` mientras se lee el almacen al abrir la app. */
  sesion: SesionApp | null | undefined;
  abrir: (datos: SesionGuardada) => Promise<void>;
  cerrar: () => Promise<void>;
  /** Pone el nombre nuevo en la sesion y en el almacen, sin pedir otro token. */
  cambiarNombre: (nombre: string) => Promise<void>;
}

const ContextoSesion = createContext<ValorSesion | null>(null);

function leerGuardada(texto: string | null): SesionGuardada | null {
  if (!texto) return null;
  try {
    const datos = JSON.parse(texto) as Partial<SesionGuardada>;
    return typeof datos.token === "string" && typeof datos.nombre === "string"
      ? { token: datos.token, nombre: datos.nombre, rol: String(datos.rol ?? "") }
      : null;
  } catch {
    return null;
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionApp | null | undefined>(undefined);

  async function cerrar() {
    usarToken(null);
    await AlmacenSeguro.deleteItemAsync(LLAVE).catch(() => {});
    setSesion(null);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: solo al abrir la app
  useEffect(() => {
    async function recuperar() {
      const guardada = leerGuardada(await AlmacenSeguro.getItemAsync(LLAVE).catch(() => null));
      if (!guardada) {
        setSesion(null);
        return;
      }
      usarToken(guardada.token);
      setSesion({ nombre: guardada.nombre, rol: guardada.rol });
      try {
        setSesion(await api.acceso.sesion.query());
      } catch (error) {
        if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
          await cerrar();
        }
      }
    }
    recuperar();
  }, []);

  async function abrir(datos: SesionGuardada) {
    await AlmacenSeguro.setItemAsync(LLAVE, JSON.stringify(datos));
    usarToken(datos.token);
    setSesion({ nombre: datos.nombre, rol: datos.rol });
  }

  async function cambiarNombre(nombre: string) {
    setSesion((actual) => (actual ? { ...actual, nombre } : actual));
    const guardada = leerGuardada(await AlmacenSeguro.getItemAsync(LLAVE).catch(() => null));
    if (guardada) {
      await AlmacenSeguro.setItemAsync(LLAVE, JSON.stringify({ ...guardada, nombre })).catch(
        () => {},
      );
    }
  }

  return (
    <ContextoSesion.Provider value={{ sesion, abrir, cerrar, cambiarNombre }}>
      {children}
    </ContextoSesion.Provider>
  );
}

export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion);
  if (!valor) throw new Error("useSesion necesita <ProveedorSesion> arriba.");
  return valor;
}
