"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  enlaceWhatsApp,
  ETIQUETAS,
  ETIQUETAS_MEDIO_PAGO,
  mensajeAlClienteWhatsApp,
  pasosDelPedido,
  siguientesEstados,
  type EstadoPago,
  type EstadoPedido,
} from "@appweb/core";
import {
  Alerta,
  Boton,
  CabeceraDetalle,
  Campo,
  CampoSelect,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  Formulario,
  IconoCatalogo,
  IconoFlechaIzquierda,
  IconoPedidos,
  IconoReloj,
  IconoUbicacion,
  IconoUsuario,
  IconoWhatsAppLinea,
  LineaEstados,
  ListaActividad,
  LogoIcono,
  RejillaBento,
  Tarjeta,
  TarjetaActividad,
  TarjetaPedido,
} from "@appweb/ui";

import { type ProductoTocado, revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";

import { tonoDeEstado } from "./Pedidos";
import { FECHA_HORA, MONEDA, cuandoFue, mensajeDeFallo } from "@appweb/core/formato";

export function tonoDePago(estado: EstadoPago): "exito" | "alerta" | "error" | "neutro" {
  if (estado === "CONFIRMADO") return "exito";
  if (estado === "PENDIENTE") return "alerta";
  if (estado === "RECHAZADO") return "error";
  return "neutro";
}

/** Como se lee cada cambio en el selector. */
function etiquetaDeCambio(hacia: EstadoPedido, contraEntrega: boolean): string {
  if (hacia === "PREPARANDO" && contraEntrega) return "Confirmar pedido (se cobra al entregar)";
  if (hacia === "PREPARANDO") return "Pasar a Preparando";
  if (hacia === "ENVIADO") return "Marcar como enviado";
  if (hacia === "ENTREGADO") return "Marcar como entregado";
  if (hacia === "CANCELADO") return "Cancelar pedido";
  return ETIQUETAS[hacia];
}

interface PropsDetallePedido {
  pedidoId: string;
  puedeGestionar: boolean;
  onVolver: () => void;
}

/**
 * Un pedido completo: en que va, que compro, a donde va, como pago y quien
 * hizo cada cambio. Abajo, lo que se puede hacer con el ahora mismo.
 */
export function DetallePedido({ pedidoId, puedeGestionar, onVolver }: PropsDetallePedido) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const consulta = useQuery(trpc.panel.pedidos.detalle.queryOptions({ pedidoId }));

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [estadoNuevo, setEstadoNuevo] = useState("");
  const [nota, setNota] = useState("");
  const [transportista, setTransportista] = useState("");
  const [seguimiento, setSeguimiento] = useState("");

  async function alTerminar(mensaje: string, productos: ProductoTocado[]) {
    setError(null);
    const tiendaAlDia = await revalidarTienda({ productos });
    setAviso(
      tiendaAlDia
        ? mensaje
        : `${mensaje} La tienda tardará unos minutos en mostrar el stock nuevo.`,
    );
    setEstadoNuevo("");
    setNota("");
    setTransportista("");
    setSeguimiento("");
    // Lista y detalle: el pedido cambio de pestaña y de conteo.
    void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.pagos.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(mensajeDeFallo(fallo));
  }

  const cambiar = useMutation(
    trpc.panel.pedidos.cambiarEstado.mutationOptions({
      onSuccess: (r, variables) =>
        alTerminar(
          `${r.codigo} pasó a ${ETIQUETAS[variables.estado]}.` +
            (r.productosTocados.length > 0 ? " El stock ya se actualizó." : ""),
          r.productosTocados,
        ),
      onError: alFallar,
    }),
  );

  const volver = (
    <Boton variante="secundario" onClick={onVolver}>
      <IconoFlechaIzquierda tamano={16} />
      Volver a pedidos
    </Boton>
  );

  if (consulta.isPending) return <Cargando texto="Cargando pedido…" />;
  if (consulta.isError) {
    return (
      <Tarjeta acciones={volver}>
        <Alerta tono="error">{consulta.error.message}</Alerta>
      </Tarjeta>
    );
  }

  const p = consulta.data;
  const contraEntrega = p.medioPago === "CONTRA_ENTREGA";
  const pagoPendiente = p.pagos.find((pago) => pago.estado === "PENDIENTE");
  const opcionesCambio = siguientesEstados(p.estado, { contraEntrega })
    .filter((estado) => estado !== "PAGADO")
    .map((estado) => ({ valor: estado, etiqueta: etiquetaDeCambio(estado, contraEntrega) }));
  const pendiente = p.estado === "PENDIENTE_PAGO";
  const trabajando = cambiar.isPending;
  const whatsappCliente = enlaceWhatsApp(
    p.envio.telefono ?? p.cliente.telefono,
    mensajeAlClienteWhatsApp({
      nombre: p.envio.destinatario ?? p.cliente.nombre,
      codigo: p.codigo,
    }),
  );

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <CabeceraDetalle
        titulo={`Pedido ${p.codigo}`}
        acciones={
          <>
            {whatsappCliente ? (
              <Boton variante="secundario" href={whatsappCliente} externo>
                <IconoWhatsAppLinea tamano={16} />
                WhatsApp
              </Boton>
            ) : null}
            {volver}
          </>
        }
      />

      <RejillaBento>
        <CuadroMonto
          logo={<LogoIcono icono={<IconoPedidos tamano={16} />} nombre="Pedido" />}
          estado={{ texto: ETIQUETAS[p.estado], tono: tonoDeEstado(p.estado) }}
          etiqueta={`Total · ${ETIQUETAS_MEDIO_PAGO[p.medioPago]}`}
          monto={MONEDA.format(p.total)}
          detalle={FECHA_HORA.format(new Date(p.creadoEn))}
        />
        <CuadroBento
          icono={<IconoUsuario tamano={16} />}
          titulo="Cliente"
          ancho="ancho"
          detalle={[p.cliente.email, p.cliente.telefono].filter(Boolean).join(" · ")}
          cifras={[
            {
              valor: p.comprobante.documento,
              etiqueta: p.comprobante.tipo === "FACTURA" ? "Factura" : "Boleta",
            },
            ...(p.comprobante.razonSocial
              ? [{ valor: p.comprobante.razonSocial, etiqueta: "Razón social" }]
              : []),
          ]}
        >
          {p.cliente.nombre}
        </CuadroBento>
        <CuadroBento
          icono={<IconoUbicacion tamano={16} />}
          titulo={`Envío · ${p.envio.metodo}`}
          ancho="ancho"
          detalle={[
            p.envio.destinatario ?? p.cliente.nombre,
            p.envio.telefono,
            p.envio.referencia ? `Ref.: ${p.envio.referencia}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          {...(p.envio.transportista || p.envio.codigoSeguimiento
            ? {
                cifras: [
                  {
                    valor: p.envio.codigoSeguimiento ?? "sin código",
                    etiqueta: p.envio.transportista ?? "Transportista",
                  },
                ],
              }
            : {})}
        >
          {p.envio.direccion}
        </CuadroBento>
        {pendiente ? (
          <CuadroDesglose
            icono={<IconoCatalogo tamano={16} />}
            titulo="Stock disponible"
            ancho="ancho"
            lineas={p.items.map((item) => ({
              etiqueta: `${item.nombreProducto} · ${item.talla} · ${item.color}`,
              valor:
                item.stockActual < item.cantidad
                  ? `Falta: pide ${item.cantidad}, hay ${item.stockActual}`
                  : `Pide ${item.cantidad} · hay ${item.stockActual}`,
            }))}
          />
        ) : null}
      </RejillaBento>

      <Tarjeta titulo="Avance">
        <LineaEstados pasos={pasosDelPedido(p.estado)} />
      </Tarjeta>

      {pendiente && !contraEntrega ? (
        // El dinero se revisa en Pagos: aqui solo se ve que el pedido espera.
        <Alerta tono="info">
          {pagoPendiente
            ? "Este pedido espera que se confirme su pago. Eso se hace en la sección Pagos."
            : "Este pedido aún no tiene un pago registrado."}
        </Alerta>
      ) : null}

      {puedeGestionar && opcionesCambio.length > 0 ? (
        <Tarjeta titulo="Cambiar estado">
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              if (estadoNuevo === "") return;
              cambiar.mutate({
                pedidoId: p.id,
                estado: estadoNuevo as EstadoPedido,
                ...(nota.trim() === "" ? {} : { nota }),
                ...(estadoNuevo === "ENVIADO"
                  ? {
                      ...(transportista.trim() === "" ? {} : { transportista }),
                      ...(seguimiento.trim() === "" ? {} : { codigoSeguimiento: seguimiento }),
                    }
                  : {}),
              });
            }}
          >
            <CampoSelect
              id="estado-nuevo"
              etiqueta="¿Qué pasó con el pedido?"
              valor={estadoNuevo}
              opciones={[{ valor: "", etiqueta: "Elige una opción" }, ...opcionesCambio]}
              onCambio={setEstadoNuevo}
            />
            {estadoNuevo === "ENVIADO" ? (
              <>
                <Campo
                  id="transportista"
                  etiqueta="Transportista (opcional)"
                  valor={transportista}
                  onCambio={setTransportista}
                  placeholder="Olva, Shalom, motorizado…"
                />
                <Campo
                  id="seguimiento"
                  etiqueta="Código de seguimiento (opcional)"
                  valor={seguimiento}
                  onCambio={setSeguimiento}
                />
              </>
            ) : null}
            {estadoNuevo === "CANCELADO" ? (
              <Alerta tono="error">
                {pendiente
                  ? "El pedido se cancela y su pago pendiente ya no se acepta."
                  : "El stock vuelve al almacén. Si el cliente ya pagó, devuélvele el dinero por fuera del sistema."}
              </Alerta>
            ) : null}
            {estadoNuevo === "PREPARANDO" && contraEntrega ? (
              <Alerta tono="info">
                Se descuenta el stock ahora. El cobro se registra al marcarlo entregado.
              </Alerta>
            ) : null}
            <Campo
              id="nota-estado"
              etiqueta="Nota para el historial (opcional)"
              valor={nota}
              onCambio={setNota}
            />
            <Boton tipo="submit" disabled={trabajando || estadoNuevo === ""}>
              {cambiar.isPending ? "Guardando…" : "Guardar cambio"}
            </Boton>
          </Formulario>
        </Tarjeta>
      ) : null}

      <TarjetaPedido
        titulo="Productos"
        items={p.items}
        subtotal={p.subtotal}
        descuento={p.descuento}
        costoEnvio={p.costoEnvio}
        total={p.total}
      />

      <ListaActividad titulo="Historial" vacio="Sin cambios registrados.">
        {[...p.historial].reverse().map((h) => (
          <TarjetaActividad
            key={h.id}
            estado={ETIQUETAS[h.estadoNuevo]}
            iconoEstado={<IconoReloj tamano={12} />}
            tonoEstado={tonoDeEstado(h.estadoNuevo)}
            fecha={cuandoFue(new Date(h.creadoEn))}
            logo={<LogoIcono icono={<IconoUsuario tamano={16} />} nombre="Quién" />}
            titulo={h.usuario ?? "Sistema"}
            {...(h.nota ? { subtitulo: h.nota } : {})}
            valor=""
          />
        ))}
      </ListaActividad>
    </>
  );
}
