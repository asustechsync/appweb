"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { departamentosDesdeTexto, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  Casilla,
  EstadoVacio,
  FilaLista,
  FilaUnida,
  Formulario,
  Insignia,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { revalidarEnvios } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";

const MONEDA = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

type Pestana = "PAGADO" | "PREPARANDO" | "ENVIADO" | "TARIFAS";

/** El siguiente paso de cada estado de la cola, como lo lee el almacen. */
const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; boton: string }>> = {
  PAGADO: { estado: "PREPARANDO", boton: "Empezar a preparar" },
  PREPARANDO: { estado: "ENVIADO", boton: "Marcar enviado" },
  ENVIADO: { estado: "ENTREGADO", boton: "Marcar entregado" },
};

/**
 * Seccion de envios: lo que el almacen tiene que preparar, despachar y
 * entregar. No muestra montos ni deja cancelar: los pasos permitidos los
 * decide `revisarDespacho` de @appweb/core.
 */
export function Envios({ puedeTarifas }: { puedeTarifas: boolean }) {
  const trpc = useTRPC();
  const [pestana, setPestana] = useState<Pestana>("PAGADO");
  const cola = useQuery(trpc.panel.envios.cola.queryOptions());

  const pedidos = cola.data ?? [];
  const cuenta = (estado: EstadoPedido) => pedidos.filter((p) => p.estado === estado).length;
  const etiqueta = (texto: string, n: number) => (n > 0 ? `${texto} (${n})` : texto);

  const opciones = [
    { id: "PAGADO", etiqueta: etiqueta("Por preparar", cuenta("PAGADO")) },
    { id: "PREPARANDO", etiqueta: etiqueta("Preparando", cuenta("PREPARANDO")) },
    { id: "ENVIADO", etiqueta: etiqueta("En camino", cuenta("ENVIADO")) },
    ...(puedeTarifas ? [{ id: "TARIFAS", etiqueta: "Tarifas" }] : []),
  ];

  return (
    <Tarjeta titulo="Envíos">
      <Pestanas
        etiqueta="Etapa del despacho"
        opciones={opciones}
        activa={pestana}
        onCambio={(id) => setPestana(id as Pestana)}
      />
      {pestana === "TARIFAS" ? (
        <Tarifas />
      ) : cola.isPending ? (
        <Cargando texto="Cargando envíos…" />
      ) : cola.isError ? (
        <Alerta tono="error">{cola.error.message}</Alerta>
      ) : (
        <ColaDeEtapa estado={pestana} pedidos={pedidos.filter((p) => p.estado === pestana)} />
      )}
    </Tarjeta>
  );
}

// ── Cola de una etapa ───────────────────────────────────────────────────────

interface PedidoDeCola {
  id: string;
  codigo: string;
  estado: EstadoPedido;
  cobrarAlEntregar: boolean;
  creadoEn: string;
  destinatario: string;
  telefono: string | null;
  direccion: string;
  referencia: string | null;
  metodo: string;
  transportista: string | null;
  codigoSeguimiento: string | null;
  items: { nombreProducto: string; sku: string; talla: string; color: string; cantidad: number }[];
}

const VACIA: Record<Exclude<Pestana, "TARIFAS">, string> = {
  PAGADO: "No hay pedidos pagados esperando preparación.",
  PREPARANDO: "No hay pedidos en preparación.",
  ENVIADO: "No hay pedidos en camino.",
};

