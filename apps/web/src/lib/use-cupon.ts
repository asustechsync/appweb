"use client";

import { useEffect, useRef, useState } from "react";

import type { Cupon } from "@appweb/core";

import { consultarCupon } from "./acciones-cupon";
import { guardarCupon, leerCupon } from "./carrito-local";

/**
 * Estado del cupon compartido por carrito y checkout: lo que se escribe, el
 * aviso y el cupon aplicado (el codigo se recuerda en el navegador para que
 * el checkout lo tenga).
 *
 * Si un cupon vale lo decide el servidor (`consultarCupon`, que lee la tabla
 * `cupones` y pregunta a `revisarCupon` de @appweb/core). Se vuelve a
 * preguntar cuando cambia el subtotal: un cupon con minimo de compra deja de
 * valer si el carrito baja de ese monto.
 */
export function useCupon(subtotal: number) {
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [aplicado, setAplicado] = useState<Cupon | null>(null);
  const [revisando, setRevisando] = useState(false);
  // El codigo recordado; se revisa contra el servidor con cada subtotal.
  const codigoGuardado = useRef<string | null>(null);

  useEffect(() => {
    codigoGuardado.current = leerCupon();
  }, []);

  useEffect(() => {
    const codigo = codigoGuardado.current;
    if (!codigo || subtotal <= 0) return;
    let vigente = true;
    void consultarCupon(codigo, subtotal).then((resultado) => {
      if (!vigente) return;
      if (resultado.ok) {
        setAplicado(resultado.cupon);
      } else {
        setAplicado(null);
        setAviso(resultado.error);
      }
    });
    return () => {
      vigente = false;
    };
  }, [subtotal]);

  function cambiar(valor: string) {
    setTexto(valor);
    setAviso(null);
  }

  async function aplicar() {
    if (texto.trim() === "") return;
    setRevisando(true);
    const resultado = await consultarCupon(texto, subtotal);
    setRevisando(false);
    if (!resultado.ok) {
      setAviso(resultado.error);
      return;
    }
    guardarCupon(resultado.cupon.codigo);
    codigoGuardado.current = resultado.cupon.codigo;
    setAplicado(resultado.cupon);
    setTexto("");
    setAviso(null);
  }

  function quitar() {
    guardarCupon(null);
    codigoGuardado.current = null;
    setAplicado(null);
    setAviso(null);
  }

  return { texto, aviso, aplicado, revisando, cambiar, aplicar, quitar };
}
