"use client";

import { useMemo, useState } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DIAS_DEMORA_ENVIO,
  departamentosDesdeTexto,
  ETIQUETAS_PERIODO,
  PERIODOS,
  type EstadoPedido,
  type Periodo,
} from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoSelectorLista,
  Cargando,
  Casilla,
  EstadoVacio,
  FilaLista,
  FilaMovimiento,
  FilaUnida,
  Formulario,
  IconoBuscar,
  IconoCamion,
  Insignia,
  ListaConLateral,
  LogoIcono,
  RejillaMetricas,
  SelectorCalendario,
  SelectorSegmentado,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";

import { CuadrosEnvio, ETAPA_ENVIO, tonoDeEtapa, type EnvioDeCola } from "./CuadrosEnvio";
import {
  MONEDA,
  conSigno,
  cuandoFue,
  mensajeDeFallo,
  numeroDesdeTexto,
} from "@appweb/core/formato";

type Filtro = "TODOS" | "PAGADO" | "PREPARANDO" | "ENVIADO" | "TARIFAS";

/** El siguiente paso de cada estado de la cola, como lo lee el almacen. */
const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; boton: string }>> = {
  PAGADO: { estado: "PREPARANDO", boton: "Empezar a preparar" },
  PREPARANDO: { estado: "ENVIADO", boton: "Marcar enviado" },
  ENVIADO: { estado: "ENTREGADO", boton: "Marcar entregado" },
};

/** "2 pedidos esperan · el más antiguo hace 3 h", o el texto de cola vacia. */
function contextoDeCola(cantidad: number, masAntiguo: string | null, vacia: string): string {
  if (cantidad === 0 || masAntiguo === null) return vacia;
  const esperan = cantidad === 1 ? "pedido espera" : "pedidos esperan";
  return `${cantidad} ${esperan} · el más antiguo ${cuandoFue(new Date(masAntiguo)).toLowerCase()}`;
}

const AVISO_PASO: Partial<Record<EstadoPedido, string>> = {
  PREPARANDO: "pasó a preparación",
  ENVIADO: "quedó como enviado",
  ENTREGADO: "quedó como entregado",
};

/**
 * Seccion de envios: a donde va cada pedido y en que paso del despacho esta.
 * Lista con vista previa al lado (escritorio). No muestra montos ni deja
 * cancelar: los pasos permitidos los decide `revisarDespacho` de @appweb/core.
 */