function ColaDeEtapa({
  estado,
  pedidos,
}: {
  estado: Exclude<Pestana, "TARIFAS">;
  pedidos: PedidoDeCola[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [transportista, setTransportista] = useState("");
  const [seguimiento, setSeguimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const avanzar = useMutation(
    trpc.panel.envios.avanzar.mutationOptions({
      onSuccess: (r, v) => {
        setError(null);
        setAbierto(null);
        setTransportista("");
        setSeguimiento("");
        const textos: Partial<Record<EstadoPedido, string>> = {
          PREPARANDO: "pasó a preparación",
          ENVIADO: "quedó como enviado",
          ENTREGADO: "quedó como entregado",
        };
        setAviso(`${r.codigo} ${textos[v.estado] ?? "se actualizó"}.`);
        void queryClient.invalidateQueries(trpc.panel.envios.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
      },
      onError: (fallo) => {
        setAviso(null);
        setError(fallo.message);
      },
    }),
  );

  const paso = SIGUIENTE[estado];

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      {pedidos.length === 0 ? (
        <EstadoVacio titulo="Nada por aquí" texto={VACIA[estado]} />
      ) : (
        pedidos.map((p) => (
          <FilaLista
            key={p.id}
            acciones={
              paso && abierto !== p.id ? (
                <Boton
                  variante={estado === "PAGADO" ? "primario" : "secundario"}
                  disabled={avanzar.isPending}
                  onClick={() =>
                    // Enviar pide transportista y codigo: abre el formulario.
                    paso.estado === "ENVIADO"
                      ? setAbierto(p.id)
                      : avanzar.mutate({ pedidoId: p.id, estado: paso.estado })
                  }
                >
                  {paso.boton}
                </Boton>
              ) : null
            }
          >
            <strong>
              {p.codigo} · {p.destinatario}
            </strong>
            <span>
              {p.direccion}
              {p.referencia ? ` (Ref.: ${p.referencia})` : ""}
            </span>
            <span>
              {p.telefono ? `${p.telefono} · ` : ""}
              {p.metodo} · {FECHA.format(new Date(p.creadoEn))}
            </span>
            <span>
              {p.cobrarAlEntregar ? <Insignia tono="alerta">Cobrar al entregar</Insignia> : null}
              {p.transportista || p.codigoSeguimiento ? (
                <Insignia tono="neutro">
                  {p.transportista ?? "Transportista"} · {p.codigoSeguimiento ?? "sin código"}
                </Insignia>
              ) : null}
            </span>
            {p.items.map((item) => (
              <span key={item.sku}>
                {item.cantidad} × {item.nombreProducto} · Talla {item.talla} · {item.color}
              </span>
            ))}
            {abierto === p.id ? (
              <Formulario
                onSubmit={(evento) => {
                  evento.preventDefault();
                  avanzar.mutate({
                    pedidoId: p.id,
                    estado: "ENVIADO",
                    ...(transportista.trim() ? { transportista } : {}),
                    ...(seguimiento.trim() ? { codigoSeguimiento: seguimiento } : {}),
                  });
                }}
              >
                <FilaUnida iguales>
                  <Campo
                    id={`transportista-${p.id}`}
                    etiqueta="Transportista"
                    valor={transportista}
                    onCambio={setTransportista}
                    placeholder="Olva, Shalom…"
                  />
                  <Campo
                    id={`seguimiento-${p.id}`}
                    etiqueta="Código de seguimiento"
                    valor={seguimiento}
                    onCambio={setSeguimiento}
                    placeholder="Opcional"
                  />
                </FilaUnida>
                <Boton tipo="submit" disabled={avanzar.isPending}>
                  {avanzar.isPending ? "Guardando…" : "Confirmar envío"}
                </Boton>
                <Boton variante="secundario" onClick={() => setAbierto(null)}>
                  Cancelar
                </Boton>
              </Formulario>
            ) : null}
          </FilaLista>
        ))
      )}
    </>
  );
}

// ── Tarifas ─────────────────────────────────────────────────────────────────

interface MetodoDeEnvio {
  id: string;
  nombre: string;
  costo: number;
  gratisDesde: number | null;
  departamentos: string[];
  activo: boolean;
  orden: number;
}

/** "12,50" -> 12.5; vacio -> NaN, que zod rechaza con su mensaje. */
function aNumero(texto: string): number {
  return texto.trim() === "" ? Number.NaN : Number(texto.trim().replace(",", "."));
}

function Tarifas() {
  const trpc = useTRPC();
  const metodos = useQuery(trpc.panel.envios.metodos.queryOptions());
  // "nuevo" o el id del metodo que se edita.
  const [editando, setEditando] = useState<string | null>(null);

  if (metodos.isPending) return <Cargando texto="Cargando tarifas…" />;
  if (metodos.isError) return <Alerta tono="error">{metodos.error.message}</Alerta>;

  return (
    <>
      <p>
        Lo que cobra cada método y a dónde llega. Los cambios se ven en el checkout en cuanto los
        guardas.
      </p>
      {metodos.data.map((m) =>
        editando === m.id ? (
          <FormularioMetodo key={m.id} metodo={m} onListo={() => setEditando(null)} />
        ) : (
          <FilaLista
            key={m.id}
            acciones={
              <Boton variante="secundario" onClick={() => setEditando(m.id)}>
                Editar
              </Boton>
            }
          >
            <strong>
              {m.nombre} · {MONEDA.format(m.costo)}
            </strong>
            <span>
              {m.gratisDesde !== null
                ? `Gratis desde ${MONEDA.format(m.gratisDesde)}`
                : "Nunca es gratis"}{" "}
              · {m.departamentos.length > 0 ? m.departamentos.join(", ") : "Todo el país"}
            </span>
            <span>
              <Insignia tono={m.activo ? "exito" : "alerta"}>
                {m.activo ? "Activo" : "Oculto"}
              </Insignia>
            </span>
          </FilaLista>
        ),
      )}
      {editando === "nuevo" ? (
        <FormularioMetodo metodo={null} onListo={() => setEditando(null)} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nuevo")}>
          + Nuevo método de envío
        </Boton>
      )}
    </>
  );
}

function FormularioMetodo({
  metodo,
  onListo,
}: {
  metodo: MetodoDeEnvio | null;
  onListo: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(metodo?.nombre ?? "");
  const [costo, setCosto] = useState(metodo ? String(metodo.costo) : "");
  const [gratisDesde, setGratisDesde] = useState(
    metodo?.gratisDesde != null ? String(metodo.gratisDesde) : "",
  );
  const [departamentos, setDepartamentos] = useState(metodo?.departamentos.join(", ") ?? "");
  const [activo, setActivo] = useState(metodo?.activo ?? true);
  const [orden, setOrden] = useState(String(metodo?.orden ?? 0));
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.envios.guardarMetodo.mutationOptions({
      onSuccess: async () => {
        await revalidarEnvios();
        void queryClient.invalidateQueries(trpc.panel.envios.pathFilter());
        onListo();
      },
      onError: (fallo) => setError(fallo.message),
    }),
  );

  return (
    <Formulario
      ancho="completo"
      onSubmit={(evento) => {
        evento.preventDefault();
        guardar.mutate({
          ...(metodo ? { metodoId: metodo.id } : {}),
          nombre,
          costo: aNumero(costo),
          gratisDesde: gratisDesde.trim() === "" ? null : aNumero(gratisDesde),
          departamentos: departamentosDesdeTexto(departamentos),
          activo,
          orden: Math.trunc(aNumero(orden || "0")),
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <Campo id="metodo-nombre" etiqueta="Nombre" valor={nombre} onCambio={setNombre} requerido />
      <FilaUnida iguales>
        <Campo
          id="metodo-costo"
          etiqueta="Costo (S/)"
          valor={costo}
          onCambio={setCosto}
          requerido
        />
        <Campo
          id="metodo-gratis"
          etiqueta="Gratis desde (S/)"
          valor={gratisDesde}
          onCambio={setGratisDesde}
          placeholder="Vacío = nunca"
        />
      </FilaUnida>
      <Campo
        id="metodo-departamentos"
        etiqueta="Departamentos, separados por coma"
        valor={departamentos}
        onCambio={setDepartamentos}
        placeholder="Vacío = todo el país"
      />
      <Campo id="metodo-orden" etiqueta="Orden en el checkout" valor={orden} onCambio={setOrden} />
      <Casilla
        id="metodo-activo"
        etiqueta="Se ofrece en el checkout"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar método"}
      </Boton>
      <Boton variante="secundario" onClick={onListo}>
        Cancelar
      </Boton>
    </Formulario>
  );
}
