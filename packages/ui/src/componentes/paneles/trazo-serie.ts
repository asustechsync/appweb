/** Cuantos tramos a cada lado entran en el promedio de `suavizar`. */
const RADIO_SUAVIZADO = 2;

/**
 * Promedio movil para dibujar: con 24 tramos en 96 px cada uno mide menos de
 * 4 px y una venta grande se veria como una pared. Promediar con los vecinos
 * reparte la subida en unas horas y la vuelve una loma. El primer y el ultimo
 * punto quedan exactos: la linea arranca en 0 y termina en la cifra real.
 */
export function suavizar(valores: number[]): number[] {
  return valores.map((valor, i) => {
    if (i === 0 || i === valores.length - 1) return valor;
    const ventana = valores.slice(
      Math.max(0, i - RADIO_SUAVIZADO),
      Math.min(valores.length, i + RADIO_SUAVIZADO + 1),
    );
    return ventana.reduce((suma, v) => suma + v, 0) / ventana.length;
  });
}

/**
 * Curva suave que pasa por cada punto: cada tramo es una "S" que sale y llega
 * plana. Asi nunca se pasa de largo: no baja de cero ni sube mas que el dato.
 */
export function trazo(puntos: [number, number][]): string {
  const [primero] = puntos;
  if (!primero) return "";
  let d = `M${primero[0]},${primero[1]}`;
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    if (!a || !b) continue;
    const medio = (a[0] + b[0]) / 2;
    d += ` C${medio},${a[1]} ${medio},${b[1]} ${b[0]},${b[1]}`;
  }
  return d;
}
