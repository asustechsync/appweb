"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calcularTotales,
  cambiarCantidad,
  quitarDelCarrito,
  redondear,
  type LineaGuardada,
} from "@appweb/core";
import {
  Cargando,
  DisposicionCompra,
  EstadoVacio,
  IconoCarrito,
  LineaDeCarrito,
  ResumenCompra,
} from "@appweb/ui";

import { guardarCarrito, leerCarrito, CARRITO_EVENTO } from "@/lib/carrito-local";
import type { MetodoDeEnvio, VarianteDeCarrito } from "@/lib/consultas";

import { resolverLineasDelCarrito } from "./acciones";

export interface PropsCarritoCliente {
  /** Llegan del servidor ya cacheados: no dependen de que hay en el carrito. */
  metodos: MetodoDeEnvio[];
}

/**
 * Isla cliente del carrito.
 *
 * El carrito vive en localStorage, asi que el servidor no puede pintarlo: esta
 * isla lo lee al montar y pide al servidor los datos frescos de cada variante.
 * Precio y stock SIEMPRE vienen del servidor — lo guardado son solo ids y
 * cantidades.
 *
 * Los totales salen de `calcularTotales` de @appweb/core, la misma funcion que
 * cerrara el pedido: el total que se ve aqui es el que se cobrara.
 */
export function CarritoCliente({ metodos }: PropsCarritoCliente) {
  const [guardadas, setGuardadas] = useState<LineaGuardada[]>([]);
  const [variantes, setVariantes] = useState<VarianteDeCarrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [metodoId, setMetodoId] = useState<string | null>(metodos[0]?.id ?? null);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      const lineas = leerCarrito();

      if (lineas.length === 0) {
        if (vigente) {
          setGuardadas([]);
          setVariantes([]);
          setCargando(false);
        }
        return;
      }

      const resueltas = await resolverLineasDelCarrito(lineas.map((l) => l.varianteId));
      if (!vigente) return;

      // Lo que el servidor no devolvio ya no se vende: se cae del carrito
      // guardado en vez de quedar como una linea fantasma.
      const vivas = new Set(resueltas.map((v) => v.varianteId));
      const depuradas = lineas.filter((linea) => vivas.has(linea.varianteId));
      if (depuradas.length !== lineas.length) guardarCarrito(depuradas);

      setGuardadas(depuradas);
      setVariantes(resueltas);
      setCargando(false);
    }

    void cargar();

    // Otra isla de la misma pestaña (el boton de la ficha) pudo tocar el
    // carrito mientras esta pantalla estaba abierta.
    function recargar() {
      void cargar();
    }
    window.addEventListener(CARRITO_EVENTO, recargar);
    return () => {
      vigente = false;
      window.removeEventListener(CARRITO_EVENTO, recargar);
    };
  }, []);

  /** Cruza lo guardado (cantidades) con lo del servidor (precio y stock). */
  const lineas = useMemo(
    () =>
      guardadas.flatMap((linea) => {
        const variante = variantes.find((v) => v.varianteId === linea.varianteId);
        if (variante === undefined) return [];
        return [{ ...variante, cantidad: linea.cantidad }];
      }),
    [guardadas, variantes],
  );

  const metodoElegido = metodos.find((metodo) => metodo.id === metodoId) ?? null;

  const totales = useMemo(
    () =>
      calcularTotales(
        lineas.map((linea) => ({
          varianteId: linea.varianteId,
          precioUnitario: linea.precio,
          cantidad: linea.cantidad,
          stock: linea.stock,
        })),
        metodoElegido
          ? {
              metodoEnvio: {
                costo: metodoElegido.costo,
                gratisDesde: metodoElegido.gratisDesde,
              },
            }
          : {},
      ),
    [lineas, metodoElegido],
  );

  function aplicar(siguientes: LineaGuardada[]) {
    setGuardadas(siguientes);
    guardarCarrito(siguientes);
  }

  if (cargando) {
    return (
      <DisposicionCompra titulo="Carrito">
        <Cargando texto="Cargando tu carrito…" />
      </DisposicionCompra>
    );
  }

  if (lineas.length === 0) {
    return (
      <DisposicionCompra titulo="Carrito">
        <EstadoVacio
          icono={<IconoCarrito tamano={28} />}
          titulo="Tu carrito está vacío"
          texto="Cuando añadas productos los verás aquí, con su talla, color y precio."
          textoAccion="Ver productos"
          hrefAccion="/"
        />
      </DisposicionCompra>
    );
  }

  const bloqueo =
    totales.lineasSinStock.length > 0
      ? "Ajusta las cantidades marcadas para continuar."
      : null;

  return (
    <DisposicionCompra
      titulo="Carrito"
      subtitulo={`${totales.unidades} ${totales.unidades === 1 ? "unidad" : "unidades"} · ${lineas.length} ${lineas.length === 1 ? "producto" : "productos"}`}
      lateral={
        <ResumenCompra
          unidades={totales.unidades}
          subtotal={totales.subtotal}
          descuento={totales.descuento}
          costoEnvio={totales.costoEnvio}
          total={totales.total}
          faltaEnvioGratis={totales.faltaEnvioGratis}
          metodos={metodos}
          metodoElegidoId={metodoId}
          onMetodo={setMetodoId}
          motivoBloqueo={bloqueo}
          hrefContinuar="/checkout"
        />
      }
    >
      {lineas.map((linea) => (
        <LineaDeCarrito
          key={linea.varianteId}
          nombre={linea.nombre}
          href={`/productos/${linea.slug}`}
          imagenUrl={linea.imagenUrl}
          talla={linea.talla}
          color={linea.color}
          precioUnitario={linea.precio}
          precioLista={linea.precioLista}
          cantidad={linea.cantidad}
          stock={linea.stock}
          total={redondear(linea.precio * linea.cantidad)}
          onCantidad={(cantidad) =>
            aplicar(cambiarCantidad(guardadas, linea.varianteId, cantidad))
          }
          onQuitar={() => aplicar(quitarDelCarrito(guardadas, linea.varianteId))}
        />
      ))}
    </DisposicionCompra>
  );
}
