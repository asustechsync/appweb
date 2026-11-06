"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

import { IconoCerrar, IconoMarcar } from "../../iconos";

import "./chips-atributo.css";

export interface PropsGrupoChips {
  /** Titulo pequeño del grupo: "Azules · 1x". Sin el, solo la fila de chips. */
  titulo?: string;
  /** Al lado del titulo: un boton "Editar". */
  accion?: ReactNode;
  children: ReactNode;
}

/** Una fila de chips que baja de linea cuando no cabe, con su titulo encima. */
export function GrupoChips({ titulo, accion, children }: PropsGrupoChips) {
  return (
    <div className="ui-grupo-chips">
      {titulo || accion ? (
        <div className="ui-grupo-chips__cabecera">
          {titulo ? <p className="ui-grupo-chips__titulo">{titulo}</p> : null}
          {accion}
        </div>
      ) : null}
      <div className="ui-grupo-chips__fila">{children}</div>
    </div>
  );
}

export interface PropsChipAtributo {
  /** Id del valor: lo que viaja al arrastrar. */
  id: string;
  nombre: string;
  /** Lo que va en el SKU, en suave al lado del nombre: "11". */
  codigo?: string | null;
  /**
   * Muestra de color en hex ("#1E2A4A"). `null` pinta el circulo vacio (un
   * color sin muestra, como Multicolor); sin la prop no hay circulo.
   */
  muestra?: string | null;
  /** Oculto: ya no se ofrece al crear productos. Se ve atenuado. */
  oculto?: boolean;
  seleccionado?: boolean;
  /** Al pulsar el chip. */
  onElegir?: () => void;
  /** Quitarlo con la "x" (las tallas de un tipo). */
  onQuitar?: () => void;
  /** Soltar otro chip encima: recibe el id del arrastrado. Sin ella no se arrastra. */
  onSoltar?: (idArrastrado: string) => void;
  disabled?: boolean;
}

const TIPO_ARRASTRE = "text/x-chip-atributo";

/**
 * Un valor de atributo: talla, color, diseño o etiqueta. Se elige con un
 * clic y, si se le pasa `onSoltar`, se reordena arrastrandolo sobre otro.
 */
export function ChipAtributo({
  id,
  nombre,
  codigo,
  muestra,
  oculto = false,
  seleccionado = false,
  onElegir,
  onQuitar,
  onSoltar,
  disabled,
}: PropsChipAtributo) {
  const [encima, setEncima] = useState(false);
  const clases = [
    "ui-chip-atributo",
    oculto ? "ui-chip-atributo--oculto" : "",
    seleccionado ? "ui-chip-atributo--seleccionado" : "",
    encima ? "ui-chip-atributo--destino" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: arrastrar es un atajo de raton; el chip se elige con su boton.
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: idem, el orden tambien se ve sin arrastrar.
    <span
      className={clases}
      draggable={onSoltar !== undefined && !disabled}
      onDragStart={(evento) => evento.dataTransfer.setData(TIPO_ARRASTRE, id)}
      onDragOver={(evento) => {
        if (!onSoltar || !evento.dataTransfer.types.includes(TIPO_ARRASTRE)) return;
        evento.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(evento) => {
        setEncima(false);
        const arrastrado = evento.dataTransfer.getData(TIPO_ARRASTRE);
        if (onSoltar && arrastrado && arrastrado !== id) {
          evento.preventDefault();
          onSoltar(arrastrado);
        }
      }}
    >
      <button
        type="button"
        className="ui-chip-atributo__boton"
        aria-pressed={onElegir ? seleccionado : undefined}
        onClick={onElegir}
        disabled={disabled || !onElegir}
      >
        {muestra !== undefined ? (
          <span
            className={muestra ? "ui-chip-atributo__muestra" : "ui-chip-atributo__muestra--vacia"}
            style={muestra ? ({ "--muestra": muestra } as CSSProperties) : undefined}
            aria-hidden="true"
          />
        ) : null}
        {nombre}
        {codigo ? <span className="ui-chip-atributo__codigo">{codigo}</span> : null}
        {oculto ? <span className="ui-solo-lectores"> (oculto)</span> : null}
      </button>
      {onQuitar ? (
        <button
          type="button"
          className="ui-chip-atributo__quitar"
          aria-label={`Quitar ${nombre}`}
          onClick={onQuitar}
          disabled={disabled}
        >
          <IconoCerrar tamano={12} />
        </button>
      ) : null}
    </span>
  );
}

export interface PropsChipAgregar {
  /** El chip en reposo: "+ Azul". */
  texto: string;
  /** Nombre accesible del campo: "Nuevo color azul". */
  etiqueta: string;
  placeholder?: string;
  /** Con la muestra en hex cuando `conColor`. */
  onAgregar: (valor: string, muestra?: string) => void;
  /**
   * Antes del nombre, un circulo que abre la paleta del sistema para elegir el
   * tono. Entonces se agrega con Enter o con el visto, no al salir del campo:
   * abrir la paleta le quita el foco al nombre.
   */
  conColor?: boolean;
  disabled?: boolean;
}

/** Tono con el que abre la paleta: un gris medio, ni blanco ni negro. */
const MUESTRA_INICIAL = "#808080";

/**
 * Chip punteado que se abre en un campo para escribir un valor nuevo. Enter
 * lo agrega, Escape lo cierra sin cambios.
 */
export function ChipAgregar({
  texto,
  etiqueta,
  placeholder,
  onAgregar,
  conColor = false,
  disabled,
}: PropsChipAgregar) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [muestra, setMuestra] = useState(MUESTRA_INICIAL);

  function cerrar() {
    setAbierto(false);
    setValor("");
    setMuestra(MUESTRA_INICIAL);
  }

  function agregar() {
    const limpio = valor.trim();
    if (limpio !== "") onAgregar(limpio, conColor ? muestra : undefined);
    cerrar();
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="ui-chip-agregar"
        onClick={() => setAbierto(true)}
        disabled={disabled}
      >
        {texto}
      </button>
    );
  }

  return (
    <span className="ui-chip-agregar ui-chip-agregar--abierto">
      {conColor ? (
        <input
          type="color"
          className="ui-chip-agregar__muestra"
          aria-label="Tono del color"
          value={muestra}
          onChange={(evento) => setMuestra(evento.target.value)}
        />
      ) : null}
      <input
        className="ui-chip-agregar__campo"
        aria-label={etiqueta}
        placeholder={placeholder}
        value={valor}
        // biome-ignore lint/a11y/noAutofocus: se abre a pedido, el foco va donde se escribe.
        autoFocus
        onChange={(evento) => setValor(evento.target.value)}
        onBlur={conColor ? undefined : agregar}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            agregar();
          }
          if (evento.key === "Escape") cerrar();
        }}
      />
      {conColor ? (
        <>
          <button
            type="button"
            className="ui-chip-agregar__accion"
            aria-label="Agregar"
            onClick={agregar}
            disabled={valor.trim() === ""}
          >
            <IconoMarcar tamano={14} />
          </button>
          <button
            type="button"
            className="ui-chip-agregar__accion"
            aria-label="Cancelar"
            onClick={cerrar}
          >
            <IconoCerrar tamano={12} />
          </button>
        </>
      ) : null}
    </span>
  );
}
