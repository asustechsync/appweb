"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type ClaseAtributo, FAMILIAS_COLOR } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  Casilla,
  ChipAgregar,
  ChipAtributo,
  FilaUnida,
  Formulario,
  GrupoChips,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { mensajeDeFallo, numeroDesdeTexto } from "@appweb/core/formato";

/**
 * Atributos del catalogo en una sola pagina: tallas (por tipo de prenda),
 * colores, diseños y etiquetas. Son los valores que el editor de productos
 * ofrece elegir; cada uno es un chip que se crea, se oculta y se reordena
 * arrastrando sin salir de la pestaña.
 *
 * Nada se borra ni se renombra: las variantes guardan el nombre y el SKU el
 * codigo. Lo que ya no se usa se oculta y deja de ofrecerse al crear.
 */

type Pestana = "TALLAS" | ClaseAtributo;

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "TALLAS", etiqueta: "Tallas" },
  { id: "COLOR", etiqueta: "Colores" },
  { id: "DISENO", etiqueta: "Diseños" },
  { id: "ETIQUETA", etiqueta: "Etiquetas" },
];

const AYUDA: Record<Pestana, string> = {
  TALLAS:
    "Cada tipo de prenda tiene sus tallas: son las que se marcan al crear variantes. Las dos letras del tipo inician el código del modelo (BX012).",
  COLOR:
    "Cada color tiene un código fijo de dos dígitos que va en el SKU; la decena es la familia. Arrastra un chip para cambiar el orden.",
  DISENO: "Su número en el SKU (1 a 9) se asigna dentro de cada producto. Arrastra para ordenar.",
  ETIQUETA: "La insignia sobre la foto de la tarjeta. Arrastra para ordenar.",
};

/** Tras guardar: refresca la pagina y los selectores del editor de productos. */
function useRefrescar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries(trpc.panel.atributos.pathFilter());
    void queryClient.invalidateQueries(trpc.panel.productos.opciones.pathFilter());
  };
}

export function Atributos() {
  const trpc = useTRPC();
  const lista = useQuery(trpc.panel.atributos.listar.queryOptions());
  const [pestana, setPestana] = useState<Pestana>("TALLAS");

  if (lista.isPending) return <Cargando texto="Cargando atributos…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  return (
    <Tarjeta titulo="Atributos">
      <Pestanas
        etiqueta="Clase de atributo"
        opciones={PESTANAS}
        activa={pestana}
        onCambio={(id) => setPestana(id as Pestana)}
      />
      <p>{AYUDA[pestana]}</p>
      {pestana === "TALLAS" ? (
        <PestanaTallas tipos={lista.data.tipos} />
      ) : (
        <PestanaValores
          key={pestana}
          clase={pestana}
          valores={lista.data.valores.filter((v) => v.clase === pestana)}
        />
      )}
    </Tarjeta>
  );
}

// ── Tallas, por tipo de prenda ──────────────────────────────────────────────

interface TipoDelPanel {
  id: string;
  codigo: string;
  nombre: string;
  tallas: string[];
  palabras: string[];
  orden: number;
  activo: boolean;
  usos: number;
}

function PestanaTallas({ tipos }: { tipos: TipoDelPanel[] }) {
  const trpc = useTRPC();
  const refrescar = useRefrescar();
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.atributos.guardarTipo.mutationOptions({
      onSuccess: () => {
        setError(null);
        refrescar();
      },
      onError: (fallo) => setError(mensajeDeFallo(fallo)),
    }),
  );

  /** Las tallas del tipo cambian; el resto de sus datos queda igual. */
  function cambiarTallas(tipo: TipoDelPanel, tallas: string[]) {
    setAviso(null);
    guardar.mutate({
      tipoId: tipo.id,
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      tallas,
      palabras: tipo.palabras,
      orden: tipo.orden,
      activo: tipo.activo,
    });
  }

  if (editando !== null) {
    const tipo = tipos.find((t) => t.id === editando) ?? null;
    return (
      <FormularioTipo
        tipo={tipo}
        onListo={(mensaje) => {
          setEditando(null);
          setAviso(mensaje ?? null);
        }}
      />
    );
  }

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {tipos.map((t) => (
        <GrupoChips
          key={t.id}
          titulo={`${t.codigo} · ${t.nombre} · ${t.usos} ${t.usos === 1 ? "producto" : "productos"}${t.activo ? "" : " · oculto"}`}
          accion={
            <Boton variante="secundario" onClick={() => setEditando(t.id)}>
              Editar
            </Boton>
          }
        >
          {t.tallas.map((talla) => (
            <ChipAtributo
              key={talla}
              id={talla}
              nombre={talla}
              oculto={!t.activo}
              disabled={guardar.isPending}
              // Quitarla no toca las variantes ya creadas: guardan su talla como texto.
              {...(t.tallas.length > 1
                ? {
                    onQuitar: () =>
                      cambiarTallas(
                        t,
                        t.tallas.filter((x) => x !== talla),
                      ),
                  }
                : {})}
            />
          ))}
          <ChipAgregar
            texto="+ Talla"
            etiqueta={`Nueva talla de ${t.nombre}`}
            placeholder="XXL"
            disabled={guardar.isPending}
            onAgregar={(talla) => cambiarTallas(t, [...t.tallas, talla])}
          />
        </GrupoChips>
      ))}
      <Boton variante="secundario" onClick={() => setEditando("nuevo")}>
        + Nuevo tipo de prenda
      </Boton>
    </>
  );
}

