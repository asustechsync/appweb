"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DISENO_POR_DEFECTO,
  esImagenDemo,
  FAMILIAS_COLOR,
  listoParaPublicar,
  margenDe,
  MAX_IMAGENES_POR_PRODUCTO,
  MAX_VARIANTES_POR_LOTE,
  requisitosDePublicacion,
  slugDesdeTexto,
  TIPO_POR_DEFECTO,
  tipoDeCodigo,
  tipoDesdeNombre,
  TIPOS_IMAGEN,
} from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  CampoTexto,
  CabeceraDetalle,
  ChipAgregar,
  Cargando,
  Casilla,
  FilaMovimiento,
  FilaUnida,
  Formulario,
  GaleriaEditable,
  GrupoChips,
  IconoCatalogo,
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  ListaRequisitos,
  LogoIcono,
  SelectorMultiple,
  Tarjeta,
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
  etiqueta: string;
  envioGratis: boolean;
  destacado: boolean;
  activo: boolean;
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
  etiqueta: "",
  envioGratis: false,
  destacado: false,
  activo: false,
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

/** Datos del producto arriba; tallas y colores abajo, cuando ya existe. */
export function EditorProducto({
  productoId,
  recienCreado,
  onCreado,
  onVolver,
}: PropsEditorProducto) {
  const trpc = useTRPC();
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

  return (
    <>
      <FormularioProducto
        key={productoId ?? "nuevo"}
        productoId={productoId}
        inicial={detalle.data?.datos ?? VACIO}
        codigo={detalle.data?.codigo ?? null}
        categorias={opciones.data.categorias}
        marcas={opciones.data.marcas}
        tipos={opciones.data.tipos}
        etiquetas={opciones.data.etiquetas}
        volver={volver}
        onCreado={onCreado}
      />
      {productoId !== null && detalle.data ? (
        <RequisitosProducto
          activo={detalle.data.datos.activo}
          requisitos={requisitosDePublicacion({
            precio: detalle.data.datos.precio,
            variantes: detalle.data.variantes,
            fotosPropias: detalle.data.imagenes.filter((i) => !esImagenDemo(i.url)).length,
            descripcionCorta: detalle.data.datos.descripcionCorta,
          })}
        />
      ) : null}
      {productoId !== null && detalle.data ? (
        <FotosProducto productoId={productoId} imagenes={detalle.data.imagenes} />
      ) : null}
      {productoId !== null && detalle.data ? (
        <VariantesProducto
          productoId={productoId}
          tallasDelTipo={
            opciones.data.tipos.find((t) => t.codigo === tipoDeCodigo(detalle.data.codigo))
              ?.tallas ?? []
          }
          colores={opciones.data.colores}
          disenos={opciones.data.disenos}
          variantes={detalle.data.variantes}
          precio={detalle.data.datos.precio}
          avisoInicial={
            recienCreado ? "Producto creado. Ahora agrégale tallas, colores y stock." : null
          }
        />
      ) : (
        <Tarjeta titulo="Tallas y colores">
          <p>Guarda el producto para agregarle tallas, colores y stock.</p>
        </Tarjeta>
      )}
    </>
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
  volver: React.ReactNode;
  onCreado: (id: string) => void;
}

function FormularioProducto({
  productoId,
  inicial,
  codigo,
  categorias,
  marcas,
  tipos,
  etiquetas,
  volver,
  onCreado,
}: PropsFormularioProducto) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const nuevo = productoId === null;

  const [urlTienda, setUrlTienda] = useState(URL_TIENDA);
  useEffect(() => setUrlTienda(urlTiendaEnNavegador()), []);
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
  const [etiqueta, setEtiqueta] = useState(inicial.etiqueta);
  const [envioGratis, setEnvioGratis] = useState(inicial.envioGratis);
  const [destacado, setDestacado] = useState(inicial.destacado);
  const [activo, setActivo] = useState(inicial.activo);

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

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
      etiqueta,
      envioGratis,
      destacado,
      activo,
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

  const guardando = crear.isPending || editar.isPending;

  return (
    <>
      <CabeceraDetalle
        titulo={nuevo ? "Nuevo producto" : inicial.nombre}
        acciones={
          <>
            {!nuevo && inicial.activo ? (
              <Boton variante="secundario" href={`${urlTienda}/productos/${inicial.slug}`}>
                Ver en la tienda
                <IconoFlechaDerecha tamano={16} />
              </Boton>
            ) : null}
            {volver}
          </>
        }
      />
      <Tarjeta titulo="Datos del producto">
        {error ? <Alerta tono="error">{error}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
        <Formulario
          ancho="completo"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (nuevo) crear.mutate({ datos: datos(), tipo });
            else editar.mutate({ productoId, datos: datos() });
          }}
        >
          <Campo
            id="producto-nombre"
            etiqueta="Nombre"
            valor={nombre}
            onCambio={(valor) => {
              setNombre(valor);
              if (!slugTocado) setSlug(slugDesdeTexto(valor));
              if (nuevo && !tipoTocado) {
                const sugerido = tipoDesdeNombre(valor, tiposVisibles);
                if (tiposVisibles.some((t) => t.codigo === sugerido)) setTipo(sugerido);
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
          {nuevo ? (
            <CampoSelect
              id="producto-tipo"
              etiqueta="Tipo de prenda (fija el código del modelo)"
              valor={tipo}
              opciones={[
                ...(tipo === "" ? [{ valor: "", etiqueta: "Crea un tipo en Atributos" }] : []),
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
          <CampoSelect
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
          <CampoSelect
            id="producto-marca"
            etiqueta="Marca"
            valor={marcaId}
            opciones={[
              { valor: "", etiqueta: "Sin marca" },
              ...marcas.map((m) => ({ valor: m.id, etiqueta: m.nombre })),
            ]}
            onCambio={setMarcaId}
          />
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
              etiqueta="Precio anterior (oferta)"
              valor={precioLista}
              onCambio={setPrecioLista}
              placeholder="Opcional"
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
          <CampoSelect
            id="producto-insignia"
            etiqueta="Etiqueta sobre la foto (se crean en Atributos)"
            valor={etiqueta}
            opciones={[
              { valor: "", etiqueta: "Sin etiqueta" },
              // La que ya tenia sigue a la vista aunque se haya ocultado en Atributos.
              ...(inicial.etiqueta !== "" && !etiquetas.includes(inicial.etiqueta)
                ? [{ valor: inicial.etiqueta, etiqueta: `${inicial.etiqueta} (oculta)` }]
                : []),
              ...etiquetas.map((e) => ({ valor: e, etiqueta: e })),
            ]}
            onCambio={setEtiqueta}
          />
          <Casilla
            id="producto-envio-gratis"
            etiqueta="Envío gratis (muestra la etiqueta sobre la foto)"
            marcada={envioGratis}
            onCambio={setEnvioGratis}
          />
          <Casilla
            id="producto-destacado"
            etiqueta="Destacado en la portada"
            marcada={destacado}
            onCambio={setDestacado}
          />
          {nuevo ? (
            <Alerta tono="info">
              El producto se crea oculto. Después agrégale fotos y variantes con stock para
              mostrarlo en la tienda.
            </Alerta>
          ) : (
            <Casilla
              id="producto-activo"
              etiqueta="Visible en la tienda"
              marcada={activo}
              onCambio={setActivo}
            />
          )}
          <Boton tipo="submit" disabled={guardando}>
            {guardando ? "Guardando…" : nuevo ? "Crear producto" : "Guardar cambios"}
          </Boton>
        </Formulario>
      </Tarjeta>
    </>
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
  /** Precio de venta del producto: con el costo de cada variante da el margen. */
  precio: number;
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

/** "Costo actual S/ 8.00 · margen S/ 17.00 (68 %)", o como registrarlo. */
function textoDeCosto(precio: number, costo: number | null): string {
  const margen = margenDe(precio, costo);
  if (costo === null || margen === null) return "Sin costo: escríbelo aquí o registra una compra.";
  return `Costo actual ${MONEDA.format(costo)} · margen ${MONEDA.format(margen.monto)} (${margen.porcentaje} %)`;
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
  precio,
  avisoInicial,
}: PropsVariantesProducto) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [tallas, setTallas] = useState<string[]>([]);
  const [otrasTallas, setOtrasTallas] = useState("");
  const [colores, setColores] = useState<string[]>([]);
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

  const trabajando =
    agregar.isPending || cambiarActivo.isPending || fijarCosto.isPending || altaRapida.isPending;

  return (
    <Tarjeta titulo="Tallas y colores">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      {variantes.length === 0 ? (
        <p>Todavía no tiene tallas. Agrega al menos una para poder venderlo.</p>
      ) : (
        <div>
          {variantes.map((v) => (
            <FilaMovimiento
              key={v.id}
              logo={<LogoIcono icono={<IconoCatalogo tamano={16} />} nombre="Variante" />}
              titulo={`Talla ${v.talla} · ${v.color} · ${v.diseno}`}
              detalle={`SKU ${v.sku}`}
              subtitulo={textoDeCosto(precio, v.costo)}
              estado={
                !v.activo
                  ? { texto: "Oculta", tono: "alerta" }
                  : v.stock === 0
                    ? { texto: "Sin stock", tono: "error" }
                    : { texto: "A la venta", tono: "exito" }
              }
              valor={`${v.stock} u.`}
              accion={
                <>
                  <CostoDeVariante
                    id={v.id}
                    costo={v.costo}
                    deshabilitado={trabajando}
                    onGuardar={(costo) => fijarCosto.mutate({ varianteId: v.id, costo })}
                  />
                  <Boton
                    variante="secundario"
                    disabled={trabajando}
                    onClick={() => cambiarActivo.mutate({ varianteId: v.id, activo: !v.activo })}
                  >
                    {v.activo ? "Ocultar" : "Mostrar"}
                  </Boton>
                </>
              }
            />
          ))}
        </div>
      )}

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
        <SelectorMultiple
          etiqueta="Colores"
          opciones={coloresDisponibles.map((c) => ({
            valor: c.nombre,
            etiqueta: c.nombre,
            muestra: c.hex,
          }))}
          valores={colores}
          onCambio={setColores}
          disabled={trabajando}
        />
        <FilaUnida iguales>
          <CampoSelect
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
        <CampoSelect
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
  );
}
