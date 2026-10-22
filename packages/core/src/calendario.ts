/**
 * Matematica del calendario: fechas como texto ISO ("aaaa-mm-dd") y la
 * cuadricula de un mes. Sin dependencias: se importa por su ruta
 * (`@appweb/core/calendario`) desde componentes de cliente, igual que
 * `formato`, sin arrastrar el resto de core al navegador.
 *
 * Una fecha ISO es un DIA, no un instante: no lleva hora ni zona. Se arma y se
 * lee siempre con la fecha local, asi las 9 pm no caen en el dia siguiente.
 */

/** Primer dia de la semana: lunes. */
export const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"] as const;

const PATRON_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function rellenar(numero: number, largo = 2): string {
  return String(numero).padStart(largo, "0");
}

/** 2026-10-21 */
export function aIso(fecha: Date): string {
  return `${rellenar(fecha.getFullYear(), 4)}-${rellenar(fecha.getMonth() + 1)}-${rellenar(fecha.getDate())}`;
}

/** Medianoche local de una fecha ISO, o `null` si no es una fecha real (2026-02-31). */
export function desdeIso(iso: string): Date | null {
  const partes = PATRON_ISO.exec(iso);
  if (partes === null) return null;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])] as const;
  const fecha = new Date(anio, mes - 1, dia);
  const esReal =
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  return esReal ? fecha : null;
}

export function hoyIso(ahora = new Date()): string {
  return aIso(ahora);
}

/**
 * Las semanas de un mes, de lunes a domingo. Cada celda es el numero del dia, o
 * `null` en los huecos antes del dia 1 y despues del ultimo. `mes` va de 1 a 12.
 */
export function semanasDelMes(anio: number, mes: number): (number | null)[][] {
  const diasDelMes = new Date(anio, mes, 0).getDate();
  // getDay(): domingo = 0. Con lunes primero, el hueco inicial es (dia + 6) % 7.
  const huecoInicial = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

  const celdas: (number | null)[] = [
    ...Array.from({ length: huecoInicial }, () => null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

/** El mes que sigue (o precede, con `paso` negativo) a anio-mes. `mes` de 1 a 12. */
export function moverMes(anio: number, mes: number, paso: number): { anio: number; mes: number } {
  const fecha = new Date(anio, mes - 1 + paso, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}