function listaDesdeTexto(texto: string): string[] {
  return texto
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function FormularioTipo({
  tipo,
  onListo,
}: {
  tipo: TipoDelPanel | null;
  onListo: (mensaje?: string) => void;
}) {
  const trpc = useTRPC();
  const refrescar = useRefrescar();
  const [codigo, setCodigo] = useState(tipo?.codigo ?? "");
  const [nombre, setNombre] = useState(tipo?.nombre ?? "");
  const [tallas, setTallas] = useState(tipo?.tallas.join(", ") ?? "");
  const [palabras, setPalabras] = useState(tipo?.palabras.join(", ") ?? "");
  const [orden, setOrden] = useState(String(tipo?.orden ?? 0));
  const [activo, setActivo] = useState(tipo?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.panel.atributos.guardarTipo.mutationOptions({
      onSuccess: () => {
        refrescar();
        onListo(tipo ? "Tipo de prenda guardado." : "Tipo de prenda creado.");
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
          ...(tipo ? { tipoId: tipo.id } : {}),
          codigo,
          nombre,
          tallas: listaDesdeTexto(tallas),
          palabras: listaDesdeTexto(palabras),
          orden: Math.trunc(numeroDesdeTexto(orden || "0")),
          activo,
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <FilaUnida iguales>
        <Campo
          id="tipo-codigo"
          etiqueta={tipo ? "Código (no cambia)" : "Código (dos letras)"}
          valor={codigo}
          onCambio={(valor) => setCodigo(valor.toUpperCase().slice(0, 2))}
          placeholder="GO"
          disabled={tipo !== null}
          requerido
        />
        <Campo
          id="tipo-nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={setNombre}
          placeholder="Gorros"
          requerido
        />
      </FilaUnida>
      <Campo
        id="tipo-tallas"
        etiqueta="Tallas (separadas por comas)"
        valor={tallas}
        onCambio={setTallas}
        placeholder="S, M, L, XL"
        requerido
      />
      <Campo
        id="tipo-palabras"
        etiqueta="Palabras que lo delatan en el nombre (opcional)"
        valor={palabras}
        onCambio={setPalabras}
        placeholder="gorro, gorros, chullo"
      />
      <Campo id="tipo-orden" etiqueta="Orden" valor={orden} onCambio={setOrden} />
      <Casilla
        id="tipo-activo"
        etiqueta="Visible al crear productos"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar tipo"}
      </Boton>
      <Boton variante="secundario" onClick={() => onListo()}>
        Cancelar
      </Boton>
    </Formulario>
  );
}

// ── Colores, diseños y etiquetas ────────────────────────────────────────────

interface ValorDelPanel {
  id: string;
  clase: ClaseAtributo;
  codigo: string | null;
  nombre: string;
  hex: string | null;
  orden: number;
  activo: boolean;
  usos: number;
}

const SINGULAR: Record<ClaseAtributo, string> = {
  COLOR: "color",
  DISENO: "diseño",
  ETIQUETA: "etiqueta",
};

/** Mueve `id` justo antes de `destino`: el orden que queda tras arrastrar. */
function moverAntes(ids: string[], id: string, destino: string): string[] {
  const sin = ids.filter((x) => x !== id);
  const posicion = sin.indexOf(destino);
  return [...sin.slice(0, posicion), id, ...sin.slice(posicion)];
}

function decenaDe(codigo: string | null): number | null {
  return codigo === null ? null : Math.floor(Number(codigo) / 10);
}

function PestanaValores({ clase, valores }: { clase: ClaseAtributo; valores: ValorDelPanel[] }) {
  const trpc = useTRPC();
  const refrescar = useRefrescar();
  const [elegido, setElegido] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(mensajeDeFallo(fallo));
  }

  const crear = useMutation(
    trpc.panel.atributos.guardar.mutationOptions({
      onSuccess: (r, v) => {
        setError(null);
        setAviso(
          r.codigo ? `${v.nombre} agregado con el código ${r.codigo}.` : `${v.nombre} agregado.`,
        );
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const ordenar = useMutation(
    trpc.panel.atributos.ordenar.mutationOptions({ onSuccess: refrescar, onError: alFallar }),
  );

  const ocupado = crear.isPending || ordenar.isPending;
  const ids = valores.map((v) => v.id);
  const seleccionado = valores.find((v) => v.id === elegido) ?? null;

  function chip(v: ValorDelPanel) {
    return (
      <ChipAtributo
        key={v.id}
        id={v.id}
        nombre={v.nombre}
        {...(clase === "COLOR" ? { codigo: v.codigo, muestra: v.hex } : {})}
        oculto={!v.activo}
        seleccionado={v.id === elegido}
        disabled={ocupado}
        onElegir={() => setElegido(v.id === elegido ? null : v.id)}
        onSoltar={(arrastrado) => ordenar.mutate({ clase, ids: moverAntes(ids, arrastrado, v.id) })}
      />
    );
  }

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      {clase === "COLOR" ? (
        FAMILIAS_COLOR.map((f) => (
          <GrupoChips key={f.decena} titulo={`${f.nombre} · ${f.decena}x`}>
            {valores.filter((v) => decenaDe(v.codigo) === f.decena).map(chip)}
            <ChipAgregar
              texto="+ Color"
              etiqueta={`Nuevo color en ${f.nombre.toLowerCase()}`}
              placeholder="Nombre"
              disabled={ocupado}
              onAgregar={(nombre) =>
                crear.mutate({ clase, nombre, familia: f.decena, activo: true })
              }
            />
          </GrupoChips>
        ))
      ) : (
        <GrupoChips>
          {valores.map(chip)}
          <ChipAgregar
            texto={`+ ${SINGULAR[clase].charAt(0).toUpperCase()}${SINGULAR[clase].slice(1)}`}
            etiqueta={`Nuevo ${SINGULAR[clase]}`}
            placeholder="Nombre"
            disabled={ocupado}
            onAgregar={(nombre) => crear.mutate({ clase, nombre, activo: true })}
          />
        </GrupoChips>
      )}

      {seleccionado ? (
        <DetalleValor
          key={seleccionado.id}
          valor={seleccionado}
          onListo={(mensaje) => {
            setElegido(null);
            setError(null);
            setAviso(mensaje ?? null);
          }}
        />
      ) : null}
    </>
  );
}

/** El chip elegido: cuantas variantes lo usan, su muestra y si se ofrece. */
function DetalleValor({
  valor,
  onListo,
}: {
  valor: ValorDelPanel;
  onListo: (mensaje?: string) => void;
}) {
  const trpc = useTRPC();
  const refrescar = useRefrescar();
  const [hex, setHex] = useState(valor.hex ?? "");
  const [activo, setActivo] = useState(valor.activo);
  const [error, setError] = useState<string | null>(null);
  const esColor = valor.clase === "COLOR";
  const usosDe = valor.clase === "ETIQUETA" ? "productos" : "variantes";

  const guardar = useMutation(
    trpc.panel.atributos.guardar.mutationOptions({
      onSuccess: () => {
        refrescar();
        onListo(`${valor.nombre} guardado.`);
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
          atributoId: valor.id,
          clase: valor.clase,
          nombre: valor.nombre,
          activo,
          ...(esColor ? { hex: hex.trim() === "" ? null : hex.trim() } : {}),
        });
      }}
    >
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <p>
        <strong>{valor.nombre}</strong>
        {valor.codigo ? ` · código ${valor.codigo}` : ""} · {valor.usos} {usosDe}. El nombre no
        cambia: las variantes ya creadas lo guardan.
      </p>
      {esColor ? (
        <Campo
          id="atributo-hex"
          etiqueta="Muestra (hex)"
          valor={hex}
          onCambio={setHex}
          placeholder="#1E2A4A"
        />
      ) : null}
      <Casilla
        id="atributo-activo"
        etiqueta="Visible al crear productos"
        marcada={activo}
        onCambio={setActivo}
      />
      <Boton tipo="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar"}
      </Boton>
      <Boton variante="secundario" onClick={() => onListo()}>
        Cerrar
      </Boton>
    </Formulario>
  );
}
