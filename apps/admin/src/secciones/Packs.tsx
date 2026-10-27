"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ahorroDePack, slugDesdeTexto } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoTexto,
  Cargando,
  Casilla,
  CuadroDesglose,
  CuadroMonto,
  EstadoVacio,
  FilaLista,
  FilaPedido,
  FilaUnida,
  Formulario,
  IconoBuscar,
  IconoMoneda,
  IconoPack,
  LimpiarFiltros,
  ListaConLateral,
  LogoIcono,
  Paginador,
  RejillaBento,
  RejillaMetricas,
  SelectorBuscable,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { useEscritorio } from "@/lib/use-escritorio";
import { usePaginado } from "@/lib/use-paginado";
import { useTRPC } from "@/lib/trpc";
import { MONEDA, mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";

interface PackDelPanel {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  componentes: { varianteId: string; cantidad: number }[];
}

/**
 * Packs y combos: varias prendas a un precio propio. El stock no se carga:
 * alcanza para tantos packs como permita la prenda mas escasa, y al venderse
 * se descuenta de cada una. El margen sale del costo de sus prendas.
 */
export function Packs() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.packs.listar.queryOptions());
  const [editando, setEditando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data ?? []).filter(
      (p) => termino === "" || p.nombre.toLowerCase().includes(termino) || p.slug.includes(termino),
    );
  }, [busqueda, lista.data]);
  const { pagina, paginas, setPagina, visibles } = usePaginado(coinciden, PAGINA);

  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((p) => p.id === elegido) ?? visibles[0] ?? null;

  if (lista.isPending) return <Cargando texto="Cargando packs…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  if (editando !== null) {
    const pack = lista.data.find((p) => p.id === editando) ?? null;
    return (
      <Tarjeta
        titulo={pack ? `Editar ${pack.nombre}` : "Nuevo pack"}
        acciones={
          <Boton variante="secundario" onClick={() => setEditando(null)}>
            ← Volver a packs
          </Boton>
        }
      >
        <p>
          Prendas que se venden juntas a un precio especial, por ejemplo 3 boxers talla M. El stock
          sale solo de sus prendas.
        </p>
        <FormularioPack pack={pack} onListo={() => setEditando(null)} />
      </Tarjeta>
    );
  }

  const packs = lista.data;
  const activos = packs.filter((p) => p.activo);
  const agotados = activos.filter((p) => p.stock === 0).length;
  const conMargen = packs.filter((p) => p.margen !== null);
  const margenMedio =
    conMargen.length === 0
      ? null
      : conMargen.reduce((suma, p) => suma + (p.margen?.porcentaje ?? 0), 0) / conMargen.length;
  const ahorroMedio =
    packs.length === 0 ? 0 : packs.reduce((suma, p) => suma + p.ahorro, 0) / packs.length;

  return (
    <>
      <Tarjeta
        titulo="Packs y combos"
        sinMarco
        acciones={<Boton onClick={() => setEditando("nuevo")}>+ Nuevo pack</Boton>}
      >
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Activos"
            valor={String(activos.length)}
            contexto={`De ${packs.length} armados`}
          />
          <TarjetaMetrica
            etiqueta="Sin stock"
            valor={String(agotados)}
            contexto={agotados === 0 ? "Todos alcanzan" : "Falta alguna prenda"}
          />
          <TarjetaMetrica
            etiqueta="Ahorro medio"
            valor={MONEDA.format(ahorroMedio)}
            contexto="Frente a comprar suelto"
          />
          <TarjetaMetrica
            etiqueta="Margen medio"
            valor={margenMedio === null ? "—" : `${Math.round(margenMedio)} %`}
            contexto={
              conMargen.length === packs.length
                ? "Con el costo de sus prendas"
                : `${packs.length - conMargen.length} sin costo registrado`
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
                id="busqueda-packs"
                etiqueta="Buscar pack"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Nombre del pack"
              />
            }
          >
            <Paginador pagina={pagina} paginas={paginas} onCambio={setPagina} />
            {busqueda !== "" ? (
              <LimpiarFiltros
                onClick={() => {
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
            {...(seleccionado ? {} : { vacio: "Elige un pack para ver de qué está hecho." })}
          >
            {seleccionado ? (
              <RejillaBento>
                <CuadroMonto
                  logo={<LogoIcono icono={<IconoPack tamano={16} />} nombre="Pack" />}
                  estado={estadoDePack(seleccionado)}
                  etiqueta={seleccionado.nombre}
                  monto={MONEDA.format(seleccionado.precio)}
                  detalle={`Alcanza para ${seleccionado.stock} ${seleccionado.stock === 1 ? "pack" : "packs"}`}
                  acciones={[
                    { etiqueta: "Editar pack", onClick: () => setEditando(seleccionado.id) },
                  ]}
                />
                <CuadroDesglose
                  icono={<IconoPack tamano={16} />}
                  titulo="Prendas"
                  ancho="ancho"
                  lineas={seleccionado.componentes.map((c) => ({
                    etiqueta: `${c.cantidad} × ${c.etiqueta}`,
                    valor: `${c.stock} en stock`,
                  }))}
                />
                <CuadroDesglose
                  icono={<IconoMoneda tamano={16} />}
                  titulo="Precio"
                  ancho="ancho"
                  lineas={[
                    { etiqueta: "Por separado", valor: MONEDA.format(seleccionado.precioSuelto) },
                    {
                      etiqueta: "Ahorro del cliente",
                      valor: `− ${MONEDA.format(seleccionado.ahorro)}`,
                      rebaja: true,
                    },
                  ]}
                  total={{
                    etiqueta: "Margen",
                    valor: seleccionado.margen
                      ? `${MONEDA.format(seleccionado.margen.monto)} · ${seleccionado.margen.porcentaje} %`
                      : "Sin costo",
                  }}
                />
              </RejillaBento>
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin packs"
              texto={
                packs.length === 0
                  ? "Arma el primero con prendas del catálogo."
                  : "Ningún pack coincide con esa búsqueda."
              }
            />
          ) : (
            <div>
              {visibles.map((p) => {
                const prendas = p.componentes.reduce((suma, c) => suma + c.cantidad, 0);
                return (
                  <FilaPedido
                    key={p.id}
                    logo={<LogoIcono icono={<IconoPack tamano={16} />} nombre="Pack" />}
                    titulo={p.nombre}
                    contenido={`${prendas} ${prendas === 1 ? "prenda" : "prendas"} · ahorra ${MONEDA.format(p.ahorro)}`}
                    centro={[MONEDA.format(p.precio), `Suelto ${MONEDA.format(p.precioSuelto)}`]}
                    estado={estadoDePack(p)}
                    nota={`Alcanza para ${p.stock}`}
                    seleccionada={escritorio && seleccionado?.id === p.id}
                    onAbrir={() => (escritorio ? setElegido(p.id) : setEditando(p.id))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Editar"} ${p.nombre}`}
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

/** Oculto manda; si no alcanza ni para uno, sin stock. */
function estadoDePack(p: { activo: boolean; stock: number }): {
  texto: string;
  tono: "exito" | "alerta" | "error";
} {
  if (!p.activo) return { texto: "Oculto", tono: "alerta" };
  if (p.stock === 0) return { texto: "Sin stock", tono: "error" };
  return { texto: "Activo", tono: "exito" };
}

/** Cuantos packs se ven por pagina. */
const PAGINA = 10;

interface ComponenteBorrador {
  clave: number;
  varianteId: string;
  cantidad: string;
}

function FormularioPack({ pack, onListo }: { pack: PackDelPanel | null; onListo: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const variantes = useQuery(trpc.panel.proveedores.variantes.queryOptions());
  const [nombre, setNombre] = useState(pack?.nombre ?? "");
  const [slug, setSlug] = useState(pack?.slug ?? "");
  const [descripcion, setDescripcion] = useState(pack?.descripcion ?? "");
  const [precio, setPrecio] = useState(pack ? String(pack.precio) : "");
  const [activo, setActivo] = useState(pack?.activo ?? true);
  const [componentes, setComponentes] = useState<ComponenteBorrador[]>(
    pack && pack.componentes.length > 0
      ? pack.componentes.map((c, i) => ({
          clave: i,
          varianteId: c.varianteId,
          cantidad: String(c.cantidad),
        }))
      : [{ clave: 0, varianteId: "", cantidad: "1" }],
  );
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.packs.guardar.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.panel.packs.pathFilter());
        onListo();
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  if (variantes.isPending) return <Cargando texto="Cargando prendas…" />;
  if (variantes.isError) return <Alerta tono="error">{variantes.error.message}</Alerta>;

  const porId = new Map(variantes.data.map((v) => [v.id, v]));
  const opciones = variantes.data
    .filter((v) => v.activa || componentes.some((c) => c.varianteId === v.id))
    .map((v) => ({ valor: v.id, etiqueta: `${v.etiqueta} · ${MONEDA.format(v.precio)}` }));
  const cambiar = (clave: number, cambio: Partial<ComponenteBorrador>) =>
    setComponentes((p) => p.map((c) => (c.clave === clave ? { ...c, ...cambio } : c)));

  const elegidos = componentes
    .filter((c) => c.varianteId !== "")
    .map((c) => ({ varianteId: c.varianteId, cantidad: Math.trunc(numeroDesdeTexto(c.cantidad)) }));
  const suelto = elegidos.reduce(
    (suma, c) => suma + (porId.get(c.varianteId)?.precio ?? 0) * (c.cantidad || 0),
    0,
  );
  const monto = numeroDesdeTexto(precio);

  return (
    <Formulario
      ancho="completo"
      onSubmit={(evento) => {
        evento.preventDefault();
        guardar.mutate({
          ...(pack ? { packId: pack.id } : {}),
          nombre,
          slug,
          descripcion,
          precio: Number.isNaN(monto) ? 0 : monto,
          activo,
          componentes: elegidos,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <FilaUnida iguales>
        <Campo
          id="pack-nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={(valor) => {
            if (slug === "" || slug === slugDesdeTexto(nombre)) setSlug(slugDesdeTexto(valor));
            setNombre(valor);
          }}
          placeholder="Pack 3 boxers talla M"
          requerido
        />
        <Campo id="pack-slug" etiqueta="Dirección web" valor={slug} onCambio={setSlug} requerido />
      </FilaUnida>
      <CampoTexto
        id="pack-descripcion"
        etiqueta="Descripción (opcional)"
        valor={descripcion}
        onCambio={setDescripcion}
        filas={2}
      />

      {componentes.map((c) => (
        <FilaLista
          key={c.clave}
          acciones={
            componentes.length > 1 ? (
              <Boton
                variante="secundario"
                onClick={() => setComponentes((p) => p.filter((x) => x.clave !== c.clave))}
              >
                Quitar
              </Boton>
            ) : null
          }
        >
          <FilaUnida>
            <Campo
              id={`pack-cantidad-${c.clave}`}
              etiqueta="Unidades"
              valor={c.cantidad}
              onCambio={(cantidad) => cambiar(c.clave, { cantidad })}
              requerido
            />
            <SelectorBuscable
              id={`pack-variante-${c.clave}`}
              etiqueta="Prenda"
              valor={c.varianteId}
              opciones={opciones}
              onCambio={(varianteId) => cambiar(c.clave, { varianteId })}
              placeholder="Busca por producto, color o talla"
            />
          </FilaUnida>
        </FilaLista>
      ))}
      <Boton
        variante="secundario"
        onClick={() =>
          setComponentes((p) => [
            ...p,
            { clave: Math.max(...p.map((x) => x.clave)) + 1, varianteId: "", cantidad: "1" },
          ])
        }
      >
        + Otra prenda
      </Boton>

      <Campo
        id="pack-precio"
        etiqueta="Precio del pack (S/)"
        valor={precio}
        onCambio={setPrecio}
        requerido
      />
      <p>
        Por separado cuesta {MONEDA.format(suelto)}
        {!Number.isNaN(monto) && monto > 0
          ? `: el cliente ahorra ${MONEDA.format(ahorroDePack(monto, suelto))}.`
          : "."}
      </p>
      <Casilla id="pack-activo" etiqueta="Activo" marcada={activo} onCambio={setActivo} />
      <Boton tipo="submit" disabled={guardar.isPending || elegidos.length === 0}>
        {guardar.isPending ? "Guardando…" : "Guardar pack"}
      </Boton>
      <Boton variante="secundario" onClick={onListo}>
        Cancelar
      </Boton>
    </Formulario>
  );
}
