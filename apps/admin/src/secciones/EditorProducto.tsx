"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DETALLES_VACIOS,
  DISENO_POR_DEFECTO,
  type DetallesPrenda,
  esImagenDemo,
  FAMILIAS_COLOR,
  IMAGEN_DEMO,
  listoParaPublicar,
  MAX_IMAGENES_POR_PRODUCTO,
  MAX_VARIANTES_POR_LOTE,
  requisitosDePublicacion,
  resolverDisponibilidad,
  resolverPrecio,
  slugDesdeTexto,
  TIPO_POR_DEFECTO,
  tipoDeCodigo,
  tipoDesdeNombre,
  TIPOS_IMAGEN,
  UMBRAL_STOCK_BAJO,
} from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelectorBuscable,
  CampoSelectorLista,
  InterruptorCampo,
  CampoTexto,
  CabeceraDetalle,
  ChipAgregar,
  ChipAtributo,
  Cargando,
  Casilla,
  GrupoColor,
  RejillaGrupos,
  RejillaVariantes,
  FilaTarjetas,
  FilaUnida,
  Formulario,
  GaleriaEditable,
  PanelConPestanas,
  GrupoChips,
  SelectorEtiquetas,
  SelectorFecha,
  IconoCopiar,
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  IconoGlobo,
  IconoPapelera,
  InterruptorPanel,
  MenuAcciones,
  ListaRequisitos,
  FilaVariante,
  SelectorMultiple,
  SelectorMultipleDesplegable,
  SelectorSegmentado,
  Tarjeta,
  TarjetaProducto,
  SoloLectura,
} from "@appweb/ui";

