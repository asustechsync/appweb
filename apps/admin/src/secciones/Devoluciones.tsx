"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS, ETIQUETAS_DEVOLUCION, ETIQUETAS_MEDIO_PAGO } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  Cargando,
  EstadoVacio,
  FilaLista,
  Formulario,
  Insignia,
  Tarjeta,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";

import { DetallePedido } from "./DetallePedido";
import { tonoDeEstado } from "./Pedidos";
import { FECHA_HORA, MONEDA, mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";

/**
 * Devoluciones, cambios y reembolsos. Arriba se registra una nueva a partir
 * del codigo del pedido; abajo, las ya registradas con quien lo hizo.
 *
 * Que se puede devolver, cuanto reembolsar y que stock se mueve lo decide
 * @appweb/core (`revisarDevolucion`); esta pantalla muestra y envia.
 */
export function Devoluciones({ puedeGestionar }: { puedeGestionar: boolean }) {
  const trpc = useTRPC();
  const [codigo, setCodigo] = useState("");
  const [buscado, setBuscado] = useState<string | null>(null);
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const lista = useQuery(trpc.panel.devoluciones.listar.queryOptions());

  if (pedidoAbierto !== null) {
    return (
      <DetallePedido
        pedidoId={pedidoAbierto}
        puedeGestionar={puedeGestionar}
        onVolver={() => setPedidoAbierto(null)}
      />
    );
  }

  if (buscado !== null) {
    return (
      <RegistrarDevolucion
        codigo={buscado}
        puedeGestionar={puedeGestionar}
        onVolver={(mensaje) => {
          setBuscado(null);
          setAviso(mensaje ?? null);
          if (mensaje) setCodigo("");
        }}
      />
    );
  }

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <Tarjeta titulo="Registrar devolución">
        <Formulario
          onSubmit={(evento) => {
            evento.preventDefault();
            if (codigo.trim() !== "") setBuscado(codigo.trim());
          }}
        >
          <p>
            Busca el pedido por su código. Se puede devolver o cambiar prendas de un pedido
            entregado, y reembolsar el pago de uno cancelado.
          </p>
          <Campo
            id="codigo-devolucion"
            etiqueta="Código del pedido"
            valor={codigo}
            onCambio={setCodigo}
            requerido
          />
          <Boton tipo="submit" disabled={codigo.trim() === ""}>
            Buscar pedido
          </Boton>
        </Formulario>
      </Tarjeta>

      <Tarjeta titulo="Registradas">
        {lista.isPending ? (
          <Cargando texto="Cargando devoluciones…" />
        ) : lista.isError ? (
          <Alerta tono="error">{lista.error.message}</Alerta>
        ) : lista.data.devoluciones.length === 0 ? (
          <EstadoVacio titulo="Sin devoluciones" texto="Todavía no se registró ninguna." />
        ) : (
          lista.data.devoluciones.map((d) => (
            <FilaLista
              key={d.id}
              acciones={
                <Boton variante="secundario" onClick={() => setPedidoAbierto(d.pedidoId)}>
                  Ver pedido
                </Boton>
              }
            >
              <strong>
                {d.codigo} · {d.cliente}
              </strong>
              {d.vuelven.length > 0 ? <span>Vuelve: {d.vuelven.join(", ")}</span> : null}
              {d.salen.length > 0 ? <span>Sale: {d.salen.join(", ")}</span> : null}
              {d.nota ? <span>{d.nota}</span> : null}
              <span>
                {d.usuario ?? "Sistema"} · {FECHA_HORA.format(new Date(d.creadoEn))}
              </span>
              <span>
                <Insignia tono="neutro">{ETIQUETAS_DEVOLUCION[d.tipo]}</Insignia>
                {d.reembolso > 0 ? (
                  <>
                    {" "}
                    <Insignia tono="alerta">Reembolso {MONEDA.format(d.reembolso)}</Insignia>
                  </>
                ) : null}
              </span>
            </FilaLista>
          ))
        )}
      </Tarjeta>
    </>
  );
}

interface PropsRegistrar {
  codigo: string;
  puedeGestionar: boolean;
  onVolver: (mensaje?: string) => void;
}

interface Eleccion {
  cantidad: number;
  /** "" = sin cambio. */
  reemplazo: string;
}

