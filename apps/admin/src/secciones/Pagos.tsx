"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETAS,
  ETIQUETAS_MEDIO_PAGO,
  ETIQUETAS_PAGO,
  type EstadoPago,
  type MedioPagoPedido,
} from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  EstadoVacio,
  FilaLista,
  Formulario,
  Insignia,
  Pestanas,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";

import { DetallePedido, tonoDePago } from "./DetallePedido";
import { tonoDeEstado } from "./Pedidos";
import { FECHA_HORA, MONEDA, mensajeDeFallo } from "@appweb/core/formato";

const PESTANAS: { id: EstadoPago | "TODOS"; etiqueta: string }[] = [
  { id: "PENDIENTE", etiqueta: "Por confirmar" },
  { id: "CONFIRMADO", etiqueta: "Confirmados" },
  { id: "RECHAZADO", etiqueta: "Rechazados" },
  { id: "REEMBOLSADO", etiqueta: "Reembolsados" },
  { id: "TODOS", etiqueta: "Todos" },
];

type Fila = {
  id: string;
  pedidoId: string;
  codigo: string;
  medio: MedioPagoPedido;
  monto: number;
  estado: EstadoPago;
};

/**
 * Cola de pagos: lo que entro, lo que falta confirmar y lo que se devolvio.
 *
 * Confirmar usa la misma ruta que el detalle del pedido (pasa a Pagado y
 * descuenta stock). Rechazar deja el pedido esperando un nuevo pago.
 */