import { type ProductoTocado, revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";
import { MONEDA, mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";
import { URL_TIENDA, urlTiendaEnNavegador } from "@appweb/api/urls";

interface DatosFormulario {
  nombre: string;
  slug: string;
  categoriaId: string;
  marcaId: string | null;
  precio: number | null;
  precioLista: number | null;
  descripcionCorta: string;
  descripcion: string;
  /** La primera es la principal: la que la tarjeta destaca. */
  etiquetas: string[];
  envioGratis: boolean;
  /** "aaaa-mm-dd"; vacio = la etiqueta "Nuevo" no vence. */
  nuevoHasta: string;
  /** Lo que sale en Google; vacio = se usa el nombre y el resumen. */
  tituloSeo: string;
  descripcionSeo: string;
  destacado: boolean;
  mostrarAgotado: boolean;
  permiteResenas: boolean;
  enPacks: boolean;
  enBuscador: boolean;
  activo: boolean;
  detalles: DetallesPrenda;
}

/** Un producto nuevo nace oculto: se muestra cuando ya tiene tallas y stock. */
const VACIO: DatosFormulario = {
  nombre: "",
  slug: "",
  categoriaId: "",
  marcaId: null,
  precio: null,
  precioLista: null,
  descripcionCorta: "",
  descripcion: "",
  etiquetas: [],
  envioGratis: false,
  nuevoHasta: "",
  tituloSeo: "",
  descripcionSeo: "",
  destacado: false,
  mostrarAgotado: true,
  permiteResenas: true,
  enPacks: true,
  enBuscador: true,
  activo: false,
  detalles: DETALLES_VACIOS,
};

/** Un tipo de prenda tal como lo da `productos.opciones`. */
interface TipoDeOpciones {
  codigo: string;
  nombre: string;
  palabras: string[];
  tallas: string[];
  activo: boolean;
}

interface PropsEditorProducto {
  /** `null` = producto nuevo. */
  productoId: string | null;
  /** Se acaba de crear: los datos ya quedaron, falta agregar tallas. */
  recienCreado: boolean;
  onCreado: (id: string) => void;
  onVolver: () => void;
}

type PestanaProducto = "ficha" | "fotos" | "variantes" | "seo" | "publicacion";

/** Lo que la ficha escribe y la vista previa lee, aun sin guardar. */
interface VistaProducto {
  nombre: string;
  descripcionCorta: string;
  precio: string;
  precioLista: string;
  etiqueta: string;
  envioGratis: boolean;
  marcaId: string;
}

/** Publicación avisa en su etiqueta si ya cumple lo que pide la tienda. */
function pestanasProducto(listo: boolean): { id: PestanaProducto; etiqueta: string }[] {
  return [
    { id: "ficha", etiqueta: "Ficha" },
    { id: "fotos", etiqueta: "Fotos" },
    { id: "variantes", etiqueta: "Variantes" },
    { id: "seo", etiqueta: "SEO" },
    { id: "publicacion", etiqueta: listo ? "Publicación ✓" : "Publicación !" },
  ];
}

/**
 * Cada pestaña responde una pregunta: que es (ficha), como se ve (fotos), que
 * stock hay (variantes) y si esta a la venta (publicacion). Un producto nuevo
 * solo tiene la ficha.
 */
export function EditorProducto({
  productoId,
  recienCreado,
  onCreado,
  onVolver,
}: PropsEditorProducto) {
  const trpc = useTRPC();
  const [urlTienda, setUrlTienda] = useState(URL_TIENDA);
  useEffect(() => setUrlTienda(urlTiendaEnNavegador()), []);
  // Recien creado, se abre en Variantes: lo siguiente es agregar tallas y colores.
  const [pestana, setPestana] = useState<PestanaProducto>(recienCreado ? "variantes" : "ficha");
  // "Visible en la tienda" vive en Publicación pero se guarda con la ficha:
  // `null` = sin tocar, vale lo guardado.
  const [activo, setActivo] = useState<boolean | null>(null);
  // Lo que se esta escribiendo en la ficha, para la vista previa; `null` = lo guardado.
  const [vista, setVista] = useState<VistaProducto | null>(null);
  // Al cambiar de producto se olvida lo marcado: vuelve a valer lo guardado.
  const [deProducto, setDeProducto] = useState(productoId);
  if (deProducto !== productoId) {
    setDeProducto(productoId);
    setActivo(null);
    setVista(null);
  }
  const opciones = useQuery(trpc.panel.productos.opciones.queryOptions());
  const detalle = useQuery({
    ...trpc.panel.productos.detalle.queryOptions({ productoId: productoId ?? "" }),
    enabled: productoId !== null,
  });

  const volver = (
    <Boton variante="secundario" onClick={onVolver}>
      <IconoFlechaIzquierda tamano={16} />
      Volver a productos
    </Boton>
  );

  if (opciones.isPending || (productoId !== null && detalle.isPending)) {
    return <Cargando texto="Cargando producto…" />;
  }
  if (opciones.isError || detalle.isError) {
    return (
      <Tarjeta acciones={volver}>
        <Alerta tono="error">{opciones.error?.message ?? detalle.error?.message}</Alerta>
      </Tarjeta>
    );
  }

  // Un producto nuevo solo tiene la ficha; fotos e inventario llegan al guardarlo.
  const existente = productoId !== null && detalle.data ? detalle.data : null;
  const activoGuardado = detalle.data?.datos.activo ?? false;
  const requisitos = existente
    ? requisitosDePublicacion({
        precio: existente.datos.precio,
        variantes: existente.variantes,
        fotosPropias: existente.imagenes.filter((i) => !esImagenDemo(i.url)).length,
        descripcionCorta: existente.datos.descripcionCorta,
        descripcion: existente.datos.descripcion,
        detallesMarcados:
          existente.datos.detalles.materiales.length +
          (existente.datos.detalles.ajuste === null ? 0 : 1) +
          existente.datos.detalles.caracteristicas.length,
      })
    : [];

  const disponibilidad = existente ? resolverDisponibilidad(existente.variantes) : null;
  const precioVista = vista ? numeroDesdeTexto(vista.precio) : (existente?.datos.precio ?? 0);
  const precioListaVista = vista
    ? vista.precioLista.trim() === ""
      ? null
      : numeroDesdeTexto(vista.precioLista)
    : (existente?.datos.precioLista ?? null);
  const precioResuelto = resolverPrecio({
    precio: Number.isFinite(precioVista) ? precioVista : 0,
    precioLista: Number.isFinite(precioListaVista) ? precioListaVista : null,
  });
  const marcaVista = opciones.data.marcas.find(
    (m) => m.id === (vista ? vista.marcaId : (existente?.datos.marcaId ?? "")),
  );
  const principal = existente?.imagenes[0]?.url ?? IMAGEN_DEMO;

  const lateral =
    existente && disponibilidad ? (
      <>
        <Tarjeta sinMarco>
          <SoloLectura>
            <TarjetaProducto
              vistaPrevia
              slug={existente.datos.slug}
              nombre={(vista ? vista.nombre : existente.datos.nombre) || "Nombre del producto"}
              imagenUrl={urlVisible(principal)}
              precio={precioResuelto.precio}
              precioLista={precioResuelto.precioLista}
              descuentoPct={precioResuelto.descuentoPct}
              etiqueta={(vista ? vista.etiqueta : existente.datos.etiquetas[0]) || null}
              envioGratis={vista ? vista.envioGratis : existente.datos.envioGratis}
              marca={marcaVista?.nombre ?? null}
              disponible={disponibilidad.hayStock}
            />
          </SoloLectura>
        </Tarjeta>
        <RequisitosProducto activo={activoGuardado} requisitos={requisitos} />
      </>
    ) : null;

  // Costo medio de las variantes ya guardadas, para el margen.
  const activas = (existente?.variantes ?? []).filter((v) => v.activo);
  const costos = activas.flatMap((v) => (v.costo === null ? [] : [v.costo]));
  const costoMedio = costos.length > 0 ? costos.reduce((a, c) => a + c, 0) / costos.length : null;

  return (
    <FormularioProducto
      key={productoId ?? "nuevo"}
      productoId={productoId}
      inicial={detalle.data?.datos ?? VACIO}
      codigo={detalle.data?.codigo ?? null}
      categorias={opciones.data.categorias}
      marcas={opciones.data.marcas}
      tipos={opciones.data.tipos}
      etiquetas={opciones.data.etiquetas}
      materiales={opciones.data.materiales}
      ajustes={opciones.data.ajustes}
      caracteristicas={opciones.data.caracteristicas}
      volver={volver}
      onCreado={onCreado}
      barra={
        existente ? (
          <SelectorSegmentado
            etiqueta="Secciones del producto"
            opciones={pestanasProducto(listoParaPublicar(requisitos)).map((o) => ({
              valor: o.id,
              etiqueta: o.etiqueta,
            }))}
            valor={pestana}
            onCambio={(valor) => setPestana(valor as PestanaProducto)}
            nombresCompletos
          />
        ) : null
      }
      visible={!existente || pestana === "ficha"}
      seoVisible={existente !== null && pestana === "seo"}
      activo={activo ?? activoGuardado}
      onVista={setVista}
      listo={listoParaPublicar(requisitos)}
      onActivo={setActivo}
      urlTienda={urlTienda}
      alEliminar={onVolver}
      lateral={lateral}
      costoMedio={costoMedio}
      resto={
        /* Las pestañas se ocultan, no se desmontan: lo escrito en cada una se conserva al cambiar. */
        existente && productoId !== null ? (
          <>
            <div hidden={pestana !== "fotos"}>
              <FotosProducto productoId={productoId} imagenes={existente.imagenes} />
            </div>
            <div hidden={pestana !== "publicacion"}>
              <EstadoEnTienda
                slug={existente.datos.slug}
                activo={activo ?? activoGuardado}
                guardado={activoGuardado}
                listo={listoParaPublicar(requisitos)}
                onCambio={setActivo}
              />
            </div>
            <div hidden={pestana !== "variantes"}>
              <VariantesProducto
                productoId={productoId}
                tallasDelTipo={
                  opciones.data.tipos.find((t) => t.codigo === tipoDeCodigo(existente.codigo))
                    ?.tallas ?? []
                }
                colores={opciones.data.colores}
                disenos={opciones.data.disenos}
                variantes={existente.variantes}
                avisoInicial={
                  recienCreado ? "Producto creado. Ahora agrégale tallas, colores y stock." : null
                }
              />
            </div>
          </>
        ) : (
          <Tarjeta titulo="Tallas y colores">
            <p>Guarda el producto para agregarle tallas, colores y stock.</p>
          </Tarjeta>
        )
      }
    />
  );
}

// ── Antes de publicar ───────────────────────────────────────────────────────

/**
 * Lo que le falta al producto para mostrarse. Los mismos requisitos que el
 * servidor exige al pasar de oculto a visible, calculados con lo ya guardado.
 */
function RequisitosProducto({
  activo,
  requisitos,
}: {
  activo: boolean;
  requisitos: ReturnType<typeof requisitosDePublicacion>;
}) {
  const listo = listoParaPublicar(requisitos);
  return (
    <Tarjeta titulo="Antes de publicar">
      <ListaRequisitos requisitos={requisitos} />
      {activo ? null : listo ? (
        <Alerta tono="exito">Listo: marca "Visible en la tienda" y guarda.</Alerta>
      ) : (
        <Alerta tono="info">Cuando cumpla lo obligatorio podrás mostrarlo en la tienda.</Alerta>
      )}
    </Tarjeta>
  );
}

/**
 * El interruptor de la tienda, junto a sus requisitos. Mostrar solo se ofrece
 * cuando cumple lo obligatorio; ocultar, siempre. Se guarda con "Guardar cambios".
 */
function EstadoEnTienda({
  slug,
  activo,
  guardado,
  listo,
  onCambio,
}: {
  slug: string;
  activo: boolean;
  guardado: boolean;
  listo: boolean;
  onCambio: (activo: boolean) => void;
}) {
  const [urlTienda, setUrlTienda] = useState(URL_TIENDA);
  useEffect(() => setUrlTienda(urlTiendaEnNavegador()), []);

  return (
    <Tarjeta titulo="Estado en la tienda">
      <Casilla
        id="producto-activo"
        etiqueta="Visible en la tienda"
        marcada={activo}
        onCambio={onCambio}
        disabled={!activo && !listo}
      />
      {activo !== guardado ? (
        <Alerta tono="info">Pulsa "Guardar cambios" para aplicarlo.</Alerta>
      ) : null}
      {guardado ? (
        <Boton variante="secundario" href={`${urlTienda}/productos/${slug}`}>
          Ver en la tienda
          <IconoFlechaDerecha tamano={16} />
        </Boton>
      ) : null}
    </Tarjeta>
  );
}

// ── Fotos ───────────────────────────────────────────────────────────────────

/**
 * Fotos del producto. Se suben una por una al route handler /api/imagenes
 * (multipart, no tRPC); quitar y elegir la principal van por tRPC. Cada cambio
 * regenera la ficha y los listados del producto en la tienda.
 */
function FotosProducto({
  productoId,
  imagenes,
}: {
  productoId: string;
  imagenes: { id: string; url: string; alt: string | null }[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function alTerminar(mensaje: string, productos: ProductoTocado[]) {
    const tiendaAlDia = await revalidarTienda({ productos });
    setAviso(tiendaAlDia ? mensaje : `${mensaje} La tienda tardará unos minutos en mostrarlo.`);
    void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
  }

  const quitar = useMutation(
    trpc.panel.productos.quitarImagen.mutationOptions({
      onSuccess: (r) => alTerminar("Foto quitada.", r.revalidar.productos),
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );
  const principal = useMutation(
    trpc.panel.productos.imagenPrincipal.mutationOptions({
      onSuccess: (r) => alTerminar("Foto principal actualizada.", r.revalidar.productos),
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  async function subir(archivos: File[]) {
    setError(null);
    setAviso(null);
    setSubiendo(true);
    const tocados: ProductoTocado[] = [];
    let subidas = 0;
    // Una por una: si la tercera falla, las dos primeras ya quedaron.
    for (const archivo of archivos) {
      const datos = new FormData();
      datos.set("productoId", productoId);
      datos.set("archivo", archivo);
      try {
        const respuesta = await fetch("/api/imagenes", { method: "POST", body: datos });
        const cuerpo = (await respuesta.json()) as { error?: string; revalidar?: ProductoTocado };
        if (!respuesta.ok || !cuerpo.revalidar) {
          setError(`${archivo.name}: ${cuerpo.error ?? "no se pudo subir."}`);
          break;
        }
        tocados.push(cuerpo.revalidar);
        subidas += 1;
      } catch {
        setError(`${archivo.name}: no se pudo subir. Revisa tu conexión.`);
        break;
      }
    }
    setSubiendo(false);
    if (subidas > 0) {
      await alTerminar(
        subidas === 1 ? "Foto subida." : `${subidas} fotos subidas.`,
        tocados.slice(0, 1),
      );
    }
  }

  return (
    <Tarjeta titulo="Fotos">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      {imagenes.length === 0 ? (
        <p>Todavía usa la imagen de relleno. Sube al menos una foto antes de mostrarlo.</p>
      ) : null}
      <GaleriaEditable
        imagenes={imagenes.map((i) => ({ ...i, url: urlVisible(i.url) }))}
        onSubir={(archivos) => void subir(archivos)}
        onQuitar={(imagenId) => quitar.mutate({ imagenId })}
        onPrincipal={(imagenId) => principal.mutate({ imagenId })}
        ocupado={subiendo || quitar.isPending || principal.isPending}
        maximo={MAX_IMAGENES_POR_PRODUCTO}
        aceptar={Object.keys(TIPOS_IMAGEN).join(",")}
      />
      <p>JPG, PNG o WEBP de hasta 5 MB. La primera es la que sale en el catálogo.</p>
    </Tarjeta>
  );
}

// ── Datos del producto ──────────────────────────────────────────────────────

interface PropsFormularioProducto {
  productoId: string | null;
  inicial: DatosFormulario;
  /** Codigo de modelo ("BX008"); `null` en un producto nuevo. */
  codigo: string | null;
  categorias: { id: string; nombre: string; activo: boolean }[];
  marcas: { id: string; nombre: string; activo: boolean }[];
  /** Tipos de prenda de Atributos; al crear solo se ofrecen los visibles. */
  tipos: TipoDeOpciones[];
  /** Etiquetas visibles de Atributos. */
  etiquetas: string[];
  materiales: string[];
  ajustes: string[];
  caracteristicas: string[];
  volver: React.ReactNode;
  onCreado: (id: string) => void;
  /** Las pestañas del producto, en la cabecera; `null` en un producto nuevo. */
  barra: React.ReactNode;
  /** La ficha se oculta (sin desmontarse) cuando hay otra pestaña abierta. */
  visible: boolean;
  /** La pestaña SEO: sus campos van en el mismo formulario y se guardan juntos. */
  seoVisible: boolean;
  /** "Visible en la tienda": se marca en Publicación y se guarda con la ficha. */
  activo: boolean;
  /** Cada cambio de lo que alimenta la vista previa, aun sin guardar. */
  onVista: (vista: VistaProducto) => void;
  /** Columna fija a la derecha de las pestañas (vista previa y requisitos). */
  lateral: React.ReactNode;
  /** Costo medio de las variantes activas; `null` si ninguna lo tiene. */
  costoMedio: number | null;
  /** Las demas pestañas, que se colocan junto a la ficha. */
  resto: React.ReactNode;
  /** Botón cuadrado junto a las pestañas; `null` si el producto no esta a la venta. */
  /** Cumple lo obligatorio de "Antes de publicar": solo entonces se puede mostrar. */
  listo: boolean;
  /** Marcar o desmarcar "Visible en la tienda"; se guarda con "Guardar cambios". */
  onActivo: (activo: boolean) => void;
  /** Direccion de la tienda, para copiar el enlace del producto. */
  urlTienda: string;
  /** Tras eliminar el producto, volver a la lista. */
  alEliminar: () => void;
}

function FormularioProducto({
  productoId,
  inicial,
  codigo,
  categorias,
  marcas,
  tipos,
  etiquetas,
  materiales,
  ajustes,
  caracteristicas,
  volver,
  onCreado,
  barra,
  visible,
  seoVisible,
  activo,
  onVista,
  lateral,
  costoMedio,
  resto,
  listo,
  onActivo,
  urlTienda,
  alEliminar,
}: PropsFormularioProducto) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const nuevo = productoId === null;

  const [nombre, setNombre] = useState(inicial.nombre);
  const [slug, setSlug] = useState(inicial.slug);
  // En un producto nuevo el slug sigue al nombre hasta que alguien lo toca.
  const [slugTocado, setSlugTocado] = useState(!nuevo);
  // El tipo tambien se sugiere desde el nombre hasta que alguien lo elige.
  const tiposVisibles = tipos.filter((t) => t.activo);
  const [tipo, setTipo] = useState(
    tiposVisibles.some((t) => t.codigo === TIPO_POR_DEFECTO)
      ? TIPO_POR_DEFECTO
      : (tiposVisibles[0]?.codigo ?? ""),
  );
  const [tipoTocado, setTipoTocado] = useState(false);
  const [categoriaId, setCategoriaId] = useState(inicial.categoriaId);
  const [marcaId, setMarcaId] = useState(inicial.marcaId ?? "");
  const [precio, setPrecio] = useState(inicial.precio === null ? "" : String(inicial.precio));
  const [precioLista, setPrecioLista] = useState(
    inicial.precioLista === null ? "" : String(inicial.precioLista),
  );
  const [descripcionCorta, setDescripcionCorta] = useState(inicial.descripcionCorta);
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [etiquetasElegidas, setEtiquetasElegidas] = useState(inicial.etiquetas);
  const etiqueta = etiquetasElegidas[0] ?? "";
  const [envioGratis, setEnvioGratis] = useState(inicial.envioGratis);
  const [nuevoHasta, setNuevoHasta] = useState(inicial.nuevoHasta);
  const [tituloSeo, setTituloSeo] = useState(inicial.tituloSeo);
  const [descripcionSeo, setDescripcionSeo] = useState(inicial.descripcionSeo);
  const [destacado, setDestacado] = useState(inicial.destacado);
  const [mostrarAgotado, setMostrarAgotado] = useState(inicial.mostrarAgotado);
  const [permiteResenas, setPermiteResenas] = useState(inicial.permiteResenas);
  const [enPacks, setEnPacks] = useState(inicial.enPacks);
  const [enBuscador, setEnBuscador] = useState(inicial.enBuscador);
  const [detalles, setDetalles] = useState(inicial.detalles);

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    onVista({ nombre, descripcionCorta, precio, precioLista, etiqueta, envioGratis, marcaId });
  }, [onVista, nombre, descripcionCorta, precio, precioLista, etiqueta, envioGratis, marcaId]);

  const tieneNuevo = etiquetasElegidas.some((e) => e.trim().toLowerCase() === "nuevo");

  function datos() {
    return {
      nombre,
      slug,
      categoriaId,
      marcaId: marcaId === "" ? null : marcaId,
      precio: numeroDesdeTexto(precio),
      precioLista: precioLista.trim() === "" ? null : numeroDesdeTexto(precioLista),
      descripcionCorta,
      descripcion,
      etiquetas: etiquetasElegidas,
      envioGratis,
      tituloSeo,
      descripcionSeo,
      nuevoHasta: tieneNuevo ? nuevoHasta : "",
      destacado,
      mostrarAgotado,
      permiteResenas,
      enPacks,
      enBuscador,
      activo,
      detalles,
    };
  }

  async function alGuardar(
    mensaje: string,
    revalidar: { productos: { slug: string; slugCategoria: string }[]; catalogo: boolean },
  ) {
    setError(null);
    const tiendaAlDia = await revalidarTienda(revalidar);
    setAviso(tiendaAlDia ? mensaje : `${mensaje} La tienda tardará unos minutos en mostrarlo.`);
    void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(mensajeDeFallo(fallo));
  }

  const crear = useMutation(
    trpc.panel.productos.crear.mutationOptions({
      onSuccess: async (r) => {
        await alGuardar("Producto creado.", r.revalidar);
        onCreado(r.id);
      },
      onError: alFallar,
    }),
  );

  const editar = useMutation(
    trpc.panel.productos.editar.mutationOptions({
      onSuccess: (r) => alGuardar("Cambios guardados.", r.revalidar),
      onError: alFallar,
    }),
  );

  /** "+ Nuevo" dentro de un grupo de chips: crea el atributo y lo deja marcado. */
  const crearDetalle = useMutation(
    trpc.panel.atributos.guardar.mutationOptions({
      onSuccess: (_r, v) => {
        setError(null);
        void queryClient.invalidateQueries(trpc.panel.productos.opciones.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.atributos.pathFilter());
        if (v.clase === "MATERIAL") alternarDetalle("materiales", v.nombre);
        if (v.clase === "AJUSTE") alternarDetalle("ajuste", v.nombre);
        if (v.clase === "CARACTERISTICA") alternarDetalle("caracteristicas", v.nombre);
      },
      onError: alFallar,
    }),
  );

  /** Marca o desmarca un chip; el ajuste es uno solo y volver a tocarlo lo quita. */
  function alternarDetalle(campo: keyof DetallesPrenda, valor: string) {
    setDetalles((actual) => {
      if (campo === "ajuste") return { ...actual, ajuste: actual.ajuste === valor ? null : valor };
      const lista = actual[campo];
      return {
        ...actual,
        [campo]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor],
      };
    });
  }

  const duplicar = useMutation(
    trpc.panel.productos.duplicar.mutationOptions({
      onSuccess: async (r) => {
        await alGuardar(`Copia creada: ${r.nombre}.`, r.revalidar);
        onCreado(r.id);
      },
      onError: alFallar,
    }),
  );

  const eliminar = useMutation(
    trpc.panel.productos.eliminar.mutationOptions({
      onSuccess: async (r) => {
        await revalidarTienda(r.revalidar);
        void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
        alEliminar();
      },
      onError: alFallar,
    }),
  );

  const guardando = crear.isPending || editar.isPending;
  const trabajando = guardando || duplicar.isPending || eliminar.isPending;

  const enlaceDelProducto = `${urlTienda}/productos/${inicial.slug}`;
  const menu = productoId ? (
    <MenuAcciones
      etiqueta="Más acciones"
      acciones={[
        {
          etiqueta: "Duplicar producto",
          icono: <IconoCopiar tamano={16} />,
          disabled: trabajando,
          onClick: () => duplicar.mutate({ productoId }),
        },
        {
          etiqueta: "Copiar enlace",
          icono: <IconoGlobo tamano={16} />,
          disabled: !inicial.activo,
          onClick: () => {
            setError(null);
            navigator.clipboard
              .writeText(enlaceDelProducto)
              .then(() => setAviso("Enlace copiado."))
              .catch(() => setError("No se pudo copiar el enlace."));
          },
        },
        {
          etiqueta: "Eliminar producto",
          icono: <IconoPapelera tamano={16} />,
          peligro: true,
          disabled: trabajando,
          onClick: () => {
            if (window.confirm(`¿Eliminar "${inicial.nombre}"? No se puede deshacer.`)) {
              eliminar.mutate({ productoId });
            }
          },
        },
      ]}
    />
  ) : null;

  const interruptor = productoId ? (
    <InterruptorPanel
      etiqueta="Visible"
      marcada={activo}
      onCambio={onActivo}
      disabled={!activo && !listo}
      motivo="Cumple lo obligatorio de «Antes de publicar» para mostrarlo."
    />
  ) : null;

  const acciones = (
    <>
      {volver}
      <Boton tipo="submit" formulario="formulario-producto" disabled={guardando}>
        {guardando ? "Guardando…" : nuevo ? "Crear producto" : "Guardar cambios"}
      </Boton>
    </>
  );

  return (
    <>
      {/* Con pestañas, los botones suben a su barra; un producto nuevo los deja en la cabecera. */}
      {barra ? null : <CabeceraDetalle titulo="Nuevo producto" acciones={acciones} />}
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <PanelOUnico
        barra={barra}
        lateral={lateral}
        acciones={acciones}
        interruptor={interruptor}
        menu={menu}
        contenido={
          <>
            <div hidden={!visible && !seoVisible}>
              <Formulario
                id="formulario-producto"
                ancho="completo"
                onSubmit={(evento) => {
                  evento.preventDefault();
                  if (nuevo) crear.mutate({ datos: datos(), tipo });
                  else editar.mutate({ productoId, datos: datos() });
                }}
              >
                {/* Lo que define al producto a la izquierda; precio y vitrina a la derecha. */}
                <FilaTarjetas mismoAlto oculta={!visible}>
                  <Tarjeta sinMarco>
                    <Tarjeta titulo="Datos del producto">
                      <FilaUnida iguales>
                        <Campo
                          id="producto-nombre"
                          etiqueta="Nombre"
                          valor={nombre}
                          onCambio={(valor) => {
                            setNombre(valor);
                            if (!slugTocado) setSlug(slugDesdeTexto(valor));
                            if (nuevo && !tipoTocado) {
                              const sugerido = tipoDesdeNombre(valor, tiposVisibles);
                              if (tiposVisibles.some((t) => t.codigo === sugerido))
                                setTipo(sugerido);
                            }
                          }}
                          requerido
                        />
                        <Campo
                          id="producto-slug"
                          etiqueta="Dirección web (slug)"
                          valor={slug}
                          onCambio={(valor) => {
                            setSlugTocado(true);
                            setSlug(valor);
                          }}
                          placeholder="boxer-algodon-pima"
                          requerido
                        />
                      </FilaUnida>
                      <FilaUnida iguales>
                        {nuevo ? (
                          <CampoSelectorLista
                            id="producto-tipo"
                            etiqueta="Tipo de prenda (fija el código)"
                            valor={tipo}
                            opciones={[
                              ...(tipo === ""
                                ? [{ valor: "", etiqueta: "Crea un tipo en Atributos" }]
                                : []),
                              ...tiposVisibles.map((t) => ({
                                valor: t.codigo,
                                etiqueta: `${t.codigo} · ${t.nombre}`,
                              })),
                            ]}
                            onCambio={(valor) => {
                              setTipoTocado(true);
                              setTipo(valor);
                            }}
                          />
                        ) : (
                          <Campo
                            id="producto-codigo"
                            etiqueta="Código del modelo (no cambia)"
                            valor={codigo ?? "Sin código"}
                            onCambio={() => {}}
                            disabled
                          />
                        )}
                        <CampoSelectorLista
                          id="producto-categoria"
                          etiqueta="Categoría"
                          valor={categoriaId}
                          opciones={[
                            { valor: "", etiqueta: "Elige una categoría" },
                            ...categorias.map((c) => ({
                              valor: c.id,
                              etiqueta: c.activo ? c.nombre : `${c.nombre} (oculta)`,
                            })),
                          ]}
                          onCambio={setCategoriaId}
                        />
                      </FilaUnida>
                      <Campo
                        id="producto-resumen"
                        etiqueta="Resumen (sale en la tarjeta del listado)"
                        valor={descripcionCorta}
                        onCambio={setDescripcionCorta}
                        placeholder="Algodón pima, cintura suave"
                      />
                      <CampoTexto
                        id="producto-descripcion"
                        etiqueta="Descripción (sale en la ficha)"
                        valor={descripcion}
                        onCambio={setDescripcion}
                        filas={5}
                      />
                    </Tarjeta>
                    <Tarjeta titulo="Detalles de la prenda">
                      {(
                        [
                          {
                            campo: "materiales",
                            titulo: "Material",
                            opciones: materiales,
                            clase: "MATERIAL",
                            singular: "material",
                          },
                          {
                            campo: "ajuste",
                            titulo: "Ajuste",
                            opciones: ajustes,
                            clase: "AJUSTE",
                            singular: "ajuste",
                          },
                          {
                            campo: "caracteristicas",
                            titulo: "Características",
                            opciones: caracteristicas,
                            clase: "CARACTERISTICA",
                            singular: "característica",
                          },
                        ] as const
                      ).map((g) => {
                        const marcados =
                          g.campo === "ajuste" ? [detalles.ajuste] : detalles[g.campo];
                        // Lo marcado que luego se ocultó en Atributos sigue a la vista, como la etiqueta.
                        const ocultos = marcados.filter(
                          (m): m is string => m !== null && !g.opciones.includes(m),
                        );
                        return (
                          <GrupoChips key={g.campo} titulo={g.titulo}>
                            {[...g.opciones, ...ocultos].map((nombre) => (
                              <ChipAtributo
                                key={nombre}
                                id={`${g.clase}-${nombre}`}
                                nombre={nombre}
                                oculto={ocultos.includes(nombre)}
                                seleccionado={marcados.includes(nombre)}
                                onElegir={() => alternarDetalle(g.campo, nombre)}
                              />
                            ))}
                            <ChipAgregar
                              texto="+ Nuevo"
                              etiqueta={`Nuevo ${g.singular}`}
                              placeholder="Nombre"
                              disabled={crearDetalle.isPending}
                              onAgregar={(nombre) =>
                                crearDetalle.mutate({ clase: g.clase, nombre, activo: true })
                              }
                            />
                          </GrupoChips>
                        );
                      })}
                    </Tarjeta>
                  </Tarjeta>
                  <Tarjeta sinMarco>
                    <Tarjeta titulo="Precio">
                      <FilaUnida iguales>
                        <Campo
                          id="producto-precio"
                          etiqueta="Precio (S/)"
                          valor={precio}
                          onCambio={setPrecio}
                          placeholder="29.90"
                          requerido
                        />
                        <Campo
                          id="producto-precio-lista"
                          etiqueta="Precio anterior"
                          ayuda="Si es mayor que el precio, el producto sale en oferta con su descuento."
                          valor={precioLista}
                          onCambio={setPrecioLista}
                          placeholder="Opcional"
                        />
                      </FilaUnida>
                      <FilaUnida iguales>
                        <Campo
                          id="producto-costo-medio"
                          etiqueta="Costo medio"
                          ayuda="Promedio de lo que te costó cada variante activa en tus compras."
                          valor={costoMedio === null ? "Sin costo" : MONEDA.format(costoMedio)}
                          onCambio={() => {}}
                          disabled
                        />
                        <Campo
                          id="producto-margen"
                          etiqueta="Margen"
                          ayuda="Lo que ganas sobre el precio de venta: (precio − costo) ÷ precio."
                          valor={
                            costoMedio === null || numeroDesdeTexto(precio) <= 0
                              ? "—"
                              : `${Math.round(((numeroDesdeTexto(precio) - costoMedio) / numeroDesdeTexto(precio)) * 100)} %`
                          }
                          onCambio={() => {}}
                          disabled
                        />
                      </FilaUnida>
                    </Tarjeta>
                    <Tarjeta titulo="Vitrina">
                      <CampoSelectorBuscable
                        id="producto-marca"
                        etiqueta="Marca"
                        valor={marcaId}
                        opciones={[
                          { valor: "", etiqueta: "Sin marca" },
                          ...marcas.map((m) => ({ valor: m.id, etiqueta: m.nombre })),
                        ]}
                        onCambio={setMarcaId}
                      />
                      <SelectorEtiquetas
                        id="producto-etiquetas"
                        etiqueta="Etiquetas sobre la foto (se crean en Atributos)"
                        // Las que ya tenia siguen a la vista aunque se hayan ocultado en Atributos.
                        opciones={[
                          ...inicial.etiquetas.filter((e) => !etiquetas.includes(e)),
                          ...etiquetas,
                        ]}
                        valores={etiquetasElegidas}
                        onCambio={setEtiquetasElegidas}
                      />
                      {tieneNuevo ? (
                        <SelectorFecha
                          id="producto-nuevo-hasta"
                          etiqueta="Nuevo hasta (después se quita sola)"
                          valor={nuevoHasta}
                          onCambio={setNuevoHasta}
                          anioMinimo={new Date().getFullYear()}
                          anioMaximo={new Date().getFullYear() + 2}
                        />
                      ) : null}
                      <InterruptorCampo
                        etiqueta="Envío gratis"
                        ayuda="Muestra «Envío gratis» sobre la foto de la tarjeta."
                        marcada={envioGratis}
                        onCambio={setEnvioGratis}
                      />
                      <InterruptorCampo
                        etiqueta="Destacado"
                        ayuda="El producto sale en «Productos destacados» de la portada."
                        marcada={destacado}
                        onCambio={setDestacado}
                      />
                      <InterruptorCampo
                        etiqueta="Mostrar agotado"
                        ayuda="Sin stock, sigue en los listados como agotado. Apagado, se oculta de ellos."
                        marcada={mostrarAgotado}
                        onCambio={setMostrarAgotado}
                      />
                      <InterruptorCampo
                        etiqueta="Reseñas"
                        ayuda="Apagado, la ficha no muestra reseñas ni deja escribir nuevas."
                        marcada={permiteResenas}
                        onCambio={setPermiteResenas}
                      />
                      <InterruptorCampo
                        etiqueta="En packs"
                        ayuda="Apagado, el producto no se puede poner dentro de un pack."
                        marcada={enPacks}
                        onCambio={setEnPacks}
                      />
                      <InterruptorCampo
                        etiqueta="En el buscador"
                        ayuda="Apagado, no sale al buscar; sigue en su categoría y su marca."
                        marcada={enBuscador}
                        onCambio={setEnBuscador}
                      />
                      {nuevo ? (
                        <Alerta tono="info">
                          El producto se crea oculto. Después agrégale fotos y variantes con stock
                          para mostrarlo en la tienda.
                        </Alerta>
                      ) : null}
                    </Tarjeta>
                  </Tarjeta>
                </FilaTarjetas>
                {seoVisible ? (
                  <FilaTarjetas>
                    <Tarjeta titulo="Búsqueda en Google">
                      <Campo
                        id="producto-titulo-seo"
                        etiqueta={`Título (${tituloSeo.length}/70)`}
                        ayuda="Lo que se ve en azul en los resultados. Vacío, Google usa el nombre del producto."
                        valor={tituloSeo}
                        onCambio={setTituloSeo}
                        placeholder={nombre}
                      />
                      <CampoTexto
                        id="producto-descripcion-seo"
                        etiqueta={`Descripción (${descripcionSeo.length}/170)`}
                        valor={descripcionSeo}
                        onCambio={setDescripcionSeo}
                        placeholder={descripcionCorta}
                        filas={3}
                      />
                    </Tarjeta>
                    <Tarjeta titulo="Así se verá">
                      <p>{tituloSeo.trim() || nombre || "Nombre del producto"}</p>
                      <p>{`${urlTienda}/productos/${slug}`}</p>
                      <p>{descripcionSeo.trim() || descripcionCorta || "Sin descripción."}</p>
                    </Tarjeta>
                  </FilaTarjetas>
                ) : null}
              </Formulario>
            </div>
            {resto}
          </>
        }
      />
    </>
  );
}

/** Con pestañas, todo dentro de una tarjeta; sin ellas (producto nuevo), suelto como antes. */
function PanelOUnico({
  barra,
  lateral,
  acciones,
  interruptor,
  menu,
  contenido,
}: {
  barra: React.ReactNode;
  lateral: React.ReactNode;
  acciones: React.ReactNode;
  interruptor: React.ReactNode;
  menu: React.ReactNode;
  contenido: React.ReactNode;
}) {
  if (!barra) return <>{contenido}</>;
  return (
    <PanelConPestanas
      pestanas={barra}
      lateral={lateral}
      acciones={acciones}
      interruptor={interruptor}
      menu={menu}
    >
      {contenido}
    </PanelConPestanas>
  );
}

// ── Variantes ───────────────────────────────────────────────────────────────

interface PropsVariantesProducto {
  productoId: string;
  /** Tallas del tipo de prenda del modelo: las que se ofrecen marcar. */
  tallasDelTipo: string[];
  /** Colores y diseños visibles en Atributos. */
  colores: { nombre: string; hex: string | null }[];
  disenos: string[];
  avisoInicial: string | null;
  variantes: {
    id: string;
    talla: string;
    color: string;
    diseno: string;
    sku: string;
    stock: number;
    /** Costo puesto a mano o el de la ultima compra, que lo vuelve a fijar. */
    costo: number | null;
    activo: boolean;
  }[];
}

/** Las variantes agrupadas por color, en el orden en que aparece cada color. */
function agruparPorColor<T extends { color: string }>(variantes: T[]): [string, T[]][] {
  const grupos = new Map<string, T[]>();
  for (const v of variantes) grupos.set(v.color, [...(grupos.get(v.color) ?? []), v]);
  return [...grupos];
}

/** Costo de una variante: se escribe y se guarda al salir del campo; vacio lo quita. */
function CostoDeVariante({
  id,
  costo,
  deshabilitado,
  onGuardar,
}: {
  id: string;
  costo: number | null;
  deshabilitado: boolean;
  onGuardar: (costo: number | null) => void;
}) {
  const inicial = costo === null ? "" : String(costo);
  const [texto, setTexto] = useState(inicial);
  // Si el costo cambia desde fuera (una compra), el campo lo sigue.
  useEffect(() => setTexto(inicial), [inicial]);

  function guardar() {
    if (texto === inicial) return;
    onGuardar(texto.trim() === "" ? null : numeroDesdeTexto(texto));
  }

  return (
    <Campo
      id={`costo-${id}`}
      etiqueta="Costo"
      etiquetaOculta
      valor={texto}
      onCambio={setTexto}
      onSalir={guardar}
      disabled={deshabilitado}
      placeholder="Costo S/"
      modoTeclado="decimal"
    />
  );
}

/** "XXXL, 3XL ,," -> ["XXXL", "3XL"]: las tallas escritas a mano, separadas por comas. */
function tallasEscritas(texto: string): string[] {
  return texto
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Tallas y colores. Se crean en bloque: cada talla marcada con cada color
 * marcado, en un mismo diseño. El stock no se edita aqui: el inicial entra
 * como ingreso y despues todo pasa por la seccion Stock, que deja el
 * movimiento escrito.
 */
function VariantesProducto({
  productoId,
  tallasDelTipo,
  colores: coloresDisponibles,
  disenos,
  variantes,
  avisoInicial,
}: PropsVariantesProducto) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [tallas, setTallas] = useState<string[]>([]);
  const [otrasTallas, setOtrasTallas] = useState("");
  const [colores, setColores] = useState<string[]>([]);
  // Sin variantes aun, el formulario arranca abierto: es lo unico que hay que hacer.
  const [agregando, setAgregando] = useState(variantes.length === 0);
  const disenoInicial = disenos.includes(DISENO_POR_DEFECTO)
    ? DISENO_POR_DEFECTO
    : (disenos[0] ?? "");
  const [diseno, setDiseno] = useState(disenoInicial);
  const [stockInicial, setStockInicial] = useState("0");
  const [costo, setCosto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(avisoInicial);

  async function alTerminar(
    mensaje: string,
    revalidar: { productos: { slug: string; slugCategoria: string }[]; catalogo: boolean },
  ) {
    setError(null);
    await revalidarTienda(revalidar);
    setAviso(mensaje);
    void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(mensajeDeFallo(fallo));
  }

  const agregar = useMutation(
    trpc.panel.productos.agregarVariantes.mutationOptions({
      onSuccess: async (r) => {
        setTallas([]);
        setOtrasTallas("");
        setColores([]);
        setDiseno(disenoInicial);
        setStockInicial("0");
        setCosto("");
        const saltadas = r.yaExistian > 0 ? ` ${r.yaExistian} ya existían y se saltaron.` : "";
        await alTerminar(
          `${r.creadas} ${r.creadas === 1 ? "variante agregada" : "variantes agregadas"}.${saltadas}`,
          r.revalidar,
        );
      },
      onError: alFallar,
    }),
  );

  const todasLasTallas = [...tallas, ...tallasEscritas(otrasTallas)];
  const cuantas = todasLasTallas.length * colores.length;

  const cambiarActivo = useMutation(
    trpc.panel.productos.cambiarActivoVariante.mutationOptions({
      onSuccess: (r, v) =>
        alTerminar(v.activo ? "Variante visible otra vez." : "Variante oculta.", r.revalidar),
      onError: alFallar,
    }),
  );

  const fijarCosto = useMutation(
    trpc.panel.productos.fijarCosto.mutationOptions({
      onSuccess: () => {
        setError(null);
        setAviso("Costo guardado.");
        void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
      },
      onError: alFallar,
    }),
  );

  // Un color o diseño que falta se crea aqui mismo, sin ir a Atributos, y
  // queda elegido. Se guarda en Atributos como cualquier otro.
  const [familiaNueva, setFamiliaNueva] = useState("0");
  const altaRapida = useMutation(
    trpc.panel.atributos.guardar.mutationOptions({
      onSuccess: (r, v) => {
        setError(null);
        if (v.clase === "COLOR") setColores((actuales) => [...actuales, v.nombre]);
        else setDiseno(v.nombre);
        setAviso(
          r.codigo
            ? `Color ${v.nombre} creado con el código ${r.codigo}.`
            : `Diseño ${v.nombre} creado.`,
        );
        void queryClient.invalidateQueries(trpc.panel.productos.opciones.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.atributos.pathFilter());
      },
      onError: alFallar,
    }),
  );

  const eliminar = useMutation(
    trpc.panel.productos.eliminarVariante.mutationOptions({
      onSuccess: (r) => alTerminar("Variante eliminada.", r.revalidar),
      onError: alFallar,
    }),
  );

  const trabajando =
    agregar.isPending ||
    cambiarActivo.isPending ||
    eliminar.isPending ||
    fijarCosto.isPending ||
    altaRapida.isPending;

  const unidades = variantes.reduce((suma, v) => suma + v.stock, 0);
  const conStockBajo = variantes.filter((v) => v.stock <= UMBRAL_STOCK_BAJO).length;

  return (
    <>
      <Tarjeta
        titulo="Tallas y colores"
        acciones={
          <Boton
            variante={agregando ? "secundario" : "primario"}
            onClick={() => setAgregando(!agregando)}
          >
            {agregando ? "Cerrar" : "+ Agregar variantes"}
          </Boton>
        }
      >
        {error ? <Alerta tono="error">{error}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
        {variantes.length > 0 ? (
          <p>
            {variantes.length} {variantes.length === 1 ? "variante" : "variantes"} · {unidades} u.
            {conStockBajo > 0 ? ` · ${conStockBajo} con stock bajo` : ""}
          </p>
        ) : null}

        {variantes.length === 0 ? (
          <p>Todavía no tiene tallas. Agrega al menos una para poder venderlo.</p>
        ) : (
          <RejillaGrupos>
            {agruparPorColor(variantes).map(([color, delColor]) => (
              <GrupoColor
                key={color}
                muestra={coloresDisponibles.find((c) => c.nombre === color)?.hex ?? null}
                nombre={color}
                tallas={delColor.map((v) => ({
                  talla: v.talla,
                  stock: v.stock,
                  bajo: v.stock <= UMBRAL_STOCK_BAJO,
                }))}
              >
                <RejillaVariantes>
                  {delColor.map((v) => (
                    <FilaVariante
                      key={v.id}
                      talla={v.talla}
                      sku={v.sku}
                      estado={
                        !v.activo
                          ? { texto: "Oculta", tono: "alerta" }
                          : v.stock === 0
                            ? { texto: "Sin stock", tono: "error" }
                            : v.stock <= UMBRAL_STOCK_BAJO
                              ? { texto: "Stock bajo", tono: "alerta" }
                              : null
                      }
                      stock={v.stock}
                      costo={
                        <CostoDeVariante
                          id={v.id}
                          costo={v.costo}
                          deshabilitado={trabajando}
                          onGuardar={(costo) => fijarCosto.mutate({ varianteId: v.id, costo })}
                        />
                      }
                      activo={v.activo}
                      deshabilitado={trabajando}
                      onAlternarActivo={() =>
                        cambiarActivo.mutate({ varianteId: v.id, activo: !v.activo })
                      }
                      onEliminar={() => {
                        if (
                          window.confirm(`¿Eliminar ${v.talla} · ${v.color}? No se puede deshacer.`)
                        ) {
                          eliminar.mutate({ varianteId: v.id });
                        }
                      }}
                    />
                  ))}
                </RejillaVariantes>
              </GrupoColor>
            ))}
          </RejillaGrupos>
        )}
      </Tarjeta>
      {/* El formulario se abre solo al pedirlo: agregar es ocasional y no debe empujar la lista. */}
      {agregando ? (
        <Tarjeta titulo="Agregar variantes">
          <Formulario
            ancho="completo"
            onSubmit={(evento) => {
              evento.preventDefault();
              agregar.mutate({
                productoId,
                tallas: todasLasTallas,
                colores,
                diseno,
                stockInicial: numeroDesdeTexto(stockInicial),
                costo: costo.trim() === "" ? null : numeroDesdeTexto(costo),
              });
            }}
          >
            <SelectorMultiple
              etiqueta="Tallas (las de su tipo de prenda)"
              opciones={tallasDelTipo.map((t) => ({ valor: t, etiqueta: t }))}
              valores={tallas}
              onCambio={setTallas}
              disabled={trabajando}
            />
            <Campo
              id="variante-otras-tallas"
              etiqueta="Otras tallas (separadas por comas)"
              valor={otrasTallas}
              onCambio={setOtrasTallas}
              placeholder="XXXL, 6M, 12"
            />
            <SelectorMultipleDesplegable
              etiqueta="Colores"
              opciones={coloresDisponibles.map((c) => ({
                valor: c.nombre,
                etiqueta: c.nombre,
                muestra: c.hex,
              }))}
              valores={colores}
              onCambio={setColores}
              vacio="Elige colores"
              disabled={trabajando}
            />
            <FilaUnida iguales>
              <CampoSelectorLista
                id="variante-familia-nueva"
                etiqueta="¿Falta un color? Elige su familia"
                valor={familiaNueva}
                opciones={FAMILIAS_COLOR.map((f) => ({
                  valor: String(f.decena),
                  etiqueta: `${f.decena}x · ${f.nombre}`,
                }))}
                onCambio={setFamiliaNueva}
              />
              <GrupoChips titulo="y escríbelo">
                <ChipAgregar
                  texto="+ Nuevo color"
                  etiqueta="Nombre del color nuevo"
                  placeholder="Plateado"
                  disabled={trabajando}
                  onAgregar={(nombre) =>
                    altaRapida.mutate({
                      clase: "COLOR",
                      nombre,
                      familia: Number(familiaNueva),
                      activo: true,
                    })
                  }
                />
              </GrupoChips>
            </FilaUnida>
            <CampoSelectorLista
              id="variante-diseno"
              etiqueta="Diseño"
              valor={diseno}
              opciones={disenos.map((d) => ({ valor: d, etiqueta: d }))}
              onCambio={setDiseno}
            />
            <GrupoChips>
              <ChipAgregar
                texto="+ Nuevo diseño"
                etiqueta="Nombre del diseño nuevo"
                placeholder="Encaje"
                disabled={trabajando}
                onAgregar={(nombre) => altaRapida.mutate({ clase: "DISENO", nombre, activo: true })}
              />
            </GrupoChips>
            <FilaUnida iguales>
              <Campo
                id="variante-stock"
                etiqueta="Stock inicial de cada una"
                valor={stockInicial}
                onCambio={setStockInicial}
                modoTeclado="numeric"
              />
              <Campo
                id="variante-costo"
                etiqueta="Costo por unidad (opcional)"
                valor={costo}
                onCambio={setCosto}
                placeholder="S/ 8.50"
                modoTeclado="decimal"
              />
            </FilaUnida>
            {cuantas > MAX_VARIANTES_POR_LOTE ? (
              <Alerta tono="error">
                Son {cuantas} combinaciones: se crean hasta {MAX_VARIANTES_POR_LOTE} de una vez.
              </Alerta>
            ) : null}
            <Boton
              tipo="submit"
              variante="secundario"
              disabled={trabajando || cuantas === 0 || cuantas > MAX_VARIANTES_POR_LOTE}
            >
              {agregar.isPending
                ? "Agregando…"
                : cuantas === 0
                  ? "Marca tallas y colores"
                  : `+ Agregar ${cuantas} ${cuantas === 1 ? "variante" : "variantes"}`}
            </Boton>
          </Formulario>
        </Tarjeta>
      ) : null}
    </>
  );
}
