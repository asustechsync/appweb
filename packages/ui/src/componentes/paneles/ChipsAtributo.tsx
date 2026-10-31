"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

import { IconoCerrar } from "../../iconos";

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
  onAgregar: (valor: string) => void;
  disabled?: boolean;
}

/**
 * Chip punteado que se abre en un campo para escribir un valor nuevo. Enter
 * lo agrega, Escape lo cierra sin cambios.
 */
export function ChipAgregar({
  texto,
  etiqueta,
  placeholder,
  onAgregar,
  disabled,
}: PropsChipAgregar) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");

  function cerrar() {
    setAbierto(false);
    setValor("");
  }

  function agregar() {
    const limpio = valor.trim();
    if (limpio !== "") onAgregar(limpio);
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
      <input
        className="ui-chip-agregar__campo"
        aria-label={etiqueta}
        placeholder={placeholder}
        value={valor}
        // biome-ignore lint/a11y/noAutofocus: se abre a pedido, el foco va donde se escribe.
        autoFocus
        onChange={(evento) => setValor(evento.target.value)}
        onBlur={agregar}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            agregar();
          }
          if (evento.key === "Escape") cerrar();
        }}
      />
    </span>
  );
}