export function Envios({ puedeTarifas }: { puedeTarifas: boolean }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const cola = useQuery(trpc.panel.envios.cola.queryOptions());

  const [periodo, setPeriodo] = useState<Periodo>("dia");
  // Un dia concreto del calendario; con fecha elegida manda sobre el periodo.
  const [fecha, setFecha] = useState("");
  // Aparte de la cola: cambiar el periodo no la recarga, y se conservan las
  // cifras anteriores mientras llegan las nuevas.
  const metricas = useQuery({
    ...trpc.panel.envios.metricas.queryOptions({ periodo, ...(fecha ? { fecha } : {}) }),
    placeholderData: keepPreviousData,
  });

  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  // En movil no hay vista previa: tocar una fila la abre a pantalla completa.
  const [abiertoMovil, setAbiertoMovil] = useState<string | null>(null);
  // Pedido con el formulario de "Marcar enviado" abierto.
  const [enviando, setEnviando] = useState<string | null>(null);
  const [transportista, setTransportista] = useState("");
  const [seguimiento, setSeguimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const avanzar = useMutation(
    trpc.panel.envios.avanzar.mutationOptions({
      onSuccess: (r, v) => {
        setError(null);
        setEnviando(null);
        setTransportista("");
        setSeguimiento("");
        setAviso(`${r.codigo} ${AVISO_PASO[v.estado] ?? "se actualizó"}.`);
        // Incluye las tarjetas: un paso mueve las colas y los despachados.
        void queryClient.invalidateQueries(trpc.panel.envios.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.pedidos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
      },
      onError: (fallo) => {
        setAviso(null);
        setError(mensajeDeFallo(fallo));
      },
    }),
  );

  const visibles = useMemo(() => {
    const pedidos: EnvioDeCola[] = cola.data ?? [];
    const termino = busqueda.trim().toLowerCase();
    return pedidos.filter(
      (p) =>
        (filtro === "TODOS" || p.estado === filtro) &&
        (termino === "" ||
          p.codigo.toLowerCase().includes(termino) ||
          p.destinatario.toLowerCase().includes(termino) ||
          p.distrito.toLowerCase().includes(termino) ||
          (p.codigoSeguimiento ?? "").toLowerCase().includes(termino)),
    );
  }, [cola.data, filtro, busqueda]);
  const seleccionado = visibles.find((p) => p.id === elegido) ?? visibles[0] ?? null;

  const todos: EnvioDeCola[] = cola.data ?? [];
  const cuenta = (estado: EstadoPedido) => todos.filter((p) => p.estado === estado).length;
  const conCuenta = (texto: string, n: number) => (n > 0 ? `${texto} (${n})` : texto);
  const opciones = [
    { valor: "TODOS", etiqueta: "Toda la cola" },
    { valor: "PAGADO", etiqueta: conCuenta("Por preparar", cuenta("PAGADO")) },
    { valor: "PREPARANDO", etiqueta: conCuenta("Preparando", cuenta("PREPARANDO")) },
    { valor: "ENVIADO", etiqueta: conCuenta("En camino", cuenta("ENVIADO")) },
    ...(puedeTarifas ? [{ valor: "TARIFAS", etiqueta: "Tarifas de envío" }] : []),
  ];

  /** El boton del cuadro principal: el siguiente paso, o abrir el formulario de envio. */
  function accionDe(p: EnvioDeCola) {
    const paso = SIGUIENTE[p.estado];
    if (!paso || enviando === p.id) return undefined;
    return {
      etiqueta: avanzar.isPending ? "Guardando…" : paso.boton,
      onClick: () => {
        if (avanzar.isPending) return;
        // Enviar pide transportista y codigo: abre el formulario.
        if (paso.estado === "ENVIADO") setEnviando(p.id);
        else avanzar.mutate({ pedidoId: p.id, estado: paso.estado });
      },
    };
  }

  /** Cuadros del envio y, si toca, el formulario para marcarlo enviado. */
  function vistaDe(p: EnvioDeCola) {
    return (
      <>
        <CuadrosEnvio pedido={p} accion={accionDe(p)} />
        {enviando === p.id ? (
          <Tarjeta titulo="Datos del envío">
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
              <Boton tipo="submit" disabled={avanzar.isPending}>
                {avanzar.isPending ? "Guardando…" : "Confirmar envío"}
              </Boton>
              <Boton variante="secundario" onClick={() => setEnviando(null)}>
                Cancelar
              </Boton>
            </Formulario>
          </Tarjeta>
        ) : null}
      </>
    );
  }

  const avisos = (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
    </>
  );

  const barra = (
    <BarraLista
      juntos
      {...(filtro === "TARIFAS"
        ? {}
        : {
            buscador: (
              <Campo
                id="busqueda-envios"
                etiqueta="Buscar por pedido, destinatario, distrito o guía"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={setBusqueda}
                placeholder="Pedido, distrito o guía"
              />
            ),
          })}
    >
      <CampoSelectorLista
        id="filtro-envios"
        ancho="amplio"
        etiqueta="Etapa del despacho"
        etiquetaOculta
        valor={filtro}
        opciones={opciones}
        onCambio={(valor) => {
          setFiltro(valor as Filtro);
          setEnviando(null);
        }}
      />
    </BarraLista>
  );

  if (filtro === "TARIFAS") {
    return (
      <>
        {barra}
        <Tarjeta titulo="Tarifas de envío">
          <Tarifas />
        </Tarjeta>
      </>
    );
  }

  const movil = escritorio ? undefined : visibles.find((p) => p.id === abiertoMovil);
  if (movil) {
    return (
      <>
        {avisos}
        <Boton variante="secundario" onClick={() => setAbiertoMovil(null)}>
          ← Volver a envíos
        </Boton>
        {vistaDe(movil)}
      </>
    );
  }

  const cifras = metricas.data;
  const tarjetas = cifras ? (
    <Tarjeta
      titulo={cifras.titulo}
      sinMarco
      acciones={
        <>
          <SelectorSegmentado
            etiqueta="Periodo de las métricas"
            // Con un dia del calendario elegido, ningun periodo esta activo.
            valor={fecha ? "" : periodo}
            opciones={PERIODOS.map((id) => ({ valor: id, etiqueta: ETIQUETAS_PERIODO[id] }))}
            onCambio={(valor) => {
              setFecha("");
              setPeriodo(valor as Periodo);
            }}
          />
          <SelectorCalendario
            id="fecha-metricas-envios"
            etiqueta="Elegir un día"
            etiquetaOculta
            placeholder="Elegir día"
            valor={fecha}
            onCambio={setFecha}
            limpiable
            alineacion="fin"
          />
        </>
      }
    >
      <RejillaMetricas>
        {/* Las tres primeras son colas de ahora mismo: se muestran enteras y sin comparar. */}
        <TarjetaMetrica
          etiqueta="Por despachar"
          valor={String(cifras.porDespachar.cantidad)}
          serie={cifras.porDespachar.serie}
          contexto={contextoDeCola(
            cifras.porDespachar.cantidad,
            cifras.porDespachar.masAntiguo,
            "Nada esperando salir",
          )}
        />
        <TarjetaMetrica
          etiqueta="En camino"
          valor={String(cifras.enCamino.cantidad)}
          serie={cifras.enCamino.serie}
          contexto={contextoDeCola(
            cifras.enCamino.cantidad,
            cifras.enCamino.masAntiguo,
            "Nada en camino",
          )}
        />
        <TarjetaMetrica
          etiqueta="Demorados"
          valor={String(cifras.demorados.cantidad)}
          contexto={
            cifras.demorados.cantidad > 0
              ? `Más de ${DIAS_DEMORA_ENVIO} días en camino`
              : `Ninguno pasa de ${DIAS_DEMORA_ENVIO} días`
          }
        />
        <TarjetaMetrica
          etiqueta="Despachados"
          valor={String(cifras.despachados.cantidad)}
          cambio={cifras.despachados.cambio}
          serie={cifras.despachados.serie}
          seriePrevia={cifras.despachados.seriePrevia}
          diferencia={`${conSigno(cifras.despachados.cantidad - cifras.despachados.cantidadPrevia)} ${
            Math.abs(cifras.despachados.cantidad - cifras.despachados.cantidadPrevia) === 1
              ? "envío"
              : "envíos"
          }`}
          anterior={{
            etiqueta: cifras.etiquetaAnterior,
            valor: String(cifras.despachados.cantidadPrevia),
          }}
        />
      </RejillaMetricas>
    </Tarjeta>
  ) : null;

  return (
    <>
      {avisos}
      {tarjetas}
      <ListaConLateral
        barra={barra}
        lateral={
          <VistaPrevia
            logo={null}
            estado={{ texto: "", tono: "neutro" }}
            etiqueta=""
            monto=""
            {...(seleccionado ? {} : { vacio: "Elige un envío de la lista para ver su resumen." })}
          >
            {seleccionado ? vistaDe(seleccionado) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {cola.isPending ? (
            <Cargando texto="Cargando envíos…" />
          ) : cola.isError ? (
            <Alerta tono="error">{cola.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Nada por aquí"
              texto={
                busqueda
                  ? "Ningún envío coincide con esa búsqueda."
                  : "No hay pedidos en esta etapa del despacho."
              }
            />
          ) : (
            <div>
              {visibles.map((p) => {
                const unidades = p.items.reduce((suma, item) => suma + item.cantidad, 0);
                return (
                  <FilaMovimiento
                    key={p.id}
                    logo={<LogoIcono icono={<IconoCamion tamano={16} />} nombre="Envío" />}
                    titulo={p.codigo}
                    detalle={p.destinatario}
                    subtitulo={`${p.distrito || p.departamento} · ${p.transportista ?? p.metodo}${
                      p.codigoSeguimiento ? ` · Guía …${p.codigoSeguimiento.slice(-4)}` : ""
                    }`}
                    estado={{
                      texto: ETAPA_ENVIO[p.estado] ?? p.estado,
                      tono: tonoDeEtapa(p.estado),
                    }}
                    valor={`${unidades} ${unidades === 1 ? "unidad" : "uds."}`}
                    seleccionada={escritorio && seleccionado?.id === p.id}
                    onAbrir={() => {
                      setEnviando(null);
                      if (escritorio) setElegido(p.id);
                      else setAbiertoMovil(p.id);
                    }}
                    etiquetaAbrir={`Ver envío de ${p.codigo}`}
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
        await revalidarTienda({ envios: true });
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
          costo: numeroDesdeTexto(costo),
          gratisDesde: gratisDesde.trim() === "" ? null : numeroDesdeTexto(gratisDesde),
          departamentos: departamentosDesdeTexto(departamentos),
          activo,
          orden: Math.trunc(numeroDesdeTexto(orden || "0")),
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
