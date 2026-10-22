"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ahorroDePack, slugDesdeTexto } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoTexto,
  Cargando,
  Casilla,
  EstadoVacio,
  FilaLista,
  FilaUnida,
  Formulario,
  Insignia,
  SelectorBuscable,
  Tarjeta,
} from "@appweb/ui";

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

  if (lista.isPending) return <Cargando texto="Cargando packs…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  return (
    <Tarjeta titulo="Packs y combos">
      <p>
        Prendas que se venden juntas a un precio especial, por ejemplo 3 boxers talla M. El stock
        sale solo de sus prendas.
      </p>
      {lista.data.length === 0 ? (
        <EstadoVacio titulo="Sin packs" texto="Arma el primero con prendas del catálogo." />
      ) : null}
      {lista.data.map((p) =>
        editando === p.id ? (
          <FormularioPack key={p.id} pack={p} onListo={() => setEditando(null)} />
        ) : (
          <FilaLista
            key={p.id}
            acciones={
              <Boton variante="secundario" onClick={() => setEditando(p.id)}>
                Editar
              </Boton>
            }
          >
            <strong>
              {p.nombre} · {MONEDA.format(p.precio)}
            </strong>
            {p.componentes.map((c) => (
              <span key={c.varianteId}>
                {c.cantidad} × {c.etiqueta} (stock {c.stock})
              </span>
            ))}
            <span>
              Suelto {MONEDA.format(p.precioSuelto)} · ahorra {MONEDA.format(p.ahorro)}
              {p.margen
                ? ` · margen ${MONEDA.format(p.margen.monto)} (${p.margen.porcentaje} %)`
                : " · sin costo registrado"}
            </span>
            <span>
              <Insignia tono={p.activo ? "exito" : "alerta"}>
                {p.activo ? "Activo" : "Oculto"}
              </Insignia>{" "}
              <Insignia tono={p.stock === 0 ? "error" : "neutro"}>
                Alcanza para {p.stock} {p.stock === 1 ? "pack" : "packs"}
              </Insignia>
            </span>
          </FilaLista>
        ),
      )}
      {editando === "nuevo" ? (
        <FormularioPack pack={null} onListo={() => setEditando(null)} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nuevo")}>
          + Nuevo pack
        </Boton>
      )}
    </Tarjeta>
  );
}

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
