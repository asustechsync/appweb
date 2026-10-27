"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { totalDeCompra } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoTexto,
  Cargando,
  Casilla,
  CuadroBento,
  CuadroMonto,
  EstadoVacio,
  FilaLista,
  FilaMovimiento,
  FilaPedido,
  FilaUnida,
  Formulario,
  IconoBuscar,
  IconoMensaje,
  IconoProveedor,
  IconoTelefono,
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
  type AccionBento,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useEscritorio } from "@/lib/use-escritorio";
import { usePaginado } from "@/lib/use-paginado";
import { useTRPC } from "@/lib/trpc";
import {
  FECHA,
  MONEDA,
  cuandoFue,
  diaYHora,
  mensajeDeFallo,
  numeroDesdeTexto,
} from "@appweb/core/formato";

interface ProveedorDelPanel {
  id: string;
  nombre: string;
  ruc: string;
  contacto: string;
  telefono: string;
  email: string;
  nota: string;
  activo: boolean;
  compras: number;
  comprado: number;
  ultimaCompra: string | null;
}

/**
 * Proveedores y sus compras. Registrar una compra sube el stock (un INGRESO
 * por linea) y deja el costo de cada prenda, que es de donde sale el margen.
 */
export function Proveedores() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.proveedores.listar.queryOptions());
  const [editando, setEditando] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data ?? []).filter(
      (p) =>
        termino === "" ||
        p.nombre.toLowerCase().includes(termino) ||
        p.ruc.includes(termino) ||
        p.contacto.toLowerCase().includes(termino),
    );
  }, [busqueda, lista.data]);
  const { pagina, paginas, setPagina, visibles } = usePaginado(coinciden, PAGINA);

  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((p) => p.id === elegido) ?? visibles[0] ?? null;

  if (lista.isPending) return <Cargando texto="Cargando proveedores…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  const proveedor = lista.data.find((p) => p.id === abierto);
  if (proveedor)
    return <DetalleProveedor proveedor={proveedor} onVolver={() => setAbierto(null)} />;

  if (editando !== null) {
    const elegidoParaEditar = lista.data.find((p) => p.id === editando) ?? null;
    return (
      <Tarjeta
        titulo={elegidoParaEditar ? `Editar ${elegidoParaEditar.nombre}` : "Nuevo proveedor"}
        acciones={
          <Boton variante="secundario" onClick={() => setEditando(null)}>
            ← Volver a proveedores
          </Boton>
        }
      >
        <FormularioProveedor proveedor={elegidoParaEditar} onListo={() => setEditando(null)} />
      </Tarjeta>
    );
  }

  const proveedores = lista.data;
  const activos = proveedores.filter((p) => p.activo).length;
  const comprado = proveedores.reduce((suma, p) => suma + p.comprado, 0);
  const compras = proveedores.reduce((suma, p) => suma + p.compras, 0);
  const ultima = proveedores
    .map((p) => p.ultimaCompra)
    .filter((f): f is string => f !== null)
    .sort()
    .at(-1);

  return (
    <>
      <Tarjeta
        titulo="Proveedores"
        sinMarco
        acciones={<Boton onClick={() => setEditando("nuevo")}>+ Nuevo proveedor</Boton>}
      >
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Activos"
            valor={String(activos)}
            contexto={`De ${proveedores.length} registrados`}
          />
          <TarjetaMetrica
            etiqueta="Comprado"
            valor={MONEDA.format(comprado)}
            contexto="En todas las compras"
          />
          <TarjetaMetrica
            etiqueta="Compras"
            valor={String(compras)}
            contexto={compras === 0 ? "Aún sin registrar" : "Cada una subió el stock"}
          />
          <TarjetaMetrica
            etiqueta="Última compra"
            valor={ultima ? FECHA.format(new Date(ultima)) : "—"}
            contexto={ultima ? cuandoFue(new Date(ultima)) : "Sin compras"}
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
                id="busqueda-proveedores"
                etiqueta="Buscar por nombre, RUC o contacto"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Nombre, RUC o contacto"
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
            {...(seleccionado ? {} : { vacio: "Elige un proveedor para ver su resumen." })}
          >
            {seleccionado ? (
              <CuadrosProveedor
                proveedor={seleccionado}
                acciones={[
                  { etiqueta: "Ver compras", onClick: () => setAbierto(seleccionado.id) },
                  { etiqueta: "Editar", onClick: () => setEditando(seleccionado.id) },
                ]}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin proveedores"
              texto={
                proveedores.length === 0
                  ? "Agrega el primero para registrar compras."
                  : "Ningún proveedor coincide con esa búsqueda."
              }
            />
          ) : (
            <div>
              {visibles.map((p) => (
                <FilaPedido
                  key={p.id}
                  logo={<LogoIcono icono={<IconoProveedor tamano={16} />} nombre={p.nombre} />}
                  titulo={p.nombre}
                  {...(p.contacto ? { detalle: p.contacto } : {})}
                  contenido={
                    [p.ruc && `RUC ${p.ruc}`, p.telefono].filter(Boolean).join(" · ") ||
                    "Sin datos de contacto"
                  }
                  centro={[
                    MONEDA.format(p.comprado),
                    `${p.compras} ${p.compras === 1 ? "compra" : "compras"}`,
                  ]}
                  estado={estadoDeProveedor(p)}
                  {...(p.ultimaCompra
                    ? { nota: `Última ${FECHA.format(new Date(p.ultimaCompra))}` }
                    : {})}
                  seleccionada={escritorio && seleccionado?.id === p.id}
                  onAbrir={() => (escritorio ? setElegido(p.id) : setAbierto(p.id))}
                  etiquetaAbrir={`${escritorio ? "Elegir" : "Ver compras de"} ${p.nombre}`}
                />
              ))}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}

/** Cuantos proveedores se ven por pagina. */
const PAGINA = 10;

function estadoDeProveedor(p: { activo: boolean }): { texto: string; tono: "exito" | "alerta" } {
  return p.activo ? { texto: "Activo", tono: "exito" } : { texto: "Desactivado", tono: "alerta" };
}

/** El proveedor en cuadros: lo comprado, el contacto y la nota. Vista previa y cabecera. */
function CuadrosProveedor({
  proveedor: p,
  acciones,
}: {
  proveedor: ProveedorDelPanel;
  acciones: AccionBento[];
}) {
  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoIcono icono={<IconoProveedor tamano={16} />} nombre={p.nombre} />}
        estado={estadoDeProveedor(p)}
        etiqueta={p.nombre}
        monto={MONEDA.format(p.comprado)}
        detalle={`${p.compras} ${p.compras === 1 ? "compra" : "compras"}${
          p.ultimaCompra ? ` · última ${cuandoFue(new Date(p.ultimaCompra))}` : ""
        }`}
        acciones={acciones}
      />
      <CuadroBento
        icono={<IconoTelefono tamano={16} />}
        titulo="Contacto"
        ancho="ancho"
        vacio={!p.contacto && !p.telefono && !p.email}
        {...(p.email ? { detalle: p.email } : {})}
        {...(p.ruc ? { cifras: [{ valor: p.ruc, etiqueta: "RUC" }] } : {})}
      >
        {[p.contacto, p.telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"}
      </CuadroBento>
      {p.nota ? (
        <CuadroBento icono={<IconoMensaje tamano={16} />} titulo="Nota" ancho="ancho">
          {p.nota}
        </CuadroBento>
      ) : null}
    </RejillaBento>
  );
}

function FormularioProveedor({
  proveedor,
  onListo,
}: {
  proveedor: ProveedorDelPanel | null;
  onListo: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(proveedor?.nombre ?? "");
  const [ruc, setRuc] = useState(proveedor?.ruc ?? "");
  const [contacto, setContacto] = useState(proveedor?.contacto ?? "");
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "");
  const [email, setEmail] = useState(proveedor?.email ?? "");
  const [nota, setNota] = useState(proveedor?.nota ?? "");
  const [activo, setActivo] = useState(proveedor?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.proveedores.guardar.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.panel.proveedores.pathFilter());
        onListo();
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
          ...(proveedor ? { proveedorId: proveedor.id } : {}),
          nombre,
          ruc,
          contacto,
          telefono,
          email,
          nota,
          activo,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <FilaUnida iguales>
        <Campo
          id="proveedor-nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={setNombre}
          requerido
        />
        <Campo id="proveedor-ruc" etiqueta="RUC (opcional)" valor={ruc} onCambio={setRuc} />
      </FilaUnida>
      <FilaUnida iguales>
        <Campo
          id="proveedor-contacto"
          etiqueta="Persona de contacto (opcional)"
          valor={contacto}
          onCambio={setContacto}
        />
        <Campo
          id="proveedor-telefono"
          etiqueta="Teléfono (opcional)"
          tipo="tel"
          valor={telefono}
          onCambio={setTelefono}
        />
      </FilaUnida>
      <Campo
        id="proveedor-email"
        etiqueta="Correo (opcional)"
        tipo="email"
        valor={email}
        onCambio={setEmail}
      />
      <CampoTexto
        id="proveedor-nota"
        etiqueta="Nota (opcional)"
        valor={nota}
        onCambio={setNota}
        filas={2}
      />
      <Casilla
        id="proveedor-activo"
        etiqueta="Activo: se le pueden registrar compras"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar proveedor"}
      </Boton>
      <Boton variante="secundario" onClick={onListo}>
        Cancelar
      </Boton>
    </Formulario>
  );
}

// ── Compras ─────────────────────────────────────────────────────────────────

function DetalleProveedor({
  proveedor,
  onVolver,
}: {
  proveedor: ProveedorDelPanel;
  onVolver: () => void;
}) {
  const trpc = useTRPC();
  const compras = useQuery(
    trpc.panel.proveedores.compras.queryOptions({ proveedorId: proveedor.id }),
  );
  const [nueva, setNueva] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <CuadrosProveedor
        proveedor={proveedor}
        acciones={[
          { etiqueta: "← Volver a proveedores", onClick: onVolver },
          ...(proveedor.activo && !nueva
            ? [{ etiqueta: "+ Registrar compra", onClick: () => setNueva(true) }]
            : []),
        ]}
      />

      {!proveedor.activo ? (
        <Alerta tono="info">
          Este proveedor está desactivado: actívalo para registrarle compras.
        </Alerta>
      ) : nueva ? (
        <NuevaCompra
          proveedorId={proveedor.id}
          onListo={(mensaje) => {
            setNueva(false);
            if (mensaje) setAviso(mensaje);
          }}
        />
      ) : null}

      <Tarjeta titulo="Historial de compras">
        {compras.isPending ? (
          <Cargando texto="Cargando compras…" />
        ) : compras.isError ? (
          <Alerta tono="error">{compras.error.message}</Alerta>
        ) : compras.data.length === 0 ? (
          <EstadoVacio titulo="Sin compras" texto="Todavía no se registró ninguna." />
        ) : (
          <div>
            {compras.data.map((c) => {
              const { dia, hora } = diaYHora(new Date(c.creadoEn));
              const unidades = c.items.reduce((suma, i) => suma + i.cantidad, 0);
              return (
                <FilaMovimiento
                  key={c.id}
                  logo={<LogoIcono icono={<IconoProveedor tamano={16} />} nombre="Compra" />}
                  titulo={c.documento || "Compra"}
                  detalle={c.usuario}
                  subtitulo={
                    c.items
                      .map((i) => `${i.cantidad} × ${i.producto} (${i.color}, ${i.talla})`)
                      .join(" · ") + (c.nota ? ` — ${c.nota}` : "")
                  }
                  estado={{ texto: `${unidades} u.`, tono: "exito" }}
                  valor={MONEDA.format(c.total)}
                  centro={[dia, hora]}
                />
              );
            })}
          </div>
        )}
      </Tarjeta>
    </>
  );
}

