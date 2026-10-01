"use client";

import { useEffect, useState } from "react";

import { buscarCupon, type Cupon } from "@appweb/core";

import { guardarCupon, leerCupon } from "./carrito-local";

/**
 * Estado del cupon compartido por carrito y checkout: lo que se escribe, el
 * aviso de error y el cupon aplicado (guardado en el navegador para que el
 * checkout lo recuerde). Si un cupon es valido lo decide `buscarCupon` de
 * @appweb/core; esto solo conecta esa regla con la pantalla.
 */
export function usarCupon() {
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [aplicado, setAplicado] = useState<Cupon | null>(null);

  useEffect(() => {
    setAplicado(buscarCupon(leerCupon()));
  }, []);

  function cambiar(valor: string) {
    setTexto(valor);
    setAviso(null);
  }

  function aplicar() {
    const cupon = buscarCupon(texto);
    if (!cupon) {
      setAviso("El código promocional no es válido.");
      return;
    }
    guardarCupon(cupon.codigo);
    setAplicado(cupon);
    setTexto("");
    setAviso(null);
  }

  function quitar() {
    guardarCupon(null);
    setAplicado(null);
  }

  return { texto, aviso, aplicado, cambiar, aplicar, quitar };
}
