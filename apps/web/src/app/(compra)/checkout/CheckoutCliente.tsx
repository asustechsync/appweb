"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { calcularTotales, type LineaGuardada } from "@appweb/core";
import type { MedioPago } from "@appweb/core/puertos";
import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  DisposicionCompra,
  EstadoVacio,
  Formulario,
  IconoCarrito,
  ResumenCompra,
  SeccionCheckout,
  TarjetaSeleccionable,
} from "@appweb/ui";

import { guardarCarrito, leerCarrito, CARRITO_EVENTO } from "@/lib/carrito-local";
import type { DireccionDeUsuario } from "@/lib/consultas-privadas";
import type { MetodoDeEnvio, VarianteDeCarrito } from "@/lib/consultas";

import { resolverLineasDelCarrito } from "../carrito/acciones";
import { agregarDireccion, crearPedido, sesionYDireccionesCheckout } from "./acciones";

export interface PropsCheckoutCliente {
  metodos: MetodoDeEnvio[];
  mediosDePago: { valor: MedioPago; etiqueta: string; descripcion: string }[];
}

export function CheckoutCliente({ metodos, mediosDePago }: PropsCheckoutCliente) {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [guardadas, setGuardadas] = useState<LineaGuardada[]>([]);
  const [variantes, setVariantes] = useState<VarianteDeCarrito[]>([]);
  const [sesion, setSesion] = useState<{ nombre: string } | null>(null);
  const [direcciones, setDirecciones] = useState<DireccionDeUsuario[]>([]);

  const [direccionId, setDireccionId] = useState<string | null>(null);
  const [nuevaDireccion, setNuevaDireccion] = useState(false);
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [calle, setCalle] = useState("");
  const [referencia, setReferencia] = useState("");
  const [guardandoDireccion, setGuardandoDireccion] = useState(false);

  const [metodoId, setMetodoId] = useState<string | null>(metodos[0]?.id ?? null);
  const [comprobante, setComprobante] = useState<"boleta" | "factura">("boleta");
  const [documento, setDocumento] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | null>(mediosDePago[0]?.valor ?? null);

  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      const lineasGuardadas = leerCarrito();
      const [resueltas, datosSesion] = await Promise.all([
        lineasGuardadas.length > 0
          ? resolverLineasDelCarrito(lineasGuardadas.map((l) => l.varianteId))
          : Promise.resolve([]),
        sesionYDireccionesCheckout(),
      ]);

      if (!vigente) return;

      if (!datosSesion.sesion) {
        router.push("/ingresar?next=/checkout");
        return;
      }

      const vivas = new Set(resueltas.map((v) => v.varianteId));
      const depuradas = lineasGuardadas.filter((linea) => vivas.has(linea.varianteId));
      if (depuradas.length !== lineasGuardadas.length) guardarCarrito(depuradas);

      setGuardadas(depuradas);
      setVariantes(resueltas);
      setSesion(datosSesion.sesion);
      setDirecciones(datosSesion.direcciones);
      const principal = datosSesion.direcciones.find((d) => d.principal) ?? datosSesion.direcciones[0];
      if (principal) setDireccionId(principal.id);
      else setNuevaDireccion(true);
      setCargando(false);
    }

    void cargar();

    function recargarCarrito() {
      setGuardadas(leerCarrito());
    }
    window.addEventListener(CARRITO_EVENTO, recargarCarrito);
    return () => {
      vigente = false;
      window.removeEventListener(CARRITO_EVENTO, recargarCarrito);
    };
  }, [router]);

  const lineas = useMemo(
    () =>
      guardadas.flatMap((linea) => {
        const variante = variantes.find((v) => v.varianteId === linea.varianteId);
        if (variante === undefined) return [];
        return [{ ...variante, cantidad: linea.cantidad }];
      }),
    [guardadas, variantes],
  );

  const metodoElegido = metodos.find((m) => m.id === metodoId) ?? null;

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
          ? { metodoEnvio: { costo: metodoElegido.costo, gratisDesde: metodoElegido.gratisDesde } }
          : {},
      ),
    [lineas, metodoElegido],
  );

  async function guardarNuevaDireccion() {
    setError(null);
    setGuardandoDireccion(true);

    const resultado = await agregarDireccion({
      departamento,
      provincia,
      distrito,
      calle,
      referencia: referencia.trim() === "" ? undefined : referencia,
    });

    setGuardandoDireccion(false);

    const direccion = resultado.direccion;
    if (!resultado.ok || !direccion) {
      setError(resultado.error ?? "No se pudo guardar la dirección.");
      return;
    }

    setDirecciones((actual) => [...actual, direccion]);
    setDireccionId(direccion.id);
    setNuevaDireccion(false);
    setDepartamento("");
    setProvincia("");
    setDistrito("");
    setCalle("");
    setReferencia("");
  }

  async function confirmar() {
    setError(null);

    if (!direccionId) {
      setError("Elige una dirección de envío.");
      return;
    }
    if (!metodoId) {
      setError("Elige un método de envío.");
      return;
    }
    if (!medioPago) {
      setError("Elige un medio de pago.");
      return;
    }
    if (documento.trim() === "") {
      setError("Escribe tu DNI o RUC.");
      return;
    }

    setEnviando(true);

    const resultado = await crearPedido({
      direccionId,
      metodoEnvioId: metodoId,
      medioPago,
      comprobante,
      documento,
      razonSocial: comprobante === "factura" && razonSocial.trim() !== "" ? razonSocial : undefined,
      lineas: guardadas,
    });

    if (!resultado.ok || !resultado.codigo) {
      setError(resultado.error ?? "No se pudo confirmar el pedido.");
      setEnviando(false);
      return;
    }

    guardarCarrito([]);
    router.push(`/pedido/${resultado.codigo}`);
  }

  if (cargando) {
    return (
      <DisposicionCompra titulo="Finalizar compra">
        <Cargando texto="Preparando tu pedido…" />
      </DisposicionCompra>
    );
  }

  if (!sesion) return null; // ya redirigiendo a /ingresar

  if (lineas.length === 0) {
    return (
      <DisposicionCompra titulo="Finalizar compra">
        <EstadoVacio
          icono={<IconoCarrito tamano={28} />}
          titulo="Tu carrito está vacío"
          texto="Agrega productos antes de finalizar la compra."
          textoAccion="Ver productos"
          hrefAccion="/"
        />
      </DisposicionCompra>
    );
  }

  const bloqueo = totales.lineasSinStock.length > 0 ? "Vuelve al carrito y ajusta las cantidades marcadas." : null;

  return (
    <DisposicionCompra
      titulo="Finalizar compra"
      subtitulo={`${totales.unidades} ${totales.unidades === 1 ? "unidad" : "unidades"}`}
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
          onConfirmar={confirmar}
          textoContinuar="Confirmar pedido"
          confirmando={enviando}
        />
      }
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <SeccionCheckout numero={1} titulo="Dirección de envío">
        {direcciones.map((dir) => (
          <TarjetaSeleccionable
            key={dir.id}
            name="direccion"
            value={dir.id}
            checked={direccionId === dir.id}
            onChange={() => setDireccionId(dir.id)}
          >
            <strong>{dir.calle}</strong>
            <span>
              {dir.distrito}, {dir.provincia}, {dir.departamento}
            </span>
            {dir.referencia ? <span>{dir.referencia}</span> : null}
          </TarjetaSeleccionable>
        ))}

        {nuevaDireccion ? (
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              void guardarNuevaDireccion();
            }}
          >
            <Campo id="departamento" etiqueta="Departamento" valor={departamento} onCambio={setDepartamento} requerido />
            <Campo id="provincia" etiqueta="Provincia" valor={provincia} onCambio={setProvincia} requerido />
            <Campo id="distrito" etiqueta="Distrito" valor={distrito} onCambio={setDistrito} requerido />
            <Campo id="calle" etiqueta="Dirección completa" valor={calle} onCambio={setCalle} requerido />
            <Campo
              id="referencia"
              etiqueta="Referencia (opcional)"
              valor={referencia}
              onCambio={setReferencia}
            />
            <Boton tipo="submit" disabled={guardandoDireccion}>
              {guardandoDireccion ? "Guardando…" : "Guardar dirección"}
            </Boton>
          </Formulario>
        ) : (
          <Boton variante="secundario" onClick={() => setNuevaDireccion(true)}>
            + Agregar dirección nueva
          </Boton>
        )}
      </SeccionCheckout>

      <SeccionCheckout numero={2} titulo="Comprobante">
        <TarjetaSeleccionable
          name="comprobante"
          value="boleta"
          checked={comprobante === "boleta"}
          onChange={() => setComprobante("boleta")}
        >
          <strong>Boleta</strong>
        </TarjetaSeleccionable>
        <TarjetaSeleccionable
          name="comprobante"
          value="factura"
          checked={comprobante === "factura"}
          onChange={() => setComprobante("factura")}
        >
          <strong>Factura</strong>
        </TarjetaSeleccionable>

        <Campo
          id="documento"
          etiqueta={comprobante === "factura" ? "RUC" : "DNI"}
          valor={documento}
          onCambio={setDocumento}
          requerido
        />
        {comprobante === "factura" ? (
          <Campo
            id="razonSocial"
            etiqueta="Razón social"
            valor={razonSocial}
            onCambio={setRazonSocial}
            requerido
          />
        ) : null}
      </SeccionCheckout>

      <SeccionCheckout numero={3} titulo="Método de pago">
        {mediosDePago.map((medio) => (
          <TarjetaSeleccionable
            key={medio.valor}
            name="medioPago"
            value={medio.valor}
            checked={medioPago === medio.valor}
            onChange={() => setMedioPago(medio.valor)}
          >
            <strong>{medio.etiqueta}</strong>
            <span>{medio.descripcion}</span>
          </TarjetaSeleccionable>
        ))}
      </SeccionCheckout>
    </DisposicionCompra>
  );
}
