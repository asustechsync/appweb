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
 * Curva suave que pasa exactamente por cada punto (cubica monotona): redondea
 * picos y caidas sin cambiar ningun valor, y entre dos puntos nunca se pasa
 * de largo, asi que no baja de cero ni sube mas que el dato. Un punto maximo
 * o minimo local queda plano, sin rebote.
 */
export function trazo(puntos: [number, number][]): string {
  const n = puntos.length;
  const [primero] = puntos;
  if (!primero) return "";
  if (n < 3) {
    return puntos.reduce((d, [x, y], i) => (i === 0 ? `M${x},${y}` : `${d} L${x},${y}`), "");
  }

  const dx: number[] = [];
  const secante: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = puntos[i] as [number, number];
    const b = puntos[i + 1] as [number, number];
    dx.push(b[0] - a[0]);
    secante.push(dx[i] === 0 ? 0 : (b[1] - a[1]) / (dx[i] as number));
  }

  // Pendiente en cada punto: el promedio de las dos secantes vecinas, y plana
  // si cambia de direccion (un pico o un valle).
  const pendiente: number[] = [secante[0] as number];
  for (let i = 1; i < n - 1; i++) {
    const antes = secante[i - 1] as number;
    const despues = secante[i] as number;
    pendiente.push(antes * despues <= 0 ? 0 : (antes + despues) / 2);
  }
  pendiente.push(secante[n - 2] as number);

  // Fritsch-Carlson: limita la pendiente para que la curva no rebase el dato.
  for (let i = 0; i < n - 1; i++) {
    const m = secante[i] as number;
    if (m === 0) {
      pendiente[i] = 0;
      pendiente[i + 1] = 0;
      continue;
    }
    const a = (pendiente[i] as number) / m;
    const b = (pendiente[i + 1] as number) / m;
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      pendiente[i] = t * a * m;
      pendiente[i + 1] = t * b * m;
    }
  }

  let d = `M${primero[0]},${primero[1]}`;
  for (let i = 0; i < n - 1; i++) {
    const a = puntos[i] as [number, number];
    const b = puntos[i + 1] as [number, number];
    const k = (dx[i] as number) / 3;
    d += ` C${a[0] + k},${a[1] + (pendiente[i] as number) * k} ${b[0] - k},${b[1] - (pendiente[i + 1] as number) * k} ${b[0]},${b[1]}`;
  }
  return d;
}
