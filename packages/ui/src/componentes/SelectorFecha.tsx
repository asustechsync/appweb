"use client";

import { useEffect, useState } from "react";

import { diasDelMes, MESES } from "../datos/fechas";

import { SelectorBuscable } from "./SelectorBuscable";

import "./estilos/selector-fecha.css";

export interface PropsSelectorFecha {
  id: string;
  etiqueta: string;
  /** Fecha en formato ISO "aaaa-mm-dd", o "" si no hay ninguna elegida. */
  valor: string;
  onCambio: (valor: string) => void;
  /** Año mas antiguo seleccionable. Por defecto, 100 años atras. */
  anioMinimo?: number;
  /** Año mas reciente seleccionable. Por defecto, el año actual. */
  anioMaximo?: number;
  disabled?: boolean;
}

const AHORA = new Date().getFullYear();

function alPadEnDos(numero: number): string {
  return String(numero).padStart(2, "0");
}

interface FechaParcial {
  dia: string;
  mes: string;
  anio: string;
}

function desdeIso(valor: string): FechaParcial {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return { dia: "", mes: "", anio: "" };
  const [anio = "", mes = "", dia = ""] = valor.split("-");
  return { dia: String(Number(dia)), mes: String(Number(mes)), anio };
}

/**
 * Fecha de nacimiento como tres combos escribibles (dia, mes, año), cada uno
 * con su lista de 4 opciones a la vez y scroll para el resto: mismo `SelectorBuscable`
 * de tres columnas, en vez de un <select> nativo o un <input type="date">.
 */
export function SelectorFecha({
  id,
  etiqueta,
  valor,
  onCambio,
  anioMinimo = AHORA - 100,
  anioMaximo = AHORA,
  disabled,
}: PropsSelectorFecha) {
  const [{ dia, mes, anio }, setPartes] = useState(() => desdeIso(valor));

  // `valor` puede llegar vacio en el primer render (los datos del perfil
  // todavia no cargaron) y recien despues actualizarse a la fecha real: sin
  // esto, el estado interno se queda pegado en blanco para siempre, aunque
  // el valor guardado sí haya llegado.
  useEffect(() => {
    if (valor === "") return;
    const partes = desdeIso(valor);
    setPartes((actual) =>
      actual.dia === partes.dia && actual.mes === partes.mes && actual.anio === partes.anio
        ? actual
        : partes,
    );
  }, [valor]);

  const dias = Array.from(
    { length: mes && anio ? diasDelMes(Number(mes), Number(anio)) : 31 },
    (_, indice) => String(indice + 1),
  );

  const anios: string[] = [];
  for (let a = anioMaximo; a >= anioMinimo; a--) anios.push(String(a));

  function actualizar(siguienteDia: string, siguienteMes: string, siguienteAnio: string) {
    const maximo =
      siguienteAnio && siguienteMes !== "" ? diasDelMes(Number(siguienteMes), Number(siguienteAnio)) : 31;
    const diaSeguro = siguienteDia && Number(siguienteDia) > maximo ? String(maximo) : siguienteDia;

    setPartes({ dia: diaSeguro, mes: siguienteMes, anio: siguienteAnio });
    onCambio(
      diaSeguro && siguienteMes !== "" && siguienteAnio
        ? `${siguienteAnio}-${alPadEnDos(Number(siguienteMes))}-${alPadEnDos(Number(diaSeguro))}`
        : "",
    );
  }

  return (
    <div className="ui-campo">
      <label id={`${id}-etiqueta`}>{etiqueta}</label>
      <div className="ui-selector-fecha" role="group" aria-labelledby={`${id}-etiqueta`}>
        <SelectorBuscable
          id={id}
          etiqueta="Día"
          valor={dia}
          opciones={dias.map((numero) => ({ valor: numero, etiqueta: alPadEnDos(Number(numero)) }))}
          disabled={disabled}
          onCambio={(valorDia) => actualizar(valorDia, mes, anio)}
        />
        <SelectorBuscable
          etiqueta="Mes"
          valor={mes}
          opciones={MESES.map((nombre, indice) => ({ valor: String(indice + 1), etiqueta: nombre }))}
          disabled={disabled}
          onCambio={(valorMes) => actualizar(dia, valorMes, anio)}
        />
        <SelectorBuscable
          etiqueta="Año"
          valor={anio}
          opciones={anios.map((numero) => ({ valor: numero, etiqueta: numero }))}
          disabled={disabled}
          onCambio={(valorAnio) => actualizar(dia, mes, valorAnio)}
        />
      </div>
    </div>
  );
}