interface LineaBorrador {
  clave: number;
  varianteId: string;
  cantidad: string;
  costo: string;
}

function NuevaCompra({
  proveedorId,
  onListo,
}: {
  proveedorId: string;
  onListo: (mensaje?: string) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const variantes = useQuery(trpc.panel.proveedores.variantes.queryOptions());
  const [documento, setDocumento] = useState("");
  const [nota, setNota] = useState("");
  const [lineas, setLineas] = useState<LineaBorrador[]>([
    { clave: 0, varianteId: "", cantidad: "", costo: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const registrar = useMutation(
    trpc.panel.proveedores.registrarCompra.mutationOptions({
      onSuccess: async (r) => {
        void queryClient.invalidateQueries(trpc.panel.proveedores.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.packs.pathFilter());
        const alDia = await revalidarTienda({ productos: r.productosTocados });
        onListo(
          "Compra registrada: el stock ya subió y el costo quedó guardado." +
            (alDia ? "" : " La tienda tardará unos minutos en mostrar el stock nuevo."),
        );
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  if (variantes.isPending) return <Cargando texto="Cargando prendas…" />;
  if (variantes.isError) return <Alerta tono="error">{variantes.error.message}</Alerta>;

  const opciones = variantes.data.map((v) => ({
    valor: v.id,
    etiqueta: `${v.etiqueta} · ${v.sku}`,
  }));
  const costoActual = (id: string) => variantes.data.find((v) => v.id === id)?.costo ?? null;
  const cambiar = (clave: number, cambio: Partial<LineaBorrador>) =>
    setLineas((previas) => previas.map((l) => (l.clave === clave ? { ...l, ...cambio } : l)));

  const validas = lineas
    .filter((l) => l.varianteId !== "")
    .map((l) => ({
      varianteId: l.varianteId,
      cantidad: Math.trunc(numeroDesdeTexto(l.cantidad)),
      costoUnitario: numeroDesdeTexto(l.costo),
    }));
  const completas = validas.every((l) => l.cantidad > 0 && l.costoUnitario >= 0);
  const total = completas ? totalDeCompra(validas) : null;

  return (
    <Tarjeta titulo="Registrar compra">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <Formulario
        ancho="completo"
        onSubmit={(evento) => {
          evento.preventDefault();
          registrar.mutate({ proveedorId, documento, nota, lineas: validas });
        }}
      >
        <p>
          Una línea por talla y color. Al registrar, el stock sube y el costo pasa a ser el costo
          actual de cada prenda. No se edita después: un error se corrige con un ajuste en
          Inventario.
        </p>
        {lineas.map((l) => {
          const anterior = costoActual(l.varianteId);
          return (
            <FilaLista
              key={l.clave}
              acciones={
                lineas.length > 1 ? (
                  <Boton
                    variante="secundario"
                    onClick={() => setLineas((p) => p.filter((x) => x.clave !== l.clave))}
                  >
                    Quitar
                  </Boton>
                ) : null
              }
            >
              <SelectorBuscable
                id={`compra-variante-${l.clave}`}
                etiqueta="Prenda"
                valor={l.varianteId}
                opciones={opciones}
                onCambio={(varianteId) => {
                  const previo = costoActual(varianteId);
                  cambiar(l.clave, {
                    varianteId,
                    ...(l.costo === "" && previo !== null ? { costo: String(previo) } : {}),
                  });
                }}
                placeholder="Busca por producto, color, talla o SKU"
              />
              <FilaUnida iguales>
                <Campo
                  id={`compra-cantidad-${l.clave}`}
                  etiqueta="Unidades"
                  valor={l.cantidad}
                  onCambio={(cantidad) => cambiar(l.clave, { cantidad })}
                  requerido
                />
                <Campo
                  id={`compra-costo-${l.clave}`}
                  etiqueta="Costo unitario (S/)"
                  valor={l.costo}
                  onCambio={(costo) => cambiar(l.clave, { costo })}
                  requerido
                />
              </FilaUnida>
              {anterior !== null ? <span>Costo anterior: {MONEDA.format(anterior)}</span> : null}
            </FilaLista>
          );
        })}
        <Boton
          variante="secundario"
          onClick={() =>
            setLineas((p) => [
              ...p,
              {
                clave: Math.max(...p.map((x) => x.clave)) + 1,
                varianteId: "",
                cantidad: "",
                costo: "",
              },
            ])
          }
        >
          + Otra prenda
        </Boton>
        <FilaUnida iguales>
          <Campo
            id="compra-documento"
            etiqueta="Factura o guía (opcional)"
            valor={documento}
            onCambio={setDocumento}
            placeholder="F001-000123"
          />
          <Campo id="compra-nota" etiqueta="Nota (opcional)" valor={nota} onCambio={setNota} />
        </FilaUnida>
        <p>
          Total de la compra: <strong>{total === null ? "—" : MONEDA.format(total)}</strong>
        </p>
        <Boton tipo="submit" disabled={registrar.isPending || validas.length === 0 || !completas}>
          {registrar.isPending ? "Registrando…" : "Registrar compra"}
        </Boton>
        <Boton variante="secundario" onClick={() => onListo()}>
          Cancelar
        </Boton>
      </Formulario>
    </Tarjeta>
  );
}