export function Pagos({ puedeGestionar }: { puedeGestionar: boolean }) {
  const trpc = useTRPC();
  const [pestana, setPestana] = useState<EstadoPago | "TODOS">("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [revisando, setRevisando] = useState<Fila | null>(null);
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const lista = useQuery(
    trpc.panel.pagos.listar.queryOptions(pestana === "TODOS" ? {} : { estado: pestana }),
  );

  const visibles = useMemo(() => {
    const pagos = lista.data?.pagos ?? [];
    const termino = busqueda.trim().toLowerCase();
    if (termino === "") return pagos;
    return pagos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(termino) ||
        p.cliente.toLowerCase().includes(termino) ||
        (p.referencia ?? "").toLowerCase().includes(termino),
    );
  }, [busqueda, lista.data]);

  if (pedidoAbierto !== null) {
    return (
      <DetallePedido
        pedidoId={pedidoAbierto}
        puedeGestionar={puedeGestionar}
        onVolver={() => setPedidoAbierto(null)}
      />
    );
  }

  if (revisando !== null) {
    return (
      <RevisarPago
        pago={revisando}
        onVolver={(mensaje) => {
          setRevisando(null);
          setAviso(mensaje ?? null);
        }}
        onVerPedido={() => setPedidoAbierto(revisando.pedidoId)}
      />
    );
  }

  const resumen = lista.data?.porEstado;
  const opciones = PESTANAS.map((p) => {
    const cantidad = resumen && p.id !== "TODOS" ? resumen[p.id].cantidad : 0;
    return { id: p.id, etiqueta: cantidad > 0 ? `${p.etiqueta} (${cantidad})` : p.etiqueta };
  });

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      {resumen ? (
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Por confirmar"
            valor={MONEDA.format(resumen.PENDIENTE.monto)}
            contexto={`${resumen.PENDIENTE.cantidad} pagos esperando`}
          />
          <TarjetaMetrica
            etiqueta="Cobrado"
            valor={MONEDA.format(resumen.CONFIRMADO.monto)}
            contexto={`${resumen.CONFIRMADO.cantidad} pagos confirmados`}
          />
          <TarjetaMetrica
            etiqueta="Reembolsado"
            valor={MONEDA.format(resumen.REEMBOLSADO.monto)}
            contexto={`${resumen.REEMBOLSADO.cantidad} devoluciones de dinero`}
          />
        </RejillaMetricas>
      ) : null}

      <Tarjeta
        titulo="Pagos"
        acciones={
          <Campo
            id="busqueda-pagos"
            etiqueta="Buscar por pedido, cliente u operación"
            valor={busqueda}
            onCambio={setBusqueda}
            placeholder="Buscar…"
          />
        }
      >
        <Pestanas
          etiqueta="Estado del pago"
          opciones={opciones}
          activa={pestana}
          onCambio={(id) => setPestana(id as EstadoPago | "TODOS")}
        />

        {lista.isPending ? (
          <Cargando texto="Cargando pagos…" />
        ) : lista.isError ? (
          <Alerta tono="error">{lista.error.message}</Alerta>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            titulo="Sin pagos"
            texto={
              busqueda ? "Ningún pago coincide con esa búsqueda." : "No hay pagos en este estado."
            }
          />
        ) : (
          visibles.map((pago) => {
            const revisable =
              puedeGestionar &&
              pago.estado === "PENDIENTE" &&
              pago.estadoPedido === "PENDIENTE_PAGO" &&
              pago.medio !== "CONTRA_ENTREGA";
            return (
              <FilaLista
                key={pago.id}
                acciones={
                  revisable ? (
                    <Boton onClick={() => setRevisando(pago)}>Revisar</Boton>
                  ) : (
                    <Boton variante="secundario" onClick={() => setPedidoAbierto(pago.pedidoId)}>
                      Ver pedido
                    </Boton>
                  )
                }
              >
                <strong>
                  {pago.codigo} · {MONEDA.format(pago.monto)}
                </strong>
                <span>
                  {pago.cliente} · {ETIQUETAS_MEDIO_PAGO[pago.medio]}
                  {pago.referencia ? ` · Op. ${pago.referencia}` : ""}
                </span>
                <span>
                  {FECHA_HORA.format(new Date(pago.creadoEn))}
                  {pago.confirmadoPor && pago.confirmadoEn
                    ? ` · ${pago.estado === "CONFIRMADO" ? "Confirmó" : "Registró"} ${pago.confirmadoPor}`
                    : ""}
                </span>
                <span>
                  <Insignia tono={tonoDePago(pago.estado)}>{ETIQUETAS_PAGO[pago.estado]}</Insignia>{" "}
                  <Insignia tono={tonoDeEstado(pago.estadoPedido)}>
                    {ETIQUETAS[pago.estadoPedido]}
                  </Insignia>
                </span>
                {pago.comprobanteUrl ? (
                  <a href={pago.comprobanteUrl} target="_blank" rel="noreferrer">
                    Ver comprobante
                  </a>
                ) : null}
              </FilaLista>
            );
          })
        )}
      </Tarjeta>
    </>
  );
}

interface PropsRevisarPago {
  pago: Fila;
  onVolver: (mensaje?: string) => void;
  onVerPedido: () => void;
}

/** Un pago pendiente: confirmarlo con su numero de operacion o rechazarlo. */
function RevisarPago({ pago, onVolver, onVerPedido }: PropsRevisarPago) {
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
  const medio = ETIQUETAS_MEDIO_PAGO[pago.medio];

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <Tarjeta
        titulo={`Pago de ${pago.codigo}`}
        acciones={
          <>
            <Boton variante="secundario" onClick={onVerPedido}>
              Ver pedido
            </Boton>{" "}
            <Boton variante="secundario" onClick={() => onVolver()}>
              ← Volver a pagos
            </Boton>
          </>
        }
      >
        <p>
          Revisa en tu {medio} que entraron <strong>{MONEDA.format(pago.monto)}</strong>.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Confirmar">
        <Formulario
          onSubmit={(evento) => {
            evento.preventDefault();
            confirmar.mutate({ pedidoId: pago.pedidoId, pagoId: pago.id, referencia });
          }}
        >
          <p>Al confirmar, el pedido pasa a Pagado y se descuenta el stock.</p>
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
            rechazar.mutate({ pedidoId: pago.pedidoId, pagoId: pago.id, motivo });
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
