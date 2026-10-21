"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  Casilla,
  EstadoVacio,
  FilaLista,
  FilaUnida,
  Formulario,
  Insignia,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";
import { MONEDA, numeroDesdeTexto } from "@appweb/core/formato";

/** Seccion "Portada" del grupo Promociones: los banners del carrusel. */
export function Portada() {
  return (
    <Tarjeta titulo="Portada y banners">
      <Banners />
    </Tarjeta>
  );
}

/**
 * Seccion "Cupones" del grupo Promociones: los cupones de descuento. Los
 * niveles de recompensa tienen su propia seccion en Cuentas.
 */
export function Promociones() {
  return (
    <Tarjeta titulo="Cupones">
      <Cupones />
    </Tarjeta>
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

function Banners() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.promociones.banners.queryOptions());
  const [editando, setEditando] = useState<string | null>(null);

  if (lista.isPending) return <Cargando texto="Cargando banners…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  return (
    <>
      <p>
        Las promociones que se turnan arriba en la portada, en este orden. Las ocultas no se
        muestran.
      </p>
      {lista.data.length === 0 ? (
        <EstadoVacio titulo="Sin banners" texto="La portada no muestra el carrusel." />
      ) : null}
      {lista.data.map((b) =>
        editando === b.id ? (
          <FormularioBanner key={b.id} banner={b} onListo={() => setEditando(null)} />
        ) : (
          <FilaLista
            key={b.id}
            acciones={
              <Boton variante="secundario" onClick={() => setEditando(b.id)}>
                Editar
              </Boton>
            }
          >
            <span>
              <Insignia tono={b.activo ? "exito" : "alerta"}>
                {b.activo ? `#${b.orden} en portada` : "Oculto"}
              </Insignia>{" "}
              {b.etiqueta}
            </span>
            <strong>{b.titulo}</strong>
            <span>{b.texto}</span>
            <span>
              Botón “{b.accion}” → {b.href}
            </span>
          </FilaLista>
        ),
      )}
      {editando === "nuevo" ? (
        <FormularioBanner banner={null} onListo={() => setEditando(null)} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nuevo")}>
          + Nuevo banner
        </Boton>
      )}
    </>
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

function Cupones() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.promociones.cupones.queryOptions());
  const [editando, setEditando] = useState<string | null>(null);

  if (lista.isPending) return <Cargando texto="Cargando cupones…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  return (
    <>
      <p>
        Códigos de descuento sobre el subtotal. No se suman al descuento de nivel: el cliente recibe
        el mayor.
      </p>
      {lista.data.length === 0 ? (
        <EstadoVacio titulo="Sin cupones" texto="Todavía no hay códigos de descuento." />
      ) : null}
      {lista.data.map((c) =>
        editando === c.id ? (
          <FormularioCupon key={c.id} cupon={c} onListo={() => setEditando(null)} />
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
              {c.codigo} · {c.porcentaje}%
            </strong>
            <span>
              {c.minimoCompra !== null ? `Desde ${MONEDA.format(c.minimoCompra)}` : "Sin mínimo"} ·{" "}
              {c.usos} {c.usos === 1 ? "uso" : "usos"}
              {c.usosMaximos !== null ? ` de ${c.usosMaximos}` : ""}
            </span>
            <span>
              {c.desde || c.hasta
                ? `Vigente ${c.desde ? `desde ${c.desde}` : ""} ${c.hasta ? `hasta ${c.hasta}` : ""}`
                : "Sin fecha de vencimiento"}
            </span>
            <span>
              <Insignia tono={c.activo ? "exito" : "alerta"}>
                {c.activo ? "Activo" : "Apagado"}
              </Insignia>
            </span>
          </FilaLista>
        ),
      )}
      {editando === "nuevo" ? (
        <FormularioCupon cupon={null} onListo={() => setEditando(null)} />
      ) : (
        <Boton variante="secundario" onClick={() => setEditando("nuevo")}>
          + Nuevo cupón
        </Boton>
      )}
    </>
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
        <Campo id="cupon-desde" etiqueta="Desde" tipo="date" valor={desde} onCambio={setDesde} />
        <Campo id="cupon-hasta" etiqueta="Hasta" tipo="date" valor={hasta} onCambio={setHasta} />
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
