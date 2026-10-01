"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  calcularTotales,
  errorDocumentoComprobante,
  redondear,
  type LineaGuardada,
  type TipoComprobante,
} from "@appweb/core";
import type { MedioPago } from "@appweb/core/puertos";
import { esquemaDireccion } from "@appweb/core/tipos";
import {
  Alerta,
  ArticulosResumen,
  Boton,
  Campo,
  Cargando,
  CodigoPromocional,
  DisposicionCompra,
  EstadoVacio,
  FilaCampos,
  Formulario,
  GrupoOpciones,
  IconoCarrito,
  IconoFlechaIzquierda,
  IconoMoneda,
  IconoPedidos,
  IconoUbicacion,
  Insignia,
  ResumenCompra,
  SeccionCheckout,
  TarjetaSeleccionable,
} from "@appweb/ui";

import { guardarCarrito, guardarCupon, leerCarrito, CARRITO_EVENTO } from "@/lib/carrito-local";
import type { DireccionDeUsuario } from "@/lib/consultas-privadas";
import type { MetodoDeEnvio, VarianteDeCarrito } from "@/lib/consultas";
import { usarCupon } from "@/lib/usar-cupon";

import { resolverLineasDelCarrito } from "../carrito/acciones";
import {
  agregarDireccion,
  crearPedido,
  sesionYDireccionesCheckout,
  type ContactoCheckout,
} from "./acciones";

export interface PropsCheckoutCliente {
  metodos: MetodoDeEnvio[];
  mediosDePago: { valor: MedioPago; etiqueta: string; descripcion: string }[];
}

const FORMATO = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/**
 * Isla cliente del checkout: contacto, direccion, envio, comprobante y pago,
 * con el resumen al lado.
 *
 * Igual que el carrito, nada de lo que se ve se calcula aqui: los totales
 * salen de `calcularTotales` y el documento se valida con
 * `errorDocumentoComprobante`, las mismas funciones que vuelve a correr el
 * servidor al cerrar el pedido.
 */
