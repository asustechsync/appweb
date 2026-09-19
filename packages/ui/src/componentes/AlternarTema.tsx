"use client";

import { useEffect, useState } from "react";

import { IconoLuna, IconoSol } from "../iconos";
import { TEMA_LLAVE, type Tema } from "../tema";

import "./primitivos.css";

function temaVigente(): Tema {
  const explicito = document.documentElement.dataset["tema"];
  if (explicito === "claro" || explicito === "oscuro") return explicito;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

/**
 * Boton para alternar entre modo claro y oscuro.
 *
 * Independiente de AccionesCuenta a proposito: no es una accion de cuenta,
 * es una preferencia visual que podria vivir en el footer o en el panel
 * admin igual que aqui.
 *
 * `null` hasta montar: el servidor y el primer render del cliente coinciden
 * (icono vacio) y no hay aviso de hidratacion.
 */
export function AlternarTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(temaVigente());
  }, []);

  function alternar() {
    const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset["tema"] = siguiente;
    try {
      localStorage.setItem(TEMA_LLAVE, siguiente);
    } catch {
      /* almacenamiento no disponible: el cambio dura lo que dure la pestaña */
    }
    setTema(siguiente);
  }

  const esOscuro = tema === "oscuro";

  return (
    <button
      type="button"
      className="ui-alternar-tema"
      onClick={alternar}
      aria-label={esOscuro ? "Activar modo claro" : "Activar modo oscuro"}
      title={esOscuro ? "Modo claro" : "Modo oscuro"}
    >
      {tema === null ? null : esOscuro ? <IconoSol /> : <IconoLuna />}
    </button>
  );
}
