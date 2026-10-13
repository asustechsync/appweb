"use client";

import { useEffect, useState } from "react";

import { BarraMovil, type PropsBarraMovil } from "@appweb/ui";

import { CARRITO_EVENTO, CARRITO_LLAVE, leerCarrito } from "@/lib/carrito-local";

/**
 * Isla cliente: `BarraMovil` con el contador de unidades del carrito, que vive
 * en localStorage. Arranca en 0 (lo mismo que el servidor) y se corrige al
 * montar, asi la pagina sigue siendo estatica.
 */
export function BarraMovilCarrito(props: Omit<PropsBarraMovil, "cantidadAccion">) {
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    function contar() {
      setCantidad(leerCarrito().reduce((total, linea) => total + linea.cantidad, 0));
    }
    function alCambiarAlmacen(evento: StorageEvent) {
      if (evento.key === CARRITO_LLAVE) contar();
    }

    contar();
    // Mismo evento que dispara el boton de la ficha al agregar; `storage`
    // cubre los cambios hechos desde otra pestaña.
    window.addEventListener(CARRITO_EVENTO, contar);
    window.addEventListener("storage", alCambiarAlmacen);
    return () => {
      window.removeEventListener(CARRITO_EVENTO, contar);
      window.removeEventListener("storage", alCambiarAlmacen);
    };
  }, []);

  return <BarraMovil {...props} cantidadAccion={cantidad} />;
}
