"use client";

import { type ReactNode, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { slugDesdeTexto } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoSelect,
  CampoSelectorLista,
  CampoTexto,
  Cargando,
  Casilla,
  CuadroBento,
  CuadroMonto,
  EstadoVacio,
  FilaPedido,
  FilaUnida,
  Formulario,
  IconoBuscar,
  IconoCatalogo,
  IconoGlobo,
  IconoMensaje,
  LimpiarFiltros,
  ListaConLateral,
  LogoFoto,
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
import { urlVisible } from "@/lib/url-visible";
import { mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";

/** Lo comun a categoria y marca en el formulario. */
interface Ficha {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  tituloSeo: string;
  descripcionSeo: string;
  orden: number;
  destacado: boolean;
  activo: boolean;
  productos: number;
}

interface CategoriaDelPanel extends Ficha {
  padreId: string | null;
  imagenUrl: string;
  hijas: number;
}

interface MarcaDelPanel extends Ficha {
  logoUrl: string;
}

type Revalidar = { navegacion: boolean; catalogo: boolean; portada: boolean };

function estadoDeFicha(ficha: Ficha): { texto: string; tono: "exito" | "alerta" } {
  return ficha.activo ? { texto: "Visible", tono: "exito" } : { texto: "Oculta", tono: "alerta" };
}

type FiltroFichas = "TODAS" | "VISIBLES" | "OCULTAS" | "DESTACADAS";

const FILTROS: { id: FiltroFichas; etiqueta: string }[] = [
  { id: "TODAS", etiqueta: "Todas" },
  { id: "VISIBLES", etiqueta: "Visibles" },
  { id: "OCULTAS", etiqueta: "Ocultas" },
  { id: "DESTACADAS", etiqueta: "Destacadas en portada" },
];

function cumpleFiltro(ficha: Ficha, filtro: FiltroFichas): boolean {
  if (filtro === "VISIBLES") return ficha.activo;
  if (filtro === "OCULTAS") return !ficha.activo;
  if (filtro === "DESTACADAS") return ficha.destacado;
  return true;
}

/** Cuantas fichas se ven por pagina. */
const PAGINA = 10;

interface PropsSeccionFichas<T extends Ficha> {
  /** "Categorías". */
  titulo: string;
  /** "categoría": para botones y avisos. */
  sustantivo: string;
  /** "/categorias/": antepuesto a la direccion web. */
  ruta: string;
  /** Ya en el orden en que se muestran. */
  fichas: T[];
  /** La imagen o el logo, si tiene. */
  imagenDe: (ficha: T) => string;
  /** Al lado del nombre en la fila: "dentro de Boxers". */
  detalleDe?: (ficha: T) => string | null;
  /** Cifras propias en el cuadro de productos: subcategorias. */
  cifrasDe?: (ficha: T) => { valor: string; etiqueta: string }[];
  formulario: (ficha: T | null, onListo: (mensaje?: string) => void) => ReactNode;
}

/**
 * Lo comun a categorias y marcas: cifras arriba, lista con vista previa al
 * lado y, al editar o crear, el formulario en lugar de la lista.
 */
function SeccionFichas<T extends Ficha>({
  titulo,
  sustantivo,
  ruta,
  fichas,
  imagenDe,
  detalleDe,
  cifrasDe,
  formulario,
}: PropsSeccionFichas<T>) {
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroFichas>("TODAS");
  const [busqueda, setBusqueda] = useState("");

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return fichas.filter(
      (f) =>
        cumpleFiltro(f, filtro) &&
        (termino === "" || f.nombre.toLowerCase().includes(termino) || f.slug.includes(termino)),
    );
  }, [busqueda, filtro, fichas]);
  const { pagina, paginas, setPagina, visibles } = usePaginado(coinciden, PAGINA);

  const escritorio = useEscritorio();
  const [elegida, setElegida] = useState<string | null>(null);
  const seleccionada = visibles.find((f) => f.id === elegida) ?? visibles[0] ?? null;

  function listo(mensaje?: string) {
    setEditando(null);
    if (mensaje) setAviso(mensaje);
  }

  if (editando !== null) {
    const ficha = fichas.find((f) => f.id === editando) ?? null;
    return (
      <Tarjeta
        titulo={ficha ? `Editar ${ficha.nombre}` : `Nueva ${sustantivo}`}
        acciones={
          <Boton variante="secundario" onClick={() => listo()}>
            ← Volver a {titulo.toLowerCase()}
          </Boton>
        }
      >
        {formulario(ficha, listo)}
      </Tarjeta>
    );
  }

  const contar = (id: FiltroFichas) => fichas.filter((f) => cumpleFiltro(f, id)).length;
  const opciones = FILTROS.map((f) => {
    const cantidad = f.id === "TODAS" ? 0 : contar(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const productos = fichas.reduce((suma, f) => suma + f.productos, 0);
  const vacias = fichas.filter((f) => f.activo && f.productos === 0).length;

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <Tarjeta
        titulo={titulo}
        sinMarco
        acciones={<Boton onClick={() => setEditando("nueva")}>+ Nueva {sustantivo}</Boton>}
      >
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Visibles"
            valor={String(contar("VISIBLES"))}
            contexto={`De ${fichas.length} en total`}
          />
          <TarjetaMetrica
            etiqueta="Ocultas"
            valor={String(contar("OCULTAS"))}
            contexto="No salen en la tienda"
          />
          <TarjetaMetrica
            etiqueta="Destacadas"
            valor={String(contar("DESTACADAS"))}
            contexto="Salen en la portada"
          />
          <TarjetaMetrica
            etiqueta="Productos"
            valor={String(productos)}
            contexto={
              vacias === 0 ? "Ninguna visible está vacía" : `${vacias} visibles sin productos`
            }
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
                id={`busqueda-${sustantivo}`}
                etiqueta="Buscar por nombre o dirección web"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Nombre o dirección"
              />
            }
          >
            <Paginador pagina={pagina} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id={`filtro-${sustantivo}`}
              ancho="amplio"
              etiqueta="Qué mostrar"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as FiltroFichas);
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
            {...(seleccionada ? {} : { vacio: `Elige una ${sustantivo} para ver su resumen.` })}
          >
            {seleccionada ? (
              <RejillaBento>
                <CuadroMonto
                  logo={
                    <LogoFoto
                      src={imagenDe(seleccionada) ? urlVisible(imagenDe(seleccionada)) : null}
                      nombre={seleccionada.nombre}
                    />
                  }
                  estado={estadoDeFicha(seleccionada)}
                  etiqueta={
                    detalleDe?.(seleccionada) ??
                    `${sustantivo.charAt(0).toUpperCase()}${sustantivo.slice(1)}`
                  }
                  monto={seleccionada.nombre}
                  texto
                  detalle={`${ruta}${seleccionada.slug}`}
                  acciones={[
                    {
                      etiqueta: `Editar ${sustantivo}`,
                      onClick: () => setEditando(seleccionada.id),
                    },
                  ]}
                />
                <CuadroBento
                  icono={<IconoCatalogo tamano={16} />}
                  titulo="En la tienda"
                  ancho="ancho"
                  cifras={[
                    { valor: String(seleccionada.productos), etiqueta: "Productos" },
                    ...(cifrasDe?.(seleccionada) ?? []),
                    { valor: String(seleccionada.orden), etiqueta: "Orden" },
                  ]}
                >
                  {seleccionada.destacado ? "Destacada en la portada" : "Sin destacar"}
                </CuadroBento>
                <CuadroBento
                  icono={<IconoMensaje tamano={16} />}
                  titulo="Descripción"
                  ancho="ancho"
                  vacio={seleccionada.descripcion === ""}
                >
                  {seleccionada.descripcion || "Sin descripción"}
                </CuadroBento>
                <CuadroBento
                  icono={<IconoGlobo tamano={16} />}
                  titulo="En Google"
                  ancho="ancho"
                  vacio={seleccionada.tituloSeo === ""}
                  {...(seleccionada.descripcionSeo ? { detalle: seleccionada.descripcionSeo } : {})}
                >
                  {seleccionada.tituloSeo || "Usa el nombre"}
                </CuadroBento>
              </RejillaBento>
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {visibles.length === 0 ? (
            <EstadoVacio
              titulo={`Sin ${titulo.toLowerCase()}`}
              texto={
                fichas.length === 0
                  ? `Crea la primera ${sustantivo}.`
                  : "Ninguna coincide con esa búsqueda o ese filtro."
              }
            />
          ) : (
            <div>
              {visibles.map((f) => {
                const detalle = detalleDe?.(f) ?? null;
                return (
                  <FilaPedido
                    key={f.id}
                    logo={
                      <LogoFoto
                        src={imagenDe(f) ? urlVisible(imagenDe(f)) : null}
                        nombre={f.nombre}
                      />
                    }
                    titulo={f.nombre}
                    {...(detalle ? { detalle } : {})}
                    contenido={`${ruta}${f.slug}`}
                    centro={[String(f.productos), f.productos === 1 ? "producto" : "productos"]}
                    estado={estadoDeFicha(f)}
                    {...(f.destacado ? { nota: "Destacada" } : {})}
                    seleccionada={escritorio && seleccionada?.id === f.id}
                    onAbrir={() => (escritorio ? setElegida(f.id) : setEditando(f.id))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Editar"} ${f.nombre}`}
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

/** Mensaje tras guardar: avisa si la tienda tarda en mostrarlo. */
async function publicar(revalidar: Revalidar, que: string): Promise<string> {
  const alDia = await revalidarTienda(revalidar);
  return alDia
    ? `${que} guardada.`
    : `${que} guardada. La tienda tardará unos minutos en mostrarla.`;
}

// ── Categorias ──────────────────────────────────────────────────────────────

/**
 * Arbol de categorias del catalogo: las de primer nivel y, debajo, sus
 * subcategorias. No se borran: se ocultan, para que ningun producto quede
 * huerfano. Que un arbol sea valido (sin ciclos) lo decide @appweb/core.
 */
export function Categorias() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.categorias.listar.queryOptions());

  if (lista.isPending) return <Cargando texto="Cargando categorías…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  const todas = lista.data;
  const raices = todas.filter((c) => c.padreId === null);
  const hijasDe = (id: string) => todas.filter((c) => c.padreId === id);
  // Primer nivel y debajo sus hijas, en el orden del menu.
  const ordenadas = raices.flatMap((r) => [r, ...hijasDe(r.id)]);
  const huerfanas = todas.filter((c) => !ordenadas.includes(c));
  const nombreDe = (id: string | null) => todas.find((c) => c.id === id)?.nombre ?? null;

  return (
    <SeccionFichas
      titulo="Categorías"
      sustantivo="categoría"
      ruta="/categorias/"
      fichas={[...ordenadas, ...huerfanas]}
      imagenDe={(c) => c.imagenUrl}
      detalleDe={(c) => (c.padreId ? `dentro de ${nombreDe(c.padreId)}` : null)}
      cifrasDe={(c) => [{ valor: String(c.hijas), etiqueta: "Subcategorías" }]}
      formulario={(c, onListo) => (
        <FormularioCategoria categoria={c} todas={todas} onListo={onListo} />
      )}
    />
  );
}

function FormularioCategoria({
  categoria,
  todas,
  onListo,
}: {
  categoria: CategoriaDelPanel | null;
  todas: CategoriaDelPanel[];
  onListo: (mensaje?: string) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [slug, setSlug] = useState(categoria?.slug ?? "");
  const [padreId, setPadreId] = useState(categoria?.padreId ?? "");
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? "");
  const [imagenUrl, setImagenUrl] = useState(categoria?.imagenUrl ?? "");
  const [tituloSeo, setTituloSeo] = useState(categoria?.tituloSeo ?? "");
  const [descripcionSeo, setDescripcionSeo] = useState(categoria?.descripcionSeo ?? "");
  const [orden, setOrden] = useState(String(categoria?.orden ?? 0));
  const [destacado, setDestacado] = useState(categoria?.destacado ?? false);
  const [activo, setActivo] = useState(categoria?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.categorias.guardar.mutationOptions({
      onSuccess: async (r) => {
        void queryClient.invalidateQueries(trpc.panel.categorias.pathFilter());
        // El selector de categoria del editor de productos.
        void queryClient.invalidateQueries(trpc.panel.productos.opciones.pathFilter());
        onListo(await publicar(r.revalidar, "Categoría"));
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  // El padre puede ser cualquiera menos ella misma (los ciclos los rechaza core).
  const padres = todas.filter((c) => c.id !== categoria?.id);

  return (
    <Formulario
      ancho="completo"
      onSubmit={(evento) => {
        evento.preventDefault();
        guardar.mutate({
          ...(categoria ? { categoriaId: categoria.id } : {}),
          nombre,
          slug,
          padreId: padreId === "" ? null : padreId,
          descripcion,
          imagenUrl,
          tituloSeo,
          descripcionSeo,
          orden: Math.trunc(numeroDesdeTexto(orden || "0")),
          destacado,
          activo,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <FilaUnida iguales>
        <Campo
          id="categoria-nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={(valor) => {
            // El slug sigue al nombre mientras nadie lo haya tocado a mano.
            if (slug === "" || slug === slugDesdeTexto(nombre)) setSlug(slugDesdeTexto(valor));
            setNombre(valor);
          }}
          requerido
        />
        <Campo
          id="categoria-slug"
          etiqueta="Dirección web"
          valor={slug}
          onCambio={setSlug}
          prefijo="/categorias/"
          requerido
        />
      </FilaUnida>
      <FilaUnida iguales>
        <CampoSelect
          id="categoria-padre"
          etiqueta="Va dentro de"
          valor={padreId}
          opciones={[
            { valor: "", etiqueta: "Ninguna (primer nivel)" },
            ...padres.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
          ]}
          onCambio={setPadreId}
        />
        <Campo id="categoria-orden" etiqueta="Orden" valor={orden} onCambio={setOrden} />
      </FilaUnida>
      <CampoTexto
        id="categoria-descripcion"
        etiqueta="Descripción (opcional)"
        valor={descripcion}
        onCambio={setDescripcion}
        filas={3}
      />
      <Campo
        id="categoria-imagen"
        etiqueta="Imagen (URL, opcional)"
        valor={imagenUrl}
        onCambio={setImagenUrl}
        placeholder="https://…"
      />
      <FilaUnida iguales>
        <Campo
          id="categoria-titulo-seo"
          etiqueta="Título para Google (opcional)"
          valor={tituloSeo}
          onCambio={setTituloSeo}
        />
        <Campo
          id="categoria-descripcion-seo"
          etiqueta="Descripción para Google (opcional)"
          valor={descripcionSeo}
          onCambio={setDescripcionSeo}
        />
      </FilaUnida>
      <Casilla
        id="categoria-destacada"
        etiqueta="Destacada en la portada"
        marcada={destacado}
        onCambio={setDestacado}
      />
      <Casilla
        id="categoria-activa"
        etiqueta="Visible en la tienda"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar categoría"}
      </Boton>
      <Boton variante="secundario" onClick={() => onListo()}>
        Cancelar
      </Boton>
    </Formulario>
  );
}

// ── Marcas ──────────────────────────────────────────────────────────────────

/** Marcas del catalogo: pagina propia, filtro y la fila de marcas de portada. */
export function Marcas() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.marcas.listar.queryOptions());

  if (lista.isPending) return <Cargando texto="Cargando marcas…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  return (
    <SeccionFichas
      titulo="Marcas"
      sustantivo="marca"
      ruta="/marcas/"
      fichas={lista.data}
      imagenDe={(m) => m.logoUrl}
      formulario={(m, onListo) => <FormularioMarca marca={m} onListo={onListo} />}
    />
  );
}

function FormularioMarca({
  marca,
  onListo,
}: {
  marca: MarcaDelPanel | null;
  onListo: (mensaje?: string) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(marca?.nombre ?? "");
  const [slug, setSlug] = useState(marca?.slug ?? "");
  const [descripcion, setDescripcion] = useState(marca?.descripcion ?? "");
  const [logoUrl, setLogoUrl] = useState(marca?.logoUrl ?? "");
  const [tituloSeo, setTituloSeo] = useState(marca?.tituloSeo ?? "");
  const [descripcionSeo, setDescripcionSeo] = useState(marca?.descripcionSeo ?? "");
  const [orden, setOrden] = useState(String(marca?.orden ?? 0));
  const [destacado, setDestacado] = useState(marca?.destacado ?? false);
  const [activo, setActivo] = useState(marca?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.marcas.guardar.mutationOptions({
      onSuccess: async (r) => {
        void queryClient.invalidateQueries(trpc.panel.marcas.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.productos.opciones.pathFilter());
        onListo(await publicar(r.revalidar, "Marca"));
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  return (
    <Formulario
      ancho="completo"
      onSubmit={(evento) => {
        evento.preventDefault();
        guardar.mutate({
          ...(marca ? { marcaId: marca.id } : {}),
          nombre,
          slug,
          descripcion,
          logoUrl,
          tituloSeo,
          descripcionSeo,
          orden: Math.trunc(numeroDesdeTexto(orden || "0")),
          destacado,
          activo,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <FilaUnida iguales>
        <Campo
          id="marca-nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={(valor) => {
            if (slug === "" || slug === slugDesdeTexto(nombre)) setSlug(slugDesdeTexto(valor));
            setNombre(valor);
          }}
          requerido
        />
        <Campo
          id="marca-slug"
          etiqueta="Dirección web"
          valor={slug}
          onCambio={setSlug}
          prefijo="/marcas/"
          requerido
        />
      </FilaUnida>
      <CampoTexto
        id="marca-descripcion"
        etiqueta="Descripción (opcional)"
        valor={descripcion}
        onCambio={setDescripcion}
        filas={3}
      />
      <FilaUnida iguales>
        <Campo
          id="marca-logo"
          etiqueta="Logo (URL, opcional)"
          valor={logoUrl}
          onCambio={setLogoUrl}
          placeholder="https://…"
        />
        <Campo id="marca-orden" etiqueta="Orden" valor={orden} onCambio={setOrden} />
      </FilaUnida>
      <FilaUnida iguales>
        <Campo
          id="marca-titulo-seo"
          etiqueta="Título para Google (opcional)"
          valor={tituloSeo}
          onCambio={setTituloSeo}
        />
        <Campo
          id="marca-descripcion-seo"
          etiqueta="Descripción para Google (opcional)"
          valor={descripcionSeo}
          onCambio={setDescripcionSeo}
        />
      </FilaUnida>
      <Casilla
        id="marca-destacada"
        etiqueta="Destacada en la portada"
        marcada={destacado}
        onCambio={setDestacado}
      />
      <Casilla
        id="marca-activa"
        etiqueta="Visible en la tienda"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar marca"}
      </Boton>
      <Boton variante="secundario" onClick={() => onListo()}>
        Cancelar
      </Boton>
    </Formulario>
  );
}
