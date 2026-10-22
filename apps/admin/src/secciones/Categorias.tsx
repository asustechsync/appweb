"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { slugDesdeTexto } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  CampoTexto,
  Cargando,
  Casilla,
  EstadoVacio,
  FilaLista,
  FilaUnida,
  Formulario,
  Insignia,
  Tarjeta,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
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

/** Insignias de estado: oculta, destacada, cuantos productos tiene. */
function Estado({ ficha }: { ficha: Ficha }) {
  return (
    <span>
      <Insignia tono={ficha.activo ? "exito" : "alerta"}>
        {ficha.activo ? "Visible" : "Oculta"}
      </Insignia>{" "}
      {ficha.destacado ? <Insignia tono="neutro">Destacada</Insignia> : null}{" "}
      <Insignia tono="neutro">
        {ficha.productos} {ficha.productos === 1 ? "producto" : "productos"}
      </Insignia>
    </span>
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
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (lista.isPending) return <Cargando texto="Cargando categorías…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  const todas = lista.data;
  const raices = todas.filter((c) => c.padreId === null);
  const hijasDe = (id: string) => todas.filter((c) => c.padreId === id);
  // Primer nivel y debajo sus hijas, en el orden del menu.
  const ordenadas = raices.flatMap((r) => [r, ...hijasDe(r.id)]);
  const huerfanas = todas.filter((c) => !ordenadas.includes(c));
  const filas = [...ordenadas, ...huerfanas];
  const nombreDe = (id: string | null) => todas.find((c) => c.id === id)?.nombre ?? null;

  function listo(mensaje?: string) {
    setEditando(null);
    if (mensaje) setAviso(mensaje);
  }

  return (
    <Tarjeta titulo="Categorías">
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <p>
        Lo que se ve en el menú de la tienda, en este orden. Una subcategoría cuelga de otra; las
        ocultas no se muestran.
      </p>
      {filas.length === 0 ? (
        <EstadoVacio titulo="Sin categorías" texto="Crea la primera para poder cargar productos." />
      ) : null}
      {filas.map((c) =>
        editando === c.id ? (
          <FormularioCategoria key={c.id} categoria={c} todas={todas} onListo={listo} />
        ) : (
          <FilaLista
            key={c.id}
            acciones={
              <Boton variante="secundario" onClick={() => setEditando(c.id)}>
                Editar
              </Boton>
            }
          >
            <strong>
              {c.padreId ? `${nombreDe(c.padreId)} › ` : ""}
              {c.nombre}
            </strong>
            <span>
              /categorias/{c.slug} · orden {c.orden}
              {c.hijas > 0 ? ` · ${c.hijas} subcategorías` : ""}
            </span>
            <Estado ficha={c} />
          </FilaLista>
        ),
      )}
      {editando === "nueva" ? (
        <FormularioCategoria categoria={null} todas={todas} onListo={listo} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nueva")}>
          + Nueva categoría
        </Boton>
      )}
    </Tarjeta>
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
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (lista.isPending) return <Cargando texto="Cargando marcas…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  function listo(mensaje?: string) {
    setEditando(null);
    if (mensaje) setAviso(mensaje);
  }

  return (
    <Tarjeta titulo="Marcas">
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <p>Las destacadas salen en la fila de marcas de la portada, en este orden.</p>
      {lista.data.length === 0 ? (
        <EstadoVacio titulo="Sin marcas" texto="Los productos pueden ir sin marca." />
      ) : null}
      {lista.data.map((m) =>
        editando === m.id ? (
          <FormularioMarca key={m.id} marca={m} onListo={listo} />
        ) : (
          <FilaLista
            key={m.id}
            acciones={
              <Boton variante="secundario" onClick={() => setEditando(m.id)}>
                Editar
              </Boton>
            }
          >
            <strong>{m.nombre}</strong>
            <span>
              /marcas/{m.slug} · orden {m.orden}
            </span>
            <Estado ficha={m} />
          </FilaLista>
        ),
      )}
      {editando === "nueva" ? (
        <FormularioMarca marca={null} onListo={listo} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nueva")}>
          + Nueva marca
        </Boton>
      )}
    </Tarjeta>
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
