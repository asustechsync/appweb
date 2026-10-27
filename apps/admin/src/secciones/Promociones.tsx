"use client";

import { Fragment, type ReactNode, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  Casilla,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  EstadoVacio,
  FilaPedido,
  FilaUnida,
  Formulario,
  IconoCalendario,
  IconoFlechaDerecha,
  IconoGaleria,
  IconoMensaje,
  IconoPromociones,
  IconoTicket,
  ListaConLateral,
  LogoIcono,
  RejillaBento,
  RejillaMetricas,
  SelectorCalendario,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";
import { FECHA, MONEDA, diaDeLima, numeroDesdeTexto } from "@appweb/core/formato";

/** Seccion "Portada" del grupo Promociones: los banners del carrusel. */
export function Portada() {
  return <Banners />;
}

/**
 * Seccion "Cupones" del grupo Promociones: los cupones de descuento. Los
 * niveles de recompensa tienen su propia seccion en Cuentas.
 */
export function Promociones() {
  return <Cupones />;
}

type Tono = "exito" | "alerta" | "error" | "neutro";

interface PropsListaEditable<T extends { id: string }> {
  /** "Cupones". */
  titulo: string;
  /** "+ Nuevo cupón". */
  nuevo: string;
  /** "Editar cupón". */
  editar: string;
  /** "← Volver a cupones". */
  volver: string;
  elementos: T[];
  metricas: ReactNode;
  vacio: { titulo: string; texto: string };
  /** Sin nada elegido, en la vista previa. */
  elegirAviso: string;
  fila: (
    elemento: T,
    abrir: { seleccionada: boolean; onAbrir: () => void; movil: boolean },
  ) => ReactNode;
  vista: (elemento: T, editar: () => void) => ReactNode;
  formulario: (elemento: T | null, onListo: () => void) => ReactNode;
  /** Texto de ayuda sobre el formulario. */
  ayuda: string;
}

/**
 * Lo comun a banners y cupones: cifras arriba, lista con vista previa al lado
 * y, al editar o crear, el formulario en lugar de la lista. Son pocos: sin
 * buscador ni paginas.
 */
function ListaEditable<T extends { id: string }>({
  titulo,
  nuevo,
  editar,
  volver,
  elementos,
  metricas,
  vacio,
  elegirAviso,
  fila,
  vista,
  formulario,
  ayuda,
}: PropsListaEditable<T>) {
  const [editando, setEditando] = useState<string | null>(null);
  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = elementos.find((e) => e.id === elegido) ?? elementos[0] ?? null;

  if (editando !== null) {
    const elemento = elementos.find((e) => e.id === editando) ?? null;
    return (
      <Tarjeta
        titulo={elemento ? editar : nuevo.replace("+ ", "")}
        acciones={
          <Boton variante="secundario" onClick={() => setEditando(null)}>
            {volver}
          </Boton>
        }
      >
        <p>{ayuda}</p>
        {formulario(elemento, () => setEditando(null))}
      </Tarjeta>
    );
  }

  return (
    <>
      <Tarjeta
        titulo={titulo}
        sinMarco
        acciones={<Boton onClick={() => setEditando("nuevo")}>{nuevo}</Boton>}
      >
        <RejillaMetricas>{metricas}</RejillaMetricas>
      </Tarjeta>

      <ListaConLateral
        lateral={
          <VistaPrevia
            logo={null}
            estado={{ texto: "", tono: "neutro" }}
            etiqueta=""
            monto=""
            {...(seleccionado ? {} : { vacio: elegirAviso })}
          >
            {seleccionado ? vista(seleccionado, () => setEditando(seleccionado.id)) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {elementos.length === 0 ? (
            <EstadoVacio titulo={vacio.titulo} texto={vacio.texto} />
          ) : (
            <div>
              {elementos.map((e) => (
                <Fragment key={e.id}>
                  {fila(e, {
                    seleccionada: escritorio && seleccionado?.id === e.id,
                    onAbrir: () => (escritorio ? setElegido(e.id) : setEditando(e.id)),
                    movil: !escritorio,
                  })}
                </Fragment>
              ))}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}

// ── Banners ─────────────────────────────────────────────────────────────────

interface BannerDelPanel {
  id: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  accion: string;
  href: string;
  orden: number;
  activo: boolean;
}

function estadoDeBanner(b: BannerDelPanel): { texto: string; tono: Tono } {
  return b.activo
    ? { texto: `#${b.orden} en portada`, tono: "exito" }
    : { texto: "Oculto", tono: "alerta" };
}

function Banners() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.promociones.banners.queryOptions());

  if (lista.isPending) return <Cargando texto="Cargando banners…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  const banners = lista.data;
  const activos = banners.filter((b) => b.activo);
  const destinos = new Set(activos.map((b) => b.href)).size;

  return (
    <ListaEditable
      titulo="Portada y banners"
      nuevo="+ Nuevo banner"
      editar="Editar banner"
      volver="← Volver a la portada"
      elementos={banners}
      ayuda="Las promociones que se turnan arriba en la portada, en este orden. Las ocultas no se muestran."
      metricas={
        <>
          <TarjetaMetrica
            etiqueta="En la portada"
            valor={String(activos.length)}
            contexto={
              activos.length === 0 ? "La portada no muestra el carrusel" : "Se turnan arriba"
            }
          />
          <TarjetaMetrica
            etiqueta="Ocultos"
            valor={String(banners.length - activos.length)}
            contexto="Guardados sin mostrar"
          />
          <TarjetaMetrica
            etiqueta="Destinos"
            valor={String(destinos)}
            contexto="Páginas a las que llevan"
          />
        </>
      }
      vacio={{ titulo: "Sin banners", texto: "La portada no muestra el carrusel." }}
      elegirAviso="Elige un banner para ver cómo se lee."
      fila={(b, abrir) => (
        <FilaPedido
          logo={<LogoIcono icono={<IconoGaleria tamano={16} />} nombre="Banner" />}
          titulo={b.titulo}
          detalle={b.etiqueta}
          contenido={b.texto}
          centro={[b.accion, b.href]}
          estado={estadoDeBanner(b)}
          seleccionada={abrir.seleccionada}
          onAbrir={abrir.onAbrir}
          etiquetaAbrir={`${abrir.movil ? "Editar" : "Elegir"} banner ${b.titulo}`}
        />
      )}
      vista={(b, editar) => (
        <RejillaBento>
          <CuadroMonto
            logo={<LogoIcono icono={<IconoGaleria tamano={16} />} nombre="Banner" />}
            estado={estadoDeBanner(b)}
            etiqueta={b.etiqueta}
            monto={b.titulo}
            texto
            detalle={b.texto}
            acciones={[{ etiqueta: "Editar banner", onClick: editar }]}
          />
          <CuadroBento
            icono={<IconoFlechaDerecha tamano={16} />}
            titulo="Botón"
            ancho="ancho"
            detalle={`Lleva a ${b.href}`}
          >
            {b.accion}
          </CuadroBento>
        </RejillaBento>
      )}
      formulario={(b, onListo) => <FormularioBanner banner={b} onListo={onListo} />}
    />
  );
}

function FormularioBanner({
  banner,
  onListo,
}: {
  banner: BannerDelPanel | null;
  onListo: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [etiqueta, setEtiqueta] = useState(banner?.etiqueta ?? "");
  const [titulo, setTitulo] = useState(banner?.titulo ?? "");
  const [texto, setTexto] = useState(banner?.texto ?? "");
  const [accion, setAccion] = useState(banner?.accion ?? "Ver más");
  const [href, setHref] = useState(banner?.href ?? "/");
  const [orden, setOrden] = useState(String(banner?.orden ?? 1));
  const [activo, setActivo] = useState(banner?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.promociones.guardarBanner.mutationOptions({
      onSuccess: async () => {
        await revalidarTienda({ portada: true });
        void queryClient.invalidateQueries(trpc.panel.promociones.pathFilter());
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
          ...(banner ? { bannerId: banner.id } : {}),
          etiqueta,
          titulo,
          texto,
          accion,
          href,
          orden: Math.trunc(numeroDesdeTexto(orden || "0")),
          activo,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <Campo
        id="banner-etiqueta"
        etiqueta="Etiqueta (texto pequeño de arriba)"
        valor={etiqueta}
        onCambio={setEtiqueta}
        placeholder="Ofertas por tiempo limitado"
        requerido
      />
      <Campo id="banner-titulo" etiqueta="Título" valor={titulo} onCambio={setTitulo} requerido />
      <Campo id="banner-texto" etiqueta="Detalle" valor={texto} onCambio={setTexto} requerido />
      <FilaUnida iguales>
        <Campo
          id="banner-accion"
          etiqueta="Texto del botón"
          valor={accion}
          onCambio={setAccion}
          requerido
        />
        <Campo
          id="banner-href"
          etiqueta="Lleva a"
          valor={href}
          onCambio={setHref}
          placeholder="/envios"
          requerido
        />
      </FilaUnida>
      <Campo id="banner-orden" etiqueta="Orden" valor={orden} onCambio={setOrden} />
      <Casilla
        id="banner-activo"
        etiqueta="Se muestra en la portada"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar banner"}
      </Boton>
      <Boton variante="secundario" onClick={onListo}>
        Cancelar
      </Boton>
    </Formulario>
  );
}

// ── Cupones ─────────────────────────────────────────────────────────────────

interface CuponDelPanel {
  id: string;
  codigo: string;
  porcentaje: number;
  minimoCompra: number | null;
  usosMaximos: number | null;
  usos: number;
  desde: string | null;
  hasta: string | null;
  activo: boolean;
}

/** Un "2026-10-26" del formulario como fecha legible: "26 oct 2026". */
function fechaLegible(dia: string): string {
  return FECHA.format(new Date(`${dia}T12:00:00-05:00`));
}

/**
 * Apagado manda; luego si aun no empieza, si ya vencio o si se acabaron los
 * usos. Solo es informativo: quien valida el cupon en la compra es core.
 */
function estadoDeCupon(c: CuponDelPanel, hoy: string): { texto: string; tono: Tono } {
  if (!c.activo) return { texto: "Apagado", tono: "neutro" };
  if (c.desde && c.desde > hoy) return { texto: "Programado", tono: "alerta" };
  if (c.hasta && c.hasta < hoy) return { texto: "Vencido", tono: "error" };
  if (c.usosMaximos !== null && c.usos >= c.usosMaximos) return { texto: "Agotado", tono: "error" };
  return { texto: "Activo", tono: "exito" };
}

function vigencia(c: CuponDelPanel): string {
  if (!c.desde && !c.hasta) return "Sin fecha de vencimiento";
  const desde = c.desde ? `desde ${fechaLegible(c.desde)}` : "";
  const hasta = c.hasta ? `hasta ${fechaLegible(c.hasta)}` : "";
  return `Vigente ${desde} ${hasta}`.replace(/\s+/g, " ").trim();
}

function Cupones() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.promociones.cupones.queryOptions());

  if (lista.isPending) return <Cargando texto="Cargando cupones…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  const cupones = lista.data;
  const hoy = diaDeLima(new Date());
  const vigentes = cupones.filter((c) => estadoDeCupon(c, hoy).texto === "Activo");
  const usos = cupones.reduce((suma, c) => suma + c.usos, 0);
  const mayor = vigentes.reduce((max, c) => Math.max(max, c.porcentaje), 0);

  return (
    <ListaEditable
      titulo="Cupones"
      nuevo="+ Nuevo cupón"
      editar="Editar cupón"
      volver="← Volver a cupones"
      elementos={cupones}
      ayuda="Códigos de descuento sobre el subtotal. No se suman al descuento de nivel: el cliente recibe el mayor."
      metricas={
        <>
          <TarjetaMetrica
            etiqueta="Vigentes"
            valor={String(vigentes.length)}
            contexto={`De ${cupones.length} creados`}
          />
          <TarjetaMetrica
            etiqueta="Usos"
            valor={String(usos)}
            contexto="Pedidos que usaron un código"
          />
          <TarjetaMetrica
            etiqueta="Mayor descuento"
            valor={mayor === 0 ? "—" : `${mayor} %`}
            contexto="Entre los vigentes"
          />
        </>
      }
      vacio={{ titulo: "Sin cupones", texto: "Todavía no hay códigos de descuento." }}
      elegirAviso="Elige un cupón para ver sus condiciones."
      fila={(c, abrir) => (
        <FilaPedido
          logo={<LogoIcono icono={<IconoTicket tamano={16} />} nombre="Cupón" />}
          titulo={c.codigo}
          detalle={`${c.porcentaje} %`}
          contenido={
            c.minimoCompra !== null ? `Desde ${MONEDA.format(c.minimoCompra)}` : "Sin mínimo"
          }
          centro={[
            `${c.usos} ${c.usos === 1 ? "uso" : "usos"}`,
            c.usosMaximos !== null ? `de ${c.usosMaximos}` : "sin límite",
          ]}
          estado={estadoDeCupon(c, hoy)}
          {...(c.hasta ? { nota: `Hasta ${fechaLegible(c.hasta)}` } : {})}
          seleccionada={abrir.seleccionada}
          onAbrir={abrir.onAbrir}
          etiquetaAbrir={`${abrir.movil ? "Editar" : "Elegir"} cupón ${c.codigo}`}
        />
      )}
      vista={(c, editar) => (
        <RejillaBento>
          <CuadroMonto
            logo={<LogoIcono icono={<IconoPromociones tamano={16} />} nombre="Cupón" />}
            estado={estadoDeCupon(c, hoy)}
            etiqueta={c.codigo}
            monto={`${c.porcentaje} %`}
            texto
            detalle="de descuento sobre el subtotal"
            acciones={[{ etiqueta: "Editar cupón", onClick: editar }]}
          />
          <CuadroDesglose
            icono={<IconoTicket tamano={16} />}
            titulo="Condiciones"
            ancho="ancho"
            lineas={[
              {
                etiqueta: "Compra mínima",
                valor: c.minimoCompra !== null ? MONEDA.format(c.minimoCompra) : "Sin mínimo",
              },
              {
                etiqueta: "Usos",
                valor: c.usosMaximos !== null ? `${c.usos} de ${c.usosMaximos}` : String(c.usos),
              },
            ]}
          />
          <CuadroBento icono={<IconoCalendario tamano={16} />} titulo="Vigencia" ancho="ancho">
            {vigencia(c)}
          </CuadroBento>
          <CuadroBento icono={<IconoMensaje tamano={16} />} titulo="Con niveles" ancho="ancho">
            No se suma al descuento de nivel: el cliente recibe el mayor.
          </CuadroBento>
        </RejillaBento>
      )}
      formulario={(c, onListo) => <FormularioCupon cupon={c} onListo={onListo} />}
    />
  );
}

function FormularioCupon({ cupon, onListo }: { cupon: CuponDelPanel | null; onListo: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [codigo, setCodigo] = useState(cupon?.codigo ?? "");
  const [porcentaje, setPorcentaje] = useState(cupon ? String(cupon.porcentaje) : "");
  const [minimo, setMinimo] = useState(
    cupon?.minimoCompra != null ? String(cupon.minimoCompra) : "",
  );
  const [usosMaximos, setUsosMaximos] = useState(
    cupon?.usosMaximos != null ? String(cupon.usosMaximos) : "",
  );
  const [desde, setDesde] = useState(cupon?.desde ?? "");
  const [hasta, setHasta] = useState(cupon?.hasta ?? "");
  const [activo, setActivo] = useState(cupon?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.promociones.guardarCupon.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.panel.promociones.pathFilter());
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
          ...(cupon ? { cuponId: cupon.id } : {}),
          codigo,
          porcentaje: numeroDesdeTexto(porcentaje),
          minimoCompra: minimo.trim() === "" ? null : numeroDesdeTexto(minimo),
          usosMaximos: usosMaximos.trim() === "" ? null : Math.trunc(numeroDesdeTexto(usosMaximos)),
          desde: desde === "" ? null : desde,
          hasta: hasta === "" ? null : hasta,
          activo,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {cupon && cupon.usos > 0 ? (
        <Alerta tono="info">
          Este código ya se usó {cupon.usos} {cupon.usos === 1 ? "vez" : "veces"}: si lo cambias,
          los pedidos anteriores siguen mostrando el código con el que compraron.
        </Alerta>
      ) : null}
      <FilaUnida iguales>
        <Campo
          id="cupon-codigo"
          etiqueta="Código"
          valor={codigo}
          onCambio={setCodigo}
          placeholder="PROMO20"
          requerido
        />
        <Campo
          id="cupon-porcentaje"
          etiqueta="Descuento (%)"
          valor={porcentaje}
          onCambio={setPorcentaje}
          requerido
        />
      </FilaUnida>
      <FilaUnida iguales>
        <Campo
          id="cupon-minimo"
          etiqueta="Compra mínima (S/)"
          valor={minimo}
          onCambio={setMinimo}
          placeholder="Opcional"
        />
        <Campo
          id="cupon-usos"
          etiqueta="Límite de usos"
          valor={usosMaximos}
          onCambio={setUsosMaximos}
          placeholder="Sin límite"
        />
      </FilaUnida>
      <FilaUnida iguales>
        <SelectorCalendario
          id="cupon-desde"
          etiqueta="Desde"
          placeholder="Sin fecha"
          valor={desde}
          onCambio={setDesde}
          limpiable
        />
        <SelectorCalendario
          id="cupon-hasta"
          etiqueta="Hasta"
          placeholder="Sin fecha"
          valor={hasta}
          onCambio={setHasta}
          {...(desde ? { minimo: desde } : {})}
          limpiable
        />
      </FilaUnida>
      <Casilla
        id="cupon-activo"
        etiqueta="Se puede usar en la tienda"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar cupón"}
      </Boton>
      <Boton variante="secundario" onClick={onListo}>
        Cancelar
      </Boton>
    </Formulario>
  );
}
