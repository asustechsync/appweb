"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETAS,
  ETIQUETAS_DEVOLUCION,
  ETIQUETAS_MEDIO_PAGO,
  type TipoDevolucion,
} from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoSelect,
  CampoSelectorLista,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  EstadoVacio,
  FilaLista,
  FilaPedido,
  Formulario,
  IconoBuscar,
  IconoDevolucion,
  IconoMensaje,
  IconoPedidos,
  LimpiarFiltros,
  ListaConLateral,
  LogoIcono,
  Paginador,
  RejillaBento,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useEscritorio } from "@/lib/use-escritorio";
import { usePaginado } from "@/lib/use-paginado";
import { useTRPC } from "@/lib/trpc";

import { DetallePedido } from "./DetallePedido";
import { tonoDeEstado } from "./Pedidos";
import {
  FECHA_HORA,
  MONEDA,
  diaYHora,
  mensajeDeFallo,
  numeroDesdeTexto,
} from "@appweb/core/formato";

/** El cambio no mueve dinero; la devolucion devuelve prendas; el reembolso solo dinero. */
const TONO_DEVOLUCION: Record<TipoDevolucion, "neutro" | "alerta" | "error"> = {
  CAMBIO: "neutro",
  DEVOLUCION: "alerta",
  REEMBOLSO: "error",
};

type FiltroDevoluciones = "TODAS" | TipoDevolucion;

const FILTROS: { id: FiltroDevoluciones; etiqueta: string }[] = [
  { id: "TODAS", etiqueta: "Todos los tipos" },
  { id: "DEVOLUCION", etiqueta: "Devoluciones" },
  { id: "CAMBIO", etiqueta: "Cambios" },
  { id: "REEMBOLSO", etiqueta: "Reembolsos" },
];

/** Cuantas devoluciones se ven por pagina. */
const PAGINA = 10;

/**
 * Devoluciones, cambios y reembolsos. Arriba las cifras y el buscador de
 * pedido para registrar una nueva; abajo, las ya registradas con vista previa
 * al lado (escritorio).
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
  const [filtro, setFiltro] = useState<FiltroDevoluciones>("TODAS");
  const [busqueda, setBusqueda] = useState("");

  const lista = useQuery(trpc.panel.devoluciones.listar.queryOptions());
  const todas = lista.data?.devoluciones ?? [];

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data?.devoluciones ?? []).filter(
      (d) =>
        (filtro === "TODAS" || d.tipo === filtro) &&
        (termino === "" ||
          d.codigo.toLowerCase().includes(termino) ||
          d.cliente.toLowerCase().includes(termino)),
    );
  }, [busqueda, filtro, lista.data]);
  const { pagina, paginas, setPagina, visibles } = usePaginado(coinciden, PAGINA);

  const escritorio = useEscritorio();
  const [elegida, setElegida] = useState<string | null>(null);
  const seleccionada = visibles.find((d) => d.id === elegida) ?? visibles[0] ?? null;

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

  const contar = (tipo: TipoDevolucion) => todas.filter((d) => d.tipo === tipo).length;
  const opciones = FILTROS.map((f) => {
    const cantidad = f.id === "TODAS" ? 0 : contar(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const reembolsado = todas.reduce((suma, d) => suma + d.reembolso, 0);
  const buscar = () => {
    if (codigo.trim() !== "") setBuscado(codigo.trim());
  };

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <Tarjeta
        titulo="Devoluciones"
        sinMarco
        acciones={
          <>
            <Campo
              id="codigo-devolucion"
              etiqueta="Código del pedido a devolver"
              etiquetaOculta
              icono={<IconoPedidos tamano={16} />}
              valor={codigo}
              onCambio={setCodigo}
              placeholder="Código del pedido"
            />
            <Boton disabled={codigo.trim() === ""} onClick={buscar}>
              Registrar
            </Boton>
          </>
        }
      >
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Devoluciones"
            valor={String(contar("DEVOLUCION"))}
            contexto="Prendas que vuelven al almacén"
          />
          <TarjetaMetrica
            etiqueta="Cambios"
            valor={String(contar("CAMBIO"))}
            contexto="Otra talla o color"
          />
          <TarjetaMetrica
            etiqueta="Reembolsos"
            valor={String(contar("REEMBOLSO"))}
            contexto="Solo dinero, sin prendas"
          />
          <TarjetaMetrica
            etiqueta="Reembolsado"
            valor={MONEDA.format(reembolsado)}
            contexto={`En ${todas.length} ${todas.length === 1 ? "registro" : "registros"}`}
          />
        </RejillaMetricas>
      </Tarjeta>

      <ListaConLateral
        filasPorPagina={PAGINA}
        barra={
          <BarraLista
            juntos
            buscador={
              <Campo
                id="busqueda-devoluciones"
                etiqueta="Buscar por código o cliente"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Pedido o cliente"
              />
            }
          >
            <Paginador pagina={pagina} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id="filtro-devoluciones"
              ancho="amplio"
              etiqueta="Tipo"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as FiltroDevoluciones);
                setPagina(1);
              }}
            />
            {filtro !== "TODAS" || busqueda !== "" ? (
              <LimpiarFiltros
                onClick={() => {
                  setFiltro("TODAS");
                  setBusqueda("");
                  setPagina(1);
                }}
              />
            ) : null}
          </BarraLista>
        }
        lateral={
          <VistaPrevia
            logo={null}
            estado={{ texto: "", tono: "neutro" }}
            etiqueta=""
            monto=""
            {...(seleccionada ? {} : { vacio: "Elige una devolución para ver su resumen." })}
          >
            {seleccionada ? (
              <CuadrosDevolucion
                devolucion={seleccionada}
                onVerPedido={() => setPedidoAbierto(seleccionada.pedidoId)}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando devoluciones…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin devoluciones"
              texto={
                todas.length === 0
                  ? "Todavía no se registró ninguna."
                  : "Ninguna coincide con esa búsqueda o ese tipo."
              }
            />
          ) : (
            <div>
              {visibles.map((d) => {
                const { dia, hora } = diaYHora(new Date(d.creadoEn));
                return (
                  <FilaPedido
                    key={d.id}
                    logo={<LogoIcono icono={<IconoDevolucion tamano={16} />} nombre="Devolución" />}
                    titulo={d.codigo}
                    detalle={d.cliente}
                    contenido={resumenDePrendas(d)}
                    centro={[dia, hora]}
                    estado={{ texto: ETIQUETAS_DEVOLUCION[d.tipo], tono: TONO_DEVOLUCION[d.tipo] }}
                    {...(d.reembolso > 0 ? { nota: MONEDA.format(d.reembolso) } : {})}
                    seleccionada={escritorio && seleccionada?.id === d.id}
                    onAbrir={() => (escritorio ? setElegida(d.id) : setPedidoAbierto(d.pedidoId))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Ver pedido de"} la devolución de ${d.codigo}`}
                  />
                );
              })}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}

interface DevolucionDeLista {
  codigo: string;
  cliente: string;
  tipo: TipoDevolucion;
  vuelven: string[];
  salen: string[];
  reembolso: number;
  nota: string | null;
  usuario: string | null;
  creadoEn: string;
}

/** Segunda linea de la fila: cuantas prendas vuelven o salen, o solo dinero. */
function resumenDePrendas(d: DevolucionDeLista): string {
  const partes: string[] = [];
  if (d.vuelven.length > 0) partes.push(`Vuelven ${d.vuelven.length}`);
  if (d.salen.length > 0) partes.push(`salen ${d.salen.length}`);
  return partes.length > 0 ? partes.join(" · ") : "Solo reembolso";
}

