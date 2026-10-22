"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { margenDe, MAX_IMAGENES_POR_PRODUCTO, slugDesdeTexto, TIPOS_IMAGEN } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  CampoTexto,
  Cargando,
  Casilla,
  FilaLista,
  FilaUnida,
  Formulario,
  GaleriaEditable,
  Insignia,
  Tarjeta,
} from "@appweb/ui";

import { type ProductoTocado, revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
import { MONEDA, mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";
import { URL_TIENDA } from "@appweb/api/urls";

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
      ← Volver a productos
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
        categorias={opciones.data.categorias}
        marcas={opciones.data.marcas}
        volver={volver}
        onCreado={onCreado}
      />
      {productoId !== null && detalle.data ? (
        <FotosProducto productoId={productoId} imagenes={detalle.data.imagenes} />
      ) : null}
      {productoId !== null && detalle.data ? (
        <VariantesProducto
          productoId={productoId}
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

// ── Fotos ───────────────────────────────────────────────────────────────────

/** En local las fotos quedan en la tienda ("/subidas/..."): el panel les antepone su dominio. */
function urlVisible(url: string): string {
  return url.startsWith("/") ? `${URL_TIENDA}${url}` : url;
}

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
  categorias: { id: string; nombre: string; activo: boolean }[];
  marcas: { id: string; nombre: string; activo: boolean }[];
  volver: React.ReactNode;
  onCreado: (id: string) => void;
}

function FormularioProducto({
  productoId,
  inicial,
  categorias,
  marcas,
  volver,
  onCreado,
}: PropsFormularioProducto) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const nuevo = productoId === null;

  const [nombre, setNombre] = useState(inicial.nombre);
  const [slug, setSlug] = useState(inicial.slug);
  // En un producto nuevo el slug sigue al nombre hasta que alguien lo toca.
  const [slugTocado, setSlugTocado] = useState(!nuevo);
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
    <Tarjeta titulo={nuevo ? "Nuevo producto" : inicial.nombre} acciones={volver}>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <Formulario
        ancho="completo"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (nuevo) crear.mutate(datos());
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
        <Campo
          id="producto-insignia"
          etiqueta="Insignia sobre la foto (opcional)"
          valor={etiqueta}
          onCambio={setEtiqueta}
          placeholder="Nuevo, Más vendido…"
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
        <Casilla
          id="producto-activo"
          etiqueta="Visible en la tienda"
          marcada={activo}
          onCambio={setActivo}
        />
        <Alerta tono="info">
          Por ahora el producto usa la foto de demostración. La subida de fotos llega en una fase
          posterior.
        </Alerta>
        <Boton tipo="submit" disabled={guardando}>
          {guardando ? "Guardando…" : nuevo ? "Crear producto" : "Guardar cambios"}
        </Boton>
        {!nuevo && inicial.activo ? (
          <Boton variante="secundario" href={`${URL_TIENDA}/productos/${inicial.slug}`}>
            Ver en la tienda
          </Boton>
        ) : null}
      </Formulario>
    </Tarjeta>
  );
}

// ── Variantes ───────────────────────────────────────────────────────────────

interface PropsVariantesProducto {
  productoId: string;
  avisoInicial: string | null;
  /** Precio de venta del producto: con el costo de cada variante da el margen. */
  precio: number;
  variantes: {
    id: string;
    talla: string;
    color: string;
    sku: string;
    stock: number;
    /** Costo de la ultima compra. Se registra en Proveedores, no aqui. */
    costo: number | null;
    activo: boolean;
  }[];
}

/** "Costo actual S/ 8.00 · margen S/ 17.00 (68 %)", o como registrarlo. */
function textoDeCosto(precio: number, costo: number | null): string {
  const margen = margenDe(precio, costo);
  if (costo === null || margen === null) return "Sin costo: se registra al ingresar una compra.";
  return `Costo actual ${MONEDA.format(costo)} · margen ${MONEDA.format(margen.monto)} (${margen.porcentaje} %)`;
}

/**
 * Tallas y colores. El stock no se edita aqui: el inicial entra como ingreso
 * y despues todo pasa por la seccion Stock, que deja el movimiento escrito.
 */
function VariantesProducto({
  productoId,
  variantes,
  precio,
  avisoInicial,
}: PropsVariantesProducto) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [stockInicial, setStockInicial] = useState("0");
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
    trpc.panel.productos.agregarVariante.mutationOptions({
      onSuccess: async (r, v) => {
        setTalla("");
        setColor("");
        setStockInicial("0");
        await alTerminar(`Talla ${v.talla} en ${v.color} agregada.`, r.revalidar);
      },
      onError: alFallar,
    }),
  );

  const cambiarActivo = useMutation(
    trpc.panel.productos.cambiarActivoVariante.mutationOptions({
      onSuccess: (r, v) =>
        alTerminar(v.activo ? "Variante visible otra vez." : "Variante oculta.", r.revalidar),
      onError: alFallar,
    }),
  );

  const trabajando = agregar.isPending || cambiarActivo.isPending;

  return (
    <Tarjeta titulo="Tallas y colores">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      {variantes.length === 0 ? (
        <p>Todavía no tiene tallas. Agrega al menos una para poder venderlo.</p>
      ) : (
        variantes.map((v) => (
          <FilaLista
            key={v.id}
            acciones={
              <Boton
                variante="secundario"
                disabled={trabajando}
                onClick={() => cambiarActivo.mutate({ varianteId: v.id, activo: !v.activo })}
              >
                {v.activo ? "Ocultar" : "Mostrar"}
              </Boton>
            }
          >
            <strong>
              Talla {v.talla} · {v.color}
            </strong>
            <span>SKU {v.sku}</span>
            <span>{textoDeCosto(precio, v.costo)}</span>
            <span>
              <Insignia tono={v.stock === 0 ? "error" : "neutro"}>{v.stock} en stock</Insignia>
              {!v.activo ? (
                <>
                  {" "}
                  <Insignia tono="alerta">Oculta</Insignia>
                </>
              ) : null}
            </span>
          </FilaLista>
        ))
      )}

      <Formulario
        ancho="completo"
        onSubmit={(evento) => {
          evento.preventDefault();
          agregar.mutate({
            productoId,
            talla,
            color,
            stockInicial: numeroDesdeTexto(stockInicial),
          });
        }}
      >
        <FilaUnida iguales>
          <Campo
            id="variante-talla"
            etiqueta="Talla"
            valor={talla}
            onCambio={setTalla}
            placeholder="M, 6M, Única…"
            requerido
          />
          <Campo
            id="variante-color"
            etiqueta="Color"
            valor={color}
            onCambio={setColor}
            placeholder="Negro"
            requerido
          />
        </FilaUnida>
        <Campo
          id="variante-stock"
          etiqueta="Stock inicial (entra como ingreso)"
          valor={stockInicial}
          onCambio={setStockInicial}
        />
        <Boton tipo="submit" variante="secundario" disabled={trabajando}>
          {agregar.isPending ? "Agregando…" : "+ Agregar talla y color"}
        </Boton>
      </Formulario>
    </Tarjeta>
  );
}
