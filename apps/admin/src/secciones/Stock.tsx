"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS_MOVIMIENTO, type TipoMovimientoManual } from "@appweb/core";
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
  Tarjeta,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
import { FECHA_HORA } from "@appweb/core/formato";

type Filtro = "BAJO" | "TODAS";

interface VarianteDeStock {
  id: string;
  producto: string;
  talla: string;
  color: string;
  sku: string;
  stock: number;
  activa: boolean;
}

function tonoDeStock(stock: number, umbral: number): "error" | "alerta" | "exito" {
  if (stock === 0) return "error";
  if (stock <= umbral) return "alerta";
  return "exito";
}

/**
 * Seccion de stock: cuanto queda de cada talla y color, y los tres
 * movimientos que se registran a mano (ingreso, ajuste por conteo, merma).
 * Las ventas y devoluciones no se registran aqui: las deja el pedido.
 */
export function Stock() {
  const trpc = useTRPC();
  const [filtro, setFiltro] = useState<Filtro>("BAJO");
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta] = useState<VarianteDeStock | null>(null);

  const lista = useQuery(trpc.panel.stock.listar.queryOptions());
  const umbral = lista.data?.umbralBajo ?? 0;

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data?.variantes ?? []).filter((v) => {
      if (filtro === "BAJO" && (v.stock > umbral || !v.activa)) return false;
      if (termino === "") return true;
      return (
        v.producto.toLowerCase().includes(termino) ||
        v.sku.toLowerCase().includes(termino) ||
        v.color.toLowerCase().includes(termino)
      );
    });
  }, [busqueda, filtro, lista.data, umbral]);

  if (abierta !== null) {
    // Datos frescos de la lista si ya cambiaron (tras registrar un movimiento).
    const actual = lista.data?.variantes.find((v) => v.id === abierta.id) ?? abierta;
    return (
      <MovimientosVariante variante={actual} umbral={umbral} onVolver={() => setAbierta(null)} />
    );
  }

  const bajas = (lista.data?.variantes ?? []).filter((v) => v.activa && v.stock <= umbral).length;

  return (
    <Tarjeta titulo="Stock">
      <Campo
        id="busqueda-stock"
        etiqueta="Buscar por producto, color o SKU"
        valor={busqueda}
        onCambio={setBusqueda}
        placeholder="Buscar…"
      />
      <Pestanas
        etiqueta="Qué variantes mostrar"
        opciones={[
          { id: "BAJO", etiqueta: bajas > 0 ? `Por reponer (${bajas})` : "Por reponer" },
          { id: "TODAS", etiqueta: "Todas" },
        ]}
        activa={filtro}
        onCambio={(id) => setFiltro(id as Filtro)}
      />

      {lista.isPending ? (
        <Cargando texto="Cargando stock…" />
      ) : lista.isError ? (
        <Alerta tono="error">{lista.error.message}</Alerta>
      ) : visibles.length === 0 ? (
        <EstadoVacio
          titulo={filtro === "BAJO" && !busqueda ? "Nada por reponer" : "Sin resultados"}
          texto={
            filtro === "BAJO" && !busqueda
              ? `Todas las variantes en venta tienen más de ${umbral} unidades.`
              : "Ninguna variante coincide con esa búsqueda."
          }
        />
      ) : (
        visibles.map((v) => (
          <FilaLista
            key={v.id}
            acciones={
              <Boton variante="secundario" onClick={() => setAbierta(v)}>
                Mover stock
              </Boton>
            }
          >
            <strong>{v.producto}</strong>
            <span>
              Talla {v.talla} · {v.color} · SKU {v.sku}
            </span>
            <span>
              <Insignia tono={tonoDeStock(v.stock, umbral)}>{v.stock} en stock</Insignia>
              {!v.activa ? (
                <>
                  {" "}
                  <Insignia tono="neutro">No está a la venta</Insignia>
                </>
              ) : null}
            </span>
          </FilaLista>
        ))
      )}
    </Tarjeta>
  );
}

// ── Movimientos de una variante ─────────────────────────────────────────────

/** Que se pide en cada tipo de movimiento. */
const FORMULARIO: Record<
  TipoMovimientoManual,
  { cantidad: string; nota: string; boton: string; ayuda: string }