/** Vista previa de una devolucion: lo que vuelve, lo que sale y el dinero. */
function CuadrosDevolucion({
  devolucion: d,
  onVerPedido,
}: {
  devolucion: DevolucionDeLista;
  onVerPedido: () => void;
}) {
  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoIcono icono={<IconoDevolucion tamano={16} />} nombre="Devolución" />}
        estado={{ texto: ETIQUETAS_DEVOLUCION[d.tipo], tono: TONO_DEVOLUCION[d.tipo] }}
        etiqueta={d.reembolso > 0 ? `Reembolso · ${d.codigo}` : `Pedido ${d.codigo}`}
        monto={d.reembolso > 0 ? MONEDA.format(d.reembolso) : "Sin reembolso"}
        texto={d.reembolso === 0}
        detalle={FECHA_HORA.format(new Date(d.creadoEn))}
        acciones={[{ etiqueta: "Ver pedido", onClick: onVerPedido }]}
      />
      {d.vuelven.length > 0 ? (
        <CuadroDesglose
          icono={<IconoDevolucion tamano={16} />}
          titulo="Vuelven al almacén"
          ancho="ancho"
          lineas={d.vuelven.map((prenda) => ({ etiqueta: prenda, valor: "" }))}
        />
      ) : null}
      {d.salen.length > 0 ? (
        <CuadroDesglose
          icono={<IconoPedidos tamano={16} />}
          titulo="Salen en el cambio"
          ancho="ancho"
          lineas={d.salen.map((prenda) => ({ etiqueta: prenda, valor: "" }))}
        />
      ) : null}
      <CuadroBento
        icono={<IconoMensaje tamano={16} />}
        titulo="Motivo"
        ancho="ancho"
        detalle={`${d.usuario ?? "Sistema"} · ${d.cliente}`}
        vacio={!d.nota}
      >
        {d.nota ?? "Sin motivo escrito"}
      </CuadroBento>
    </RejillaBento>
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

      <Tarjeta titulo={`Pedido ${p.codigo}`} sinMarco acciones={volver}>
        <RejillaBento>
          <CuadroMonto
            logo={<LogoIcono icono={<IconoPedidos tamano={16} />} nombre="Pedido" />}
            estado={{ texto: ETIQUETAS[p.estado], tono: tonoDeEstado(p.estado) }}
            etiqueta={`Total · ${ETIQUETAS_MEDIO_PAGO[p.medioPago]}`}
            monto={MONEDA.format(p.total)}
            detalle={p.cliente}
          />
          <CuadroBento icono={<IconoDevolucion tamano={16} />} titulo="Reembolsable" ancho="ancho">
            {MONEDA.format(p.reembolsable)}
          </CuadroBento>
        </RejillaBento>
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