export function CheckoutCliente({ metodos, mediosDePago }: PropsCheckoutCliente) {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [guardadas, setGuardadas] = useState<LineaGuardada[]>([]);
  const [variantes, setVariantes] = useState<VarianteDeCarrito[]>([]);
  const [contacto, setContacto] = useState<ContactoCheckout | null>(null);
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
  const [comprobante, setComprobante] = useState<TipoComprobante>("boleta");
  const [documento, setDocumento] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | null>(mediosDePago[0]?.valor ?? null);

  const cupon = usarCupon();

  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
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
      setContacto(datosSesion.sesion);
      setDirecciones(datosSesion.direcciones);
      const principal =
        datosSesion.direcciones.find((d) => d.principal) ?? datosSesion.direcciones[0];
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

  const lineasCalculo = useMemo(
    () =>
      lineas.map((linea) => ({
        varianteId: linea.varianteId,
        precioUnitario: linea.precio,
        cantidad: linea.cantidad,
        stock: linea.stock,
      })),
    [lineas],
  );

  const metodoElegido = metodos.find((m) => m.id === metodoId) ?? null;

  const totales = useMemo(
    () =>
      calcularTotales(lineasCalculo, {
        cupon: cupon.aplicado,
        ...(metodoElegido
          ? { metodoEnvio: { costo: metodoElegido.costo, gratisDesde: metodoElegido.gratisDesde } }
          : {}),
      }),
    [lineasCalculo, metodoElegido, cupon.aplicado],
  );

  /** Lo que costaria cada metodo con este carrito: el gratis-desde ya aplicado. */
  const costoPorMetodo = useMemo(
    () =>
      new Map(
        metodos.map((metodo) => [
          metodo.id,
          calcularTotales(lineasCalculo, {
            cupon: cupon.aplicado,
            metodoEnvio: { costo: metodo.costo, gratisDesde: metodo.gratisDesde },
          }).costoEnvio ?? metodo.costo,
        ]),
      ),
    [metodos, lineasCalculo, cupon.aplicado],
  );

  function limpiarError(campo: string) {
    setErrores((actual) => {
      if (!(campo in actual)) return actual;
      const { [campo]: _quitado, ...resto } = actual;
      return resto;
    });
  }

  function mostrarError(mensaje: string) {
    setError(mensaje);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardarNuevaDireccion() {
    setError(null);

    const datos = {
      departamento,
      provincia,
      distrito,
      calle,
      referencia: referencia.trim() === "" ? undefined : referencia,
    };
    const analizado = esquemaDireccion.safeParse(datos);
    if (!analizado.success) {
      const nuevos: Record<string, string> = {};
      for (const problema of analizado.error.issues) {
        nuevos[String(problema.path[0])] ??= problema.message;
      }
      setErrores((actual) => ({ ...actual, ...nuevos }));
      return;
    }

    setGuardandoDireccion(true);
    const resultado = await agregarDireccion(datos);
    setGuardandoDireccion(false);

    const direccion = resultado.direccion;
    if (!resultado.ok || !direccion) {
      mostrarError(resultado.error ?? "No se pudo guardar la dirección.");
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

    if (!direccionId || nuevaDireccion) {
      mostrarError(
        nuevaDireccion ? "Guarda la dirección nueva antes de confirmar." : "Elige una dirección de envío.",
      );
      return;
    }
    if (!metodoId) {
      mostrarError("Elige un método de envío.");
      return;
    }
    if (!medioPago) {
      mostrarError("Elige un medio de pago.");
      return;
    }

    const nuevos: Record<string, string> = {};
    const errorDocumento = errorDocumentoComprobante(comprobante, documento);
    if (errorDocumento) nuevos["documento"] = errorDocumento;
    if (comprobante === "factura" && razonSocial.trim() === "") {
      nuevos["razonSocial"] = "Escribe la razón social.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      mostrarError("Revisa los datos del comprobante.");
      return;
    }

    setEnviando(true);

    const resultado = await crearPedido({
      direccionId,
      metodoEnvioId: metodoId,
      medioPago,
      comprobante,
      documento,
      razonSocial: comprobante === "factura" ? razonSocial : undefined,
      lineas: guardadas,
      cupon: cupon.aplicado?.codigo,
    });

    if (!resultado.ok || !resultado.codigo) {
      mostrarError(resultado.error ?? "No se pudo confirmar el pedido.");
      setEnviando(false);
      return;
    }

    guardarCarrito([]);
    guardarCupon(null);
    router.push(`/pedido/${resultado.codigo}`);
  }

  const volver = (
    <Link href="/carrito">
      <IconoFlechaIzquierda tamano={16} />
      Volver al carrito
    </Link>
  );

  if (cargando) {
    return (
      <DisposicionCompra titulo="Finalizar compra" fuente="acceso">
        <Cargando texto="Preparando tu pedido…" />
      </DisposicionCompra>
    );
  }

  if (!contacto) return null; // ya redirigiendo a /ingresar

  if (lineas.length === 0) {
    return (
      <DisposicionCompra titulo="Finalizar compra" fuente="acceso">
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

  const bloqueo =
    totales.lineasSinStock.length > 0 ? "Vuelve al carrito y ajusta las cantidades marcadas." : null;

  return (
    <DisposicionCompra
      titulo="Finalizar compra"
      fuente="acceso"
      subtitulo={`${totales.unidades} ${totales.unidades === 1 ? "unidad" : "unidades"} · ${lineas.length} ${lineas.length === 1 ? "producto" : "productos"}`}
      accion={volver}
      lateral={
        <ResumenCompra
          unidades={totales.unidades}
          subtotal={totales.subtotal}
          descuento={totales.descuento}
          costoEnvio={totales.costoEnvio}
          total={totales.total}
          faltaEnvioGratis={totales.faltaEnvioGratis}
          articulos={
            <ArticulosResumen
              articulos={lineas.map((linea) => ({
                id: linea.varianteId,
                nombre: linea.nombre,
                imagenUrl: linea.imagenUrl,
                talla: linea.talla,
                color: linea.color,
                cantidad: linea.cantidad,
                total: redondear(linea.precio * linea.cantidad),
              }))}
            />
          }
          codigo={
            <CodigoPromocional
              valor={cupon.texto}
              onCambio={cupon.cambiar}
              onAplicar={cupon.aplicar}
              aplicado={cupon.aplicado?.codigo ?? null}
              onQuitar={cupon.quitar}
              mensaje={cupon.aviso}
              tonoMensaje="error"
            />
          }
          motivoBloqueo={bloqueo}
          onConfirmar={confirmar}
          textoContinuar="Confirmar pedido"
          confirmando={enviando}
          nota="Despachamos tu pedido cuando confirmemos el pago."
        />
      }
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <SeccionCheckout
        numero={1}
        titulo="Contacto"
        descripcion="Te avisaremos del estado de tu pedido."
        accion={<Link href="/mi-cuenta">Editar</Link>}
      >
        <p className="ui-seccion-checkout__datos">
          <strong>{contacto.nombre}</strong>
          <span>{contacto.email}</span>
          <span>{contacto.telefono ?? "Sin teléfono: agrégalo en Mi cuenta para coordinar la entrega."}</span>
        </p>
      </SeccionCheckout>

      <SeccionCheckout
        numero={2}
        titulo="Dirección de envío"
        descripcion="¿Dónde recibes tu pedido?"
        accion={
          !nuevaDireccion && direcciones.length > 0 ? (
            <button type="button" onClick={() => setNuevaDireccion(true)}>
              Agregar
            </button>
          ) : undefined
        }
      >
        {direcciones.length > 0 ? (
          <GrupoOpciones etiqueta="Dirección de envío">
            {direcciones.map((dir) => (
              <TarjetaSeleccionable
                key={dir.id}
                name="direccion"
                value={dir.id}
                checked={!nuevaDireccion && direccionId === dir.id}
                onChange={() => {
                  setDireccionId(dir.id);
                  setNuevaDireccion(false);
                }}
                icono={<IconoUbicacion tamano={20} />}
              >
                <strong>
                  {dir.calle}
                  {dir.principal ? <Insignia>Principal</Insignia> : null}
                </strong>
                <span>
                  {dir.distrito}, {dir.provincia}, {dir.departamento}
                </span>
                {dir.referencia ? <span>Ref.: {dir.referencia}</span> : null}
              </TarjetaSeleccionable>
            ))}
          </GrupoOpciones>
        ) : null}

        {nuevaDireccion ? (
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              void guardarNuevaDireccion();
            }}
          >
            <FilaCampos>
              <Campo
                id="departamento"
                etiqueta="Departamento"
                valor={departamento}
                onCambio={(valor) => {
                  setDepartamento(valor);
                  limpiarError("departamento");
                }}
                error={errores["departamento"] ?? null}
                autoComplete="address-level1"
                requerido
              />
              <Campo
                id="provincia"
                etiqueta="Provincia"
                valor={provincia}
                onCambio={(valor) => {
                  setProvincia(valor);
                  limpiarError("provincia");
                }}
                error={errores["provincia"] ?? null}
                autoComplete="address-level2"
                requerido
              />
            </FilaCampos>
            <Campo
              id="distrito"
              etiqueta="Distrito"
              valor={distrito}
              onCambio={(valor) => {
                setDistrito(valor);
                limpiarError("distrito");
              }}
              error={errores["distrito"] ?? null}
              autoComplete="address-level3"
              requerido
            />
            <Campo
              id="calle"
              etiqueta="Dirección completa"
              placeholder="Av., calle o jirón, número, dpto."
              valor={calle}
              onCambio={(valor) => {
                setCalle(valor);
                limpiarError("calle");
              }}
              error={errores["calle"] ?? null}
              autoComplete="street-address"
              requerido
            />
            <Campo
              id="referencia"
              etiqueta="Referencia (opcional)"
              placeholder="Frente al parque, casa de rejas negras…"
              valor={referencia}
              onCambio={setReferencia}
            />
            <FilaCampos>
              <Boton tipo="submit" disabled={guardandoDireccion} anchoCompleto>
                {guardandoDireccion ? "Guardando…" : "Guardar dirección"}
              </Boton>
              {direcciones.length > 0 ? (
                <Boton variante="secundario" onClick={() => setNuevaDireccion(false)} anchoCompleto>
                  Cancelar
                </Boton>
              ) : null}
            </FilaCampos>
          </Formulario>
        ) : null}
      </SeccionCheckout>

      <SeccionCheckout numero={3} titulo="Método de envío" descripcion="Elige cómo te llega.">
        <GrupoOpciones etiqueta="Método de envío">
          {metodos.map((metodo) => {
            const costo = costoPorMetodo.get(metodo.id) ?? metodo.costo;
            return (
              <TarjetaSeleccionable
                key={metodo.id}
                name="metodoEnvio"
                value={metodo.id}
                checked={metodoId === metodo.id}
                onChange={() => setMetodoId(metodo.id)}
                icono={<IconoPedidos tamano={20} />}
                extra={costo === 0 ? "Gratis" : FORMATO.format(costo)}
              >
                <strong>{metodo.nombre}</strong>
                {metodo.gratisDesde !== null && costo > 0 ? (
                  <span>Gratis desde {FORMATO.format(metodo.gratisDesde)}</span>
                ) : null}
              </TarjetaSeleccionable>
            );
          })}
        </GrupoOpciones>
      </SeccionCheckout>

      <SeccionCheckout numero={4} titulo="Comprobante" descripcion="Lo emitimos con estos datos.">
        <GrupoOpciones etiqueta="Tipo de comprobante" columnas={2}>
          <TarjetaSeleccionable
            name="comprobante"
            value="boleta"
            checked={comprobante === "boleta"}
            onChange={() => {
              setComprobante("boleta");
              limpiarError("documento");
            }}
          >
            <strong>Boleta</strong>
            <span>Con tu DNI.</span>
          </TarjetaSeleccionable>
          <TarjetaSeleccionable
            name="comprobante"
            value="factura"
            checked={comprobante === "factura"}
            onChange={() => {
              setComprobante("factura");
              limpiarError("documento");
            }}
          >
            <strong>Factura</strong>
            <span>Con el RUC de tu empresa.</span>
          </TarjetaSeleccionable>
        </GrupoOpciones>

        <FilaCampos>
          <Campo
            id="documento"
            etiqueta={comprobante === "factura" ? "RUC" : "DNI"}
            placeholder={comprobante === "factura" ? "11 dígitos" : "8 dígitos"}
            valor={documento}
            onCambio={(valor) => {
              setDocumento(valor.replace(/\D/g, "").slice(0, comprobante === "factura" ? 11 : 8));
              limpiarError("documento");
            }}
            error={errores["documento"] ?? null}
            autoComplete="off"
            requerido
          />
          {comprobante === "factura" ? (
            <Campo
              id="razonSocial"
              etiqueta="Razón social"
              valor={razonSocial}
              onCambio={(valor) => {
                setRazonSocial(valor);
                limpiarError("razonSocial");
              }}
              error={errores["razonSocial"] ?? null}
              autoComplete="organization"
              requerido
            />
          ) : null}
        </FilaCampos>
      </SeccionCheckout>

      <SeccionCheckout numero={5} titulo="Método de pago" descripcion="Te mostramos cómo pagar al confirmar.">
        <GrupoOpciones etiqueta="Método de pago" columnas={2}>
          {mediosDePago.map((medio) => (
            <TarjetaSeleccionable
              key={medio.valor}
              name="medioPago"
              value={medio.valor}
              checked={medioPago === medio.valor}
              onChange={() => setMedioPago(medio.valor)}
              icono={<IconoMoneda tamano={20} />}
            >
              <strong>{medio.etiqueta}</strong>
              <span>{medio.descripcion}</span>
            </TarjetaSeleccionable>
          ))}
        </GrupoOpciones>
      </SeccionCheckout>
    </DisposicionCompra>
  );
}
