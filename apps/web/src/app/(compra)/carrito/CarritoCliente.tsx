"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calcularTotales,
  cambiarCantidad,
  quitarDelCarrito,
  quitarVariosDelCarrito,
  redondear,
  type LineaGuardada,
} from "@appweb/core";
import {
  BloqueLineas,
  CabeceraLineas,
  Cargando,
  CodigoPromocional,
  DisposicionCompra,
  EstadoVacio,
  IconoCarrito,
  IconoPapelera,
  LineaDeCarrito,
  ResumenCompra,
} from "@appweb/ui";

import {
  guardarCarrito,
  leerCarrito,
  CARRITO_EVENTO,
} from "@/lib/carrito-local";
import type { VarianteDeCarrito } from "@/lib/consultas";

import { resolverLineasDelCarrito } from "./acciones";

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
export function CarritoCliente() {
  const [guardadas, setGuardadas] = useState<LineaGuardada[]>([]);
  const [variantes, setVariantes] = useState<VarianteDeCarrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [avisoCodigo, setAvisoCodigo] = useState<string | null>(null);

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

      const resueltas = await resolverLineasDelCarrito(
        lineas.map((l) => l.varianteId),
      );
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
        const variante = variantes.find(
          (v) => v.varianteId === linea.varianteId,
        );
        if (variante === undefined) return [];
        return [{ ...variante, cantidad: linea.cantidad }];
      }),
    [guardadas, variantes],
  );

  const totales = useMemo(
    () =>
      calcularTotales(
        lineas.map((linea) => ({
          varianteId: linea.varianteId,
          precioUnitario: linea.precio,
          cantidad: linea.cantidad,
          stock: linea.stock,
        })),
        // Sin metodo de envio: el costo y la direccion se eligen en el checkout.
        {},
      ),
    [lineas],
  );

  function aplicar(siguientes: LineaGuardada[]) {
    setGuardadas(siguientes);
    guardarCarrito(siguientes);
    // Lo que ya no esta en el carrito deja de estar seleccionado.
    const vivas = new Set(siguientes.map((linea) => linea.varianteId));
    setSeleccion(
      (actual) => new Set([...actual].filter((id) => vivas.has(id))),
    );
  }

  function seleccionar(varianteId: string, marcar: boolean) {
    setSeleccion((actual) => {
      const siguiente = new Set(actual);
      if (marcar) siguiente.add(varianteId);
      else siguiente.delete(varianteId);
      return siguiente;
    });
  }

  if (cargando) {
    return (
      <DisposicionCompra titulo="Mi carrito" fuente="acceso">
        <Cargando texto="Cargando tu carrito…" />
      </DisposicionCompra>
    );
  }

  if (lineas.length === 0) {
    return (
      <DisposicionCompra titulo="Mi carrito" fuente="acceso">
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
      titulo="Mi carrito"
      fuente="acceso"
      accion={
        <button
          type="button"
          disabled={seleccion.size === 0}
          onClick={() =>
            aplicar(quitarVariosDelCarrito(guardadas, [...seleccion]))
          }
        >
          <IconoPapelera tamano={16} />
          Quitar{seleccion.size > 0 ? ` (${seleccion.size})` : ""}
        </button>
      }
      subtitulo={`${totales.unidades} ${totales.unidades === 1 ? "unidad" : "unidades"} · ${lineas.length} ${lineas.length === 1 ? "producto" : "productos"}`}
      lateral={
        <ResumenCompra
          unidades={totales.unidades}
          subtotal={totales.subtotal}
          descuento={totales.descuento}
          costoEnvio={totales.costoEnvio}
          total={totales.total}
          faltaEnvioGratis={totales.faltaEnvioGratis}
          codigo={
            <CodigoPromocional
              valor={codigo}
              onCambio={(valor) => {
                setCodigo(valor);
                setAvisoCodigo(null);
              }}
              // Aun no hay codigos en la tienda: se avisa en vez de aparentar que se aplico.
              onAplicar={() =>
                setAvisoCodigo(
                  "Los códigos promocionales aún no están disponibles.",
                )
              }
              mensaje={avisoCodigo}
            />
          }
          textoEnvioPendiente="Se calcula al pagar"
          motivoBloqueo={bloqueo}
          hrefContinuar="/checkout"
          textoContinuar="Continuar al pago"
          hrefSeguir="/"
        />
      }
    >
      <BloqueLineas>
        <CabeceraLineas
          todas={seleccion.size === lineas.length}
          algunas={seleccion.size > 0}
          onTodas={(marcar) =>
            setSeleccion(
              marcar
                ? new Set(lineas.map((linea) => linea.varianteId))
                : new Set(),
            )
          }
        />
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
            onQuitar={() =>
              aplicar(quitarDelCarrito(guardadas, linea.varianteId))
            }
            seleccionada={seleccion.has(linea.varianteId)}
            onSeleccionar={(marcar) => seleccionar(linea.varianteId, marcar)}
          />
        ))}
      </BloqueLineas>
    </DisposicionCompra>
  );
}