function RegistrarDevolucion({ codigo, puedeGestionar, onVolver }: PropsRegistrar) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const consulta = useQuery(trpc.panel.devoluciones.pedido.queryOptions({ codigo }));

  const [elecciones, setElecciones] = useState<Record<string, Eleccion>>({});
  const [reembolso, setReembolso] = useState("");
  const [referencia, setReferencia] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registrar = useMutation(
    trpc.panel.devoluciones.registrar.mutationOptions({
      onSuccess: async (r) => {
        void queryClient.invalidateQueries(trpc.panel.devoluciones.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.pagos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
        const alDia = await revalidarTienda({ productos: r.productosTocados });
        onVolver(
          `${ETIQUETAS_DEVOLUCION[r.tipo]} de ${r.codigo} registrado.` +
            (alDia ? "" : " La tienda tardará unos minutos en mostrar el stock nuevo."),
        );
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  const volver = (
    <Boton variante="secundario" onClick={() => onVolver()}>
      ← Volver a devoluciones
    </Boton>
  );

  if (consulta.isPending) return <Cargando texto="Buscando pedido…" />;
  if (consulta.isError) {
    return (
      <Tarjeta acciones={volver}>
        <Alerta tono="error">{consulta.error.message}</Alerta>
      </Tarjeta>
    );
  }

  const p = consulta.data;
  const cancelado = p.estado === "CANCELADO";
  const eleccion = (varianteId: string): Eleccion =>
    elecciones[varianteId] ?? { cantidad: 0, reemplazo: "" };
  const elegir = (varianteId: string, cambio: Partial<Eleccion>) =>
    setElecciones((previas) => ({
      ...previas,
      [varianteId]: { ...eleccion(varianteId), ...cambio },
    }));

  const monto = reembolso.trim() === "" ? 0 : numeroDesdeTexto(reembolso);
  const sugerido = p.items.reduce(
    (suma, i) =>
      eleccion(i.varianteId).reemplazo === ""
        ? suma + eleccion(i.varianteId).cantidad * i.precioUnitario
        : suma,
    0,
  );
  const hayAlgo = p.items.some((i) => eleccion(i.varianteId).cantidad > 0) || monto > 0;

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <Tarjeta titulo={`Pedido ${p.codigo}`} acciones={volver}>
        <p>
          <Insignia tono={tonoDeEstado(p.estado)}>{ETIQUETAS[p.estado]}</Insignia>{" "}
          <Insignia tono="neutro">{ETIQUETAS_MEDIO_PAGO[p.medioPago]}</Insignia> {p.cliente} · Total{" "}
          {MONEDA.format(p.total)} · Reembolsable {MONEDA.format(p.reembolsable)}
        </p>
      </Tarjeta>

      {!p.admiteDevolucion ? (
        <Alerta tono="info">
          Este pedido está en {ETIQUETAS[p.estado]}. Las devoluciones se registran cuando ya se
          entregó; si no llegó a entregarse, cancélalo desde Pedidos.
        </Alerta>
      ) : !puedeGestionar ? (
        <Alerta tono="info">Tu rol puede ver devoluciones, pero no registrarlas.</Alerta>
      ) : (
        <Formulario
          ancho="completo"
          onSubmit={(evento) => {
            evento.preventDefault();
            registrar.mutate({
              pedidoId: p.id,
              lineas: p.items
                .map((i) => ({ varianteId: i.varianteId, ...eleccion(i.varianteId) }))
                .filter((l) => l.cantidad > 0)
                .map((l) => ({
                  varianteId: l.varianteId,
                  cantidad: l.cantidad,
                  ...(l.reemplazo === "" ? {} : { reemplazoVarianteId: l.reemplazo }),
                })),
              reembolso: Number.isNaN(monto) ? -1 : monto,
              ...(referencia.trim() === "" ? {} : { referencia }),
              motivo,
            });
          }}
        >
          {cancelado ? (
            <Alerta tono="info">
              El stock de este pedido ya volvió al almacén al cancelarlo. Aquí solo se registra el
              dinero que se le devuelve al cliente.
            </Alerta>
          ) : (
            <Tarjeta titulo="Prendas que vuelven">
              {p.items.map((i) => {
                const e = eleccion(i.varianteId);
                return (
                  <FilaLista key={i.varianteId}>
                    <strong>{i.nombreProducto}</strong>
                    <span>
                      {i.color} · Talla {i.talla} · {MONEDA.format(i.precioUnitario)} · quedan{" "}
                      {i.disponibles} de {i.cantidad}
                    </span>
                    <CampoSelect
                      id={`cantidad-${i.varianteId}`}
                      etiqueta="Unidades que vuelven"
                      valor={String(e.cantidad)}
                      disabled={i.disponibles === 0}
                      opciones={Array.from({ length: i.disponibles + 1 }, (_, n) => ({
                        valor: String(n),
                        etiqueta: String(n),
                      }))}
                      onCambio={(valor) => elegir(i.varianteId, { cantidad: Number(valor) })}
                    />
                    {e.cantidad > 0 ? (
                      <CampoSelect
                        id={`cambio-${i.varianteId}`}
                        etiqueta="¿Se cambia por otra talla o color?"
                        valor={e.reemplazo}
                        opciones={[
                          { valor: "", etiqueta: "No, es devolución" },
                          ...i.opcionesCambio.map((v) => ({
                            valor: v.id,
                            etiqueta: `${v.color} · Talla ${v.talla} (stock ${v.stock})`,
                          })),
                        ]}
                        onCambio={(valor) => elegir(i.varianteId, { reemplazo: valor })}
                      />
                    ) : null}
                  </FilaLista>
                );
              })}
            </Tarjeta>
          )}

          <Tarjeta titulo="Reembolso">
            <p>
              {sugerido > 0
                ? `Lo devuelto suma ${MONEDA.format(sugerido)}. `
                : "Deja el monto vacío si no se devuelve dinero. "}
              Hazlo primero por {ETIQUETAS_MEDIO_PAGO[p.medioPago]} y copia aquí el número de
              operación.
            </p>
            <Campo
              id="monto-reembolso"
              etiqueta="Monto a reembolsar (S/)"
              valor={reembolso}
              onCambio={setReembolso}
              placeholder="0.00"
            />
            {monto > 0 ? (
              <Campo
                id="referencia-reembolso"
                etiqueta="Número de operación del reembolso"
                valor={referencia}
                onCambio={setReferencia}
                requerido={p.medioPago !== "CONTRA_ENTREGA"}
              />
            ) : null}
          </Tarjeta>

          <Campo
            id="motivo-devolucion"
            etiqueta="Motivo"
            valor={motivo}
            onCambio={setMotivo}
            placeholder="Talla pequeña, falla de costura, no le gustó el color…"
            requerido
          />
          <Boton tipo="submit" disabled={registrar.isPending || !hayAlgo || motivo.trim() === ""}>
            {registrar.isPending ? "Registrando…" : "Registrar"}
          </Boton>
        </Formulario>
      )}
    </>
  );
}
