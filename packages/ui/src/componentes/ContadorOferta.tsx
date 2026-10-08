"use client";

import { useEffect, useState } from "react";

import "./estilos/contador-oferta.css";

export interface PropsContadorOferta {
  /** Fecha y hora de fin, en ISO 8601 con zona horaria. */
  terminaEn: string;
}

interface Restante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

function calcularRestante(fin: number): Restante | null {
  const ms = fin - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

const dos = (n: number) => String(n).padStart(2, "0");

/**
 * Cuenta regresiva en cuatro cajas. Isla cliente: en el servidor pinta guiones
 * (la hora del servidor no es la del visitante) y arranca al montarse. Al
 * llegar a cero desaparece.
 */
export function ContadorOferta({ terminaEn }: PropsContadorOferta) {
  const fin = Date.parse(terminaEn);
  const [restante, setRestante] = useState<Restante | null | "pendiente">("pendiente");

  useEffect(() => {
    setRestante(calcularRestante(fin));
    const intervalo = setInterval(() => setRestante(calcularRestante(fin)), 1000);
    return () => clearInterval(intervalo);
  }, [fin]);

  if (restante === null) return null;

  const cajas: Array<[string, string]> =
    restante === "pendiente"
      ? [["--", "Días"], ["--", "Hrs"], ["--", "Min"], ["--", "Seg"]]
      : [
          [dos(restante.dias), "Días"],
          [dos(restante.horas), "Hrs"],
          [dos(restante.minutos), "Min"],
          [dos(restante.segundos), "Seg"],
        ];

  return (
    <ul className="ui-contador-oferta" aria-label="Tiempo restante de la oferta">
      {cajas.map(([valor, unidad]) => (
        <li key={unidad} className="ui-contador-oferta__caja">
          <strong>{valor}</strong>
          <span>{unidad}</span>
        </li>
      ))}
    </ul>
  );
}
