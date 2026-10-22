"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  enlaceWhatsApp,
  ETIQUETAS,
  ETIQUETAS_MEDIO_PAGO,
  ETIQUETAS_PAGO,
  mensajeAlClienteWhatsApp,
  pasosDelPedido,
  siguientesEstados,
  type EstadoPago,
  type EstadoPedido,
} from "@appweb/core";
import {
  Alerta,
  BloqueDetalle,
  Boton,
  Campo,
  CampoSelect,
  Cargando,
  FilaDetalles,
  FilaLista,
  Formulario,
  Insignia,
  LineaEstados,
  Tarjeta,
  TarjetaPedido,
} from "@appweb/ui";

import { type ProductoTocado, revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";

import { tonoDeEstado } from "./Pedidos";
import { FECHA_HORA, MONEDA, mensajeDeFallo } from "@appweb/core/formato";

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

  const [referencia, setReferencia] = useState("");
  const [notaPago, setNotaPago] = useState("");

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
    setReferencia("");
    setNotaPago("");
    setEstadoNuevo("");
    setNota("");
    setTransportista("");
    setSeguimiento("");
    // Lista y detalle: el pedido cambio de pestaña y de conteo.
    void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(mensajeDeFallo(fallo));
  }

  const confirmar = useMutation(
    trpc.panel.pedidos.confirmarPago.mutationOptions({
      onSuccess: (r) =>
        alTerminar(`Pago de ${r.codigo} confirmado. El stock ya se descontó.`, r.productosTocados),
      onError: alFallar,
    }),
  );

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
      ← Volver a pedidos
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
  const faltaStock = p.items.some((item) => item.stockActual < item.cantidad);
  const trabajando = confirmar.isPending || cambiar.isPending;
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

      <Tarjeta titulo={`Pedido ${p.codigo}`} acciones={volver}>
        <p>
          <Insignia tono={tonoDeEstado(p.estado)}>{ETIQUETAS[p.estado]}</Insignia>{" "}
          <Insignia tono="neutro">{ETIQUETAS_MEDIO_PAGO[p.medioPago]}</Insignia>{" "}
          {FECHA_HORA.format(new Date(p.creadoEn))}
        </p>
        <LineaEstados pasos={pasosDelPedido(p.estado)} />
      </Tarjeta>

      {puedeGestionar && pendiente && !contraEntrega && pagoPendiente ? (
        <Tarjeta titulo="Confirmar pago">
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              confirmar.mutate({
                pedidoId: p.id,
                pagoId: pagoPendiente.id,
                referencia,
                ...(notaPago.trim() === "" ? {} : { nota: notaPago }),
              });
            }}
          >
            <p>
              Revisa en tu {ETIQUETAS_MEDIO_PAGO[pagoPendiente.medio]} que entraron{" "}
              <strong>{MONEDA.format(pagoPendiente.monto)}</strong> y copia el número de operación.
              Al confirmar, el pedido pasa a Pagado y se descuenta el stock.
            </p>
            {faltaStock ? (
              <Alerta tono="error">
                Algún producto ya no tiene stock suficiente. Revisa la lista de abajo antes de
                confirmar.
              </Alerta>
            ) : null}
            <Campo
              id="referencia-pago"
              etiqueta="Número de operación"
              valor={referencia}
              onCambio={setReferencia}
              requerido
            />
            <Campo
              id="nota-pago"
              etiqueta="Nota (opcional)"
              valor={notaPago}
              onCambio={setNotaPago}
            />
            <Boton tipo="submit" disabled={trabajando || referencia.trim() === ""}>
              {confirmar.isPending ? "Confirmando…" : "Confirmar pago y descontar stock"}
            </Boton>
          </Formulario>
        </Tarjeta>
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

      {pendiente ? (
        <Tarjeta titulo="Stock disponible">
          {p.items.map((item) => (
            <FilaLista key={item.sku}>
              <strong>{item.nombreProducto}</strong>
              <span>
                {item.color} · Talla {item.talla} · SKU {item.sku}
              </span>
              <span>
                <Insignia tono={item.stockActual < item.cantidad ? "error" : "exito"}>
                  Pide {item.cantidad} · hay {item.stockActual}
                </Insignia>
              </span>
            </FilaLista>
          ))}
        </Tarjeta>
      ) : null}

      <FilaDetalles>
        <BloqueDetalle titulo="Cliente">
          <p>{p.cliente.nombre}</p>
          <p>{p.cliente.email}</p>
          {p.cliente.telefono ? <p>{p.cliente.telefono}</p> : null}
          <p>
            {p.comprobante.tipo === "FACTURA" ? "Factura" : "Boleta"} · {p.comprobante.documento}
            {p.comprobante.razonSocial ? ` · ${p.comprobante.razonSocial}` : ""}
          </p>
        </BloqueDetalle>
        <BloqueDetalle titulo="Envío">
          <p>{p.envio.destinatario ?? p.cliente.nombre}</p>
          {p.envio.telefono ? <p>{p.envio.telefono}</p> : null}
          <p>{p.envio.direccion}</p>
          {p.envio.referencia ? <p>Ref.: {p.envio.referencia}</p> : null}
          <p>{p.envio.metodo}</p>
          {p.envio.transportista || p.envio.codigoSeguimiento ? (
            <p>
              {p.envio.transportista ?? "Transportista"} ·{" "}
              {p.envio.codigoSeguimiento ?? "sin código"}
            </p>
          ) : null}
          {whatsappCliente ? (
            <Boton variante="secundario" href={whatsappCliente} externo>
              Escribir por WhatsApp
            </Boton>
          ) : null}
        </BloqueDetalle>
      </FilaDetalles>

      <Tarjeta titulo="Pagos">
        {p.pagos.map((pago) => (
          <FilaLista key={pago.id}>
            <strong>
              {ETIQUETAS_MEDIO_PAGO[pago.medio]} · {MONEDA.format(pago.monto)}
            </strong>
            <span>
              <Insignia tono={tonoDePago(pago.estado)}>{ETIQUETAS_PAGO[pago.estado]}</Insignia>
              {pago.referencia ? ` · Op. ${pago.referencia}` : ""}
            </span>
            {pago.confirmadoPor && pago.confirmadoEn ? (
              <span>
                Confirmó {pago.confirmadoPor} · {FECHA_HORA.format(new Date(pago.confirmadoEn))}
              </span>
            ) : null}
            {pago.comprobanteUrl ? (
              <a href={pago.comprobanteUrl} target="_blank" rel="noreferrer">
                Ver comprobante
              </a>
            ) : null}
          </FilaLista>
        ))}
      </Tarjeta>

      <Tarjeta titulo="Historial">
        {p.historial.map((h) => (
          <FilaLista key={h.id}>
            <span>
              <Insignia tono={tonoDeEstado(h.estadoNuevo)}>{ETIQUETAS[h.estadoNuevo]}</Insignia>
            </span>
            {h.nota ? <span>{h.nota}</span> : null}
            <span>
              {h.usuario ?? "Sistema"} · {FECHA_HORA.format(new Date(h.creadoEn))}
            </span>
          </FilaLista>
        ))}
      </Tarjeta>
    </>
  );
}
