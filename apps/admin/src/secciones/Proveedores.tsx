"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { totalDeCompra } from "@appweb/core";
import {
  Alerta,
  BloqueDetalle,
  Boton,
  Campo,
  CampoTexto,
  Cargando,
  Casilla,
  EstadoVacio,
  FilaDetalles,
  FilaLista,
  FilaUnida,
  Formulario,
  Insignia,
  SelectorBuscable,
  Tarjeta,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
import { FECHA, FECHA_HORA, MONEDA, mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";

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

  if (lista.isPending) return <Cargando texto="Cargando proveedores…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  const proveedor = lista.data.find((p) => p.id === abierto);
  if (proveedor)
    return <DetalleProveedor proveedor={proveedor} onVolver={() => setAbierto(null)} />;

  return (
    <Tarjeta titulo="Proveedores">
      <p>
        A quién le compras la mercadería. Abre uno para registrar una compra o ver su historial.
      </p>
      {lista.data.length === 0 ? (
        <EstadoVacio titulo="Sin proveedores" texto="Agrega el primero para registrar compras." />
      ) : null}
      {lista.data.map((p) =>
        editando === p.id ? (
          <FormularioProveedor key={p.id} proveedor={p} onListo={() => setEditando(null)} />
        ) : (
          <FilaLista
            key={p.id}
            acciones={
              <>
                <Boton onClick={() => setAbierto(p.id)}>Compras</Boton>{" "}
                <Boton variante="secundario" onClick={() => setEditando(p.id)}>
                  Editar
                </Boton>
              </>
            }
          >
            <strong>{p.nombre}</strong>
            <span>
              {[p.ruc && `RUC ${p.ruc}`, p.contacto, p.telefono].filter(Boolean).join(" · ") ||
                "Sin datos de contacto"}
            </span>
            <span>
              {p.compras} {p.compras === 1 ? "compra" : "compras"} · {MONEDA.format(p.comprado)}
              {p.ultimaCompra ? ` · última el ${FECHA.format(new Date(p.ultimaCompra))}` : ""}
            </span>
            {!p.activo ? (
              <span>
                <Insignia tono="alerta">Desactivado</Insignia>
              </span>
            ) : null}
          </FilaLista>
        ),
      )}
      {editando === "nuevo" ? (
        <FormularioProveedor proveedor={null} onListo={() => setEditando(null)} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nuevo")}>
          + Nuevo proveedor
        </Boton>
      )}
    </Tarjeta>
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
      <Tarjeta
        titulo={proveedor.nombre}
        acciones={
          <Boton variante="secundario" onClick={onVolver}>
            ← Volver a proveedores
          </Boton>
        }
      >
        <FilaDetalles>
          <BloqueDetalle titulo="Contacto">
            {proveedor.ruc ? <p>RUC {proveedor.ruc}</p> : null}
            {proveedor.contacto ? <p>{proveedor.contacto}</p> : null}
            {proveedor.telefono ? <p>{proveedor.telefono}</p> : null}
            {proveedor.email ? <p>{proveedor.email}</p> : null}
            {proveedor.nota ? <p>{proveedor.nota}</p> : null}
          </BloqueDetalle>
          <BloqueDetalle titulo="Compras">
            <p>
              {proveedor.compras} {proveedor.compras === 1 ? "compra" : "compras"}
            </p>
            <p>{MONEDA.format(proveedor.comprado)} en total</p>
          </BloqueDetalle>
        </FilaDetalles>
      </Tarjeta>

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
      ) : (
        <Boton onClick={() => setNueva(true)}>+ Registrar compra</Boton>
      )}

      <Tarjeta titulo="Historial de compras">
        {compras.isPending ? (
          <Cargando texto="Cargando compras…" />
        ) : compras.isError ? (
          <Alerta tono="error">{compras.error.message}</Alerta>
        ) : compras.data.length === 0 ? (
          <EstadoVacio titulo="Sin compras" texto="Todavía no se registró ninguna." />
        ) : (
          compras.data.map((c) => (
            <FilaLista key={c.id}>
              <strong>
                {FECHA_HORA.format(new Date(c.creadoEn))} · {MONEDA.format(c.total)}
              </strong>
              <span>
                {c.documento ? `${c.documento} · ` : ""}Registró {c.usuario}
              </span>
              {c.items.map((i) => (
                <span key={i.id}>
                  {i.cantidad} × {i.producto} ({i.color}, {i.talla}) a{" "}
                  {MONEDA.format(i.costoUnitario)}
                </span>
              ))}
              {c.nota ? <span>{c.nota}</span> : null}
            </FilaLista>
          ))
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
