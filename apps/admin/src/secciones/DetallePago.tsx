"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS_MEDIO_PAGO, ETIQUETAS_PAGO } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CabeceraDetalle,
  Cargando,
  FilaLista,
  Formulario,
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  ListaActividad,
  LogoMedioPago,
  Tarjeta,
  TarjetaActividad,
  ZonaImprimible,
} from "@appweb/ui";

import { ESTADO_PAGO, ETIQUETA_PAGO_RECIENTE } from "@/lib/estados-pago";
import { LOGO_MEDIO } from "@/lib/logos-pago";
import { CuadrosPago } from "./CuadrosPago";
import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
import { FECHA_HORA, MONEDA, cuandoFue, mensajeDeFallo } from "@appweb/core/formato";

export interface PropsDetallePago {
  pagoId: string;
  puedeGestionar: boolean;
  /** Vuelve a la lista, con un aviso si se confirmo o rechazo. */
  onVolver: (mensaje?: string) => void;
  /** Lleva a la seccion Pedidos con este pedido abierto. */
  onVerPedido?: (pedidoId: string) => void;
}

/**
 * Detalle de un pago: lo que hace falta para decidir sobre el dinero.
 *
 * Del pedido solo lo justo para ubicarlo; productos, envio y estado viven en
 * la seccion Pedidos, a un clic con "Ver pedido". Si el pago esta pendiente,
 * aqui mismo se confirma o se rechaza.
 */
export function DetallePago({ pagoId, puedeGestionar, onVolver, onVerPedido }: PropsDetallePago) {
  const trpc = useTRPC();
  const detalle = useQuery(trpc.panel.pagos.detalle.queryOptions({ pagoId }));

  if (detalle.isPending) return <Cargando texto="Cargando el pago…" />;
  if (detalle.isError) return <Alerta tono="error">{detalle.error.message}</Alerta>;

  const pago = detalle.data;
  const medio = ETIQUETAS_MEDIO_PAGO[pago.medio];
  const revisable =
    puedeGestionar &&
    pago.estado === "PENDIENTE" &&
    pago.pedido.estado === "PENDIENTE_PAGO" &&
    pago.medio !== "CONTRA_ENTREGA";
  return (
    <>
      <ZonaImprimible>
        <CabeceraDetalle
          titulo={`Pago de ${pago.pedido.codigo}`}
          acciones={
            <>
              {onVerPedido ? (
                <Boton variante="secundario" onClick={() => onVerPedido(pago.pedido.id)}>
                  Ver pedido
                  <IconoFlechaDerecha tamano={16} />
                </Boton>
              ) : null}
              <Boton variante="secundario" onClick={() => onVolver()}>
                <IconoFlechaIzquierda tamano={16} />
                Volver a pagos
              </Boton>
            </>
          }
        />
        <CuadrosPago pagoId={pagoId} />
      </ZonaImprimible>

      {revisable ? (
        <AccionesPago
          pedidoId={pago.pedido.id}
          pagoId={pago.id}
          medio={medio}
          monto={pago.monto}
          onVolver={onVolver}
        />
      ) : null}

      {pago.intentos.length > 1 ? (
        <ListaActividad titulo="Intentos de cobro de este pedido" vacio="">
          {pago.intentos.map((intento) => (
            <TarjetaActividad
              key={intento.id}
              estado={ETIQUETA_PAGO_RECIENTE[intento.estado] ?? ETIQUETAS_PAGO[intento.estado]}
              iconoEstado={ESTADO_PAGO[intento.estado].icono}
              tonoEstado={ESTADO_PAGO[intento.estado].tono}
              fecha={cuandoFue(new Date(intento.creadoEn))}
              logo={
                <LogoMedioPago
                  medio={LOGO_MEDIO[intento.medio]}
                  nombre={ETIQUETAS_MEDIO_PAGO[intento.medio]}
                />
              }
              titulo={intento.id === pago.id ? "Este pago" : ETIQUETAS_MEDIO_PAGO[intento.medio]}
              {...(intento.referencia ? { subtitulo: `Op. ${intento.referencia}` } : {})}
              valor={MONEDA.format(intento.monto)}
              anulado={intento.estado === "RECHAZADO"}
            />
          ))}
        </ListaActividad>
      ) : null}

      {pago.rechazos.length > 0 ? (
        <Tarjeta titulo="Motivos de rechazo">
          {pago.rechazos.map((rechazo) => (
            <FilaLista key={rechazo.creadoEn}>
              <span>{rechazo.nota}</span>
              <span>{FECHA_HORA.format(new Date(rechazo.creadoEn))}</span>
            </FilaLista>
          ))}
        </Tarjeta>
      ) : null}
    </>
  );
}

interface PropsAccionesPago {
  pedidoId: string;
  pagoId: string;
  medio: string;
  monto: number;
  onVolver: (mensaje?: string) => void;
}

/** Un pago pendiente: confirmarlo con su numero de operacion o rechazarlo. */
function AccionesPago({ pedidoId, pagoId, medio, monto, onVolver }: PropsAccionesPago) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [referencia, setReferencia] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refrescar() {
    void queryClient.invalidateQueries(trpc.panel.pagos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
  }

  const confirmar = useMutation(
    trpc.panel.pedidos.confirmarPago.mutationOptions({
      onSuccess: async (r) => {
        refrescar();
        const alDia = await revalidarTienda({ productos: r.productosTocados });
        onVolver(
          `Pago de ${r.codigo} confirmado. El stock ya se descontó.` +
            (alDia ? "" : " La tienda tardará unos minutos en mostrar el stock nuevo."),
        );
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  const rechazar = useMutation(
    trpc.panel.pagos.rechazar.mutationOptions({
      onSuccess: (r) => {
        refrescar();
        onVolver(`Pago de ${r.codigo} rechazado. El pedido sigue esperando un pago.`);
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  const trabajando = confirmar.isPending || rechazar.isPending;

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <Tarjeta titulo="Confirmar">
        <Formulario
          onSubmit={(evento) => {
            evento.preventDefault();
            confirmar.mutate({ pedidoId, pagoId, referencia });
          }}
        >
          <p>
            Revisa en tu {medio} que entraron <strong>{MONEDA.format(monto)}</strong>. Al confirmar,
            el pedido pasa a Pagado y se descuenta el stock.
          </p>
          <Campo
            id="referencia-pago"
            etiqueta="Número de operación"
            valor={referencia}
            onCambio={setReferencia}
            requerido
          />
          <Boton tipo="submit" disabled={trabajando || referencia.trim() === ""}>
            {confirmar.isPending ? "Confirmando…" : "Confirmar pago"}
          </Boton>
        </Formulario>
      </Tarjeta>

      <Tarjeta titulo="Rechazar">
        <Formulario
          onSubmit={(evento) => {
            evento.preventDefault();
            rechazar.mutate({ pedidoId, pagoId, motivo });
          }}
        >
          <p>
            Si el dinero no llegó o el comprobante no corresponde. El pedido no se cancela: queda
            esperando un nuevo pago.
          </p>
          <Campo
            id="motivo-rechazo"
            etiqueta="Motivo"
            valor={motivo}
            onCambio={setMotivo}
            placeholder="El monto no llegó, la captura es de otra compra…"
            requerido
          />
          <Boton variante="secundario" tipo="submit" disabled={trabajando || motivo.trim() === ""}>
            {rechazar.isPending ? "Rechazando…" : "Rechazar pago"}
          </Boton>
        </Formulario>
      </Tarjeta>
    </>
  );
}