> = {
  INGRESO: {
    cantidad: "Unidades que entran",
    nota: "Nota (opcional): proveedor, guía…",
    boton: "Registrar ingreso",
    ayuda: "Mercadería nueva que llega al almacén.",
  },
  AJUSTE: {
    cantidad: "Unidades contadas en el almacén",
    nota: "Motivo del ajuste (obligatorio)",
    boton: "Ajustar al conteo",
    ayuda: "Escribe lo que contaste: el sistema registra la diferencia.",
  },
  MERMA: {
    cantidad: "Unidades dañadas o perdidas",
    nota: "Qué pasó (obligatorio)",
    boton: "Dar de baja",
    ayuda: "Prendas que ya no se pueden vender.",
  },
};

interface PropsMovimientosVariante {
  variante: VarianteDeStock;
  umbral: number;
  onVolver: () => void;
}

function MovimientosVariante({ variante, umbral, onVolver }: PropsMovimientosVariante) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const historial = useQuery(trpc.panel.stock.historial.queryOptions({ varianteId: variante.id }));

  const [tipo, setTipo] = useState<TipoMovimientoManual>("INGRESO");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const registrar = useMutation(
    trpc.panel.stock.registrar.mutationOptions({
      onSuccess: async (r) => {
        setError(null);
        setCantidad("");
        setNota("");
        const tiendaAlDia = await revalidarTienda(r.revalidar);
        setAviso(
          `Listo: ahora hay ${r.stockNuevo} en stock.` +
            (tiendaAlDia ? "" : " La tienda tardará unos minutos en mostrarlo."),
        );
        void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
      },
      onError: (fallo) => {
        setAviso(null);
        setError(fallo.message);
      },
    }),
  );

  const textos = FORMULARIO[tipo];

  return (
    <>
      <Tarjeta
        titulo={variante.producto}
        acciones={
          <Boton variante="secundario" onClick={onVolver}>
            ← Volver a stock
          </Boton>
        }
      >
        <p>
          Talla {variante.talla} · {variante.color} · SKU {variante.sku}
        </p>
        <p>
          <Insignia tono={tonoDeStock(variante.stock, umbral)}>{variante.stock} en stock</Insignia>
        </p>
      </Tarjeta>

      <Tarjeta titulo="Registrar movimiento">
        {error ? <Alerta tono="error">{error}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
        <Pestanas
          etiqueta="Tipo de movimiento"
          opciones={[
            { id: "INGRESO", etiqueta: "Ingreso" },
            { id: "AJUSTE", etiqueta: "Ajuste por conteo" },
            { id: "MERMA", etiqueta: "Merma" },
          ]}
          activa={tipo}
          onCambio={(id) => {
            setTipo(id as TipoMovimientoManual);
            setError(null);
          }}
        />
        <Formulario
          onSubmit={(evento) => {
            evento.preventDefault();
            registrar.mutate({
              varianteId: variante.id,
              tipo,
              cantidad: cantidad.trim() === "" ? Number.NaN : Number(cantidad),
              ...(nota.trim() === "" ? {} : { nota }),
            });
          }}
        >
          <p>{textos.ayuda}</p>
          <Campo
            id="movimiento-cantidad"
            etiqueta={textos.cantidad}
            valor={cantidad}
            onCambio={setCantidad}
            requerido
          />
          <Campo
            id="movimiento-nota"
            etiqueta={textos.nota}
            valor={nota}
            onCambio={setNota}
            requerido={tipo !== "INGRESO"}
          />
          <Boton tipo="submit" disabled={registrar.isPending || cantidad.trim() === ""}>
            {registrar.isPending ? "Guardando…" : textos.boton}
          </Boton>
        </Formulario>
      </Tarjeta>

      <Tarjeta titulo="Historial">
        {historial.isPending ? (
          <Cargando texto="Cargando historial…" />
        ) : historial.isError ? (
          <Alerta tono="error">{historial.error.message}</Alerta>
        ) : historial.data.length === 0 ? (
          <EstadoVacio titulo="Sin movimientos" texto="Esta variante todavía no tiene historial." />
        ) : (
          historial.data.map((m) => (
            <FilaLista key={m.id}>
              <span>
                <Insignia tono={m.delta > 0 ? "exito" : "alerta"}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </Insignia>{" "}
                <strong>{ETIQUETAS_MOVIMIENTO[m.motivo]}</strong>
                {m.pedido ? ` · pedido ${m.pedido}` : ""}
              </span>
              {m.nota ? <span>{m.nota}</span> : null}
              <span>
                {m.usuario ?? "Sistema"} · {FECHA_HORA.format(new Date(m.creadoEn))}
              </span>
            </FilaLista>
          ))
        )}
      </Tarjeta>
    </>
  );
}
