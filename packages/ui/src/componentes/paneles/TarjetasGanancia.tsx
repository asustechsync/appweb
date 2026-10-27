import { variacion } from "@appweb/core";

import "./tarjetas-ganancia.css";

/** Las cuatro cifras de un periodo. */
export interface CifrasGanancia {
  /** Lo que queda: lo vendido menos el costo. */
  ganancia: number;
  /** Lo que costo la mercaderia vendida. */
  costo: number;
  /** Lo que se dejo de cobrar por cupones y niveles. */
  descuentos: number;
  /** Ganancia sobre lo cobrado, de 0 a 100. */
  margen: number;
}

export interface PropsTarjetasGanancia {
  /** El periodo que se mira. */
  actual: CifrasGanancia;
  /** El periodo anterior entero: el cambio de cada tarjeta y su valor al pie. */
  previo?: CifrasGanancia;
  /** Como se llama el periodo anterior, al pie: "Ayer", "Mes pasado". */
  etiquetaPrevia?: string;
  /** Un monto como lo lee la persona: "S/ 75.08". */
  formatear: (valor: number) => string;
  /** Aviso suave al pie: "Solo el 80% de lo vendido tiene costo". */
  nota?: string;
}

type Tono = "ganancia" | "perdida" | "costo" | "margen" | "descuento";
/** Si subir es bueno (ganancia), malo (descuentos) o ni lo uno ni lo otro (costo). */
type Sentido = "bueno" | "malo" | "neutro";

interface Tarjeta {
  clave: string;
  etiqueta: string;
  valor: string;
  /** Largo de la barra, de 0 a 100. */
  parte: number;
  tono: Tono;
  /** El cambio contra el periodo anterior, ya formateado: "+12%", "+3.1 pts". */
  cambio?: { texto: string; color: "exito" | "error" | "neutro" };
  /** Pie: "Ayer S/ 62.68", o la parte del precio si no hay anterior. */
  pie: string;
}

/** Color del cambio: verde si mejora, rojo si empeora, gris si no importa o no cambio. */
function colorDeCambio(diferencia: number, sentido: Sentido): "exito" | "error" | "neutro" {
  if (diferencia === 0 || sentido === "neutro") return "neutro";
  const sube = diferencia > 0;
  return (sentido === "bueno") === sube ? "exito" : "error";
}

/** "+12%" o "−8%": el signo siempre, para que se lea como cambio. */
function porcentaje(actual: number, anterior: number): string {
  const v = variacion(actual, anterior);
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;
}

/**
 * Rentabilidad del periodo en cuatro tarjetas iguales: cada una con su cifra,
 * el cambio contra el periodo anterior, una barra con su parte del precio de
 * lista (el margen mide contra lo cobrado) y, al pie, el valor anterior.
 */
export function TarjetasGanancia({
  actual,
  previo,
  etiquetaPrevia = "Antes",
  formatear,
  nota,
}: PropsTarjetasGanancia) {
  const { ganancia, costo, descuentos, margen } = actual;
  const lista = Math.max(0, ganancia) + Math.max(0, costo) + Math.max(0, descuentos);
  const parte = (monto: number) => (lista > 0 ? Math.round((Math.max(0, monto) / lista) * 100) : 0);
  const perdida = ganancia < 0;
  const descontado = (monto: number) => (monto > 0 ? `−${formatear(monto)}` : formatear(0));

  const tarjeta = (
    base: Omit<Tarjeta, "cambio" | "pie">,
    valorActual: number,
    valorPrevio: number | undefined,
    sentido: Sentido,
    formato: { cambio: (a: number, p: number) => string; previo: (p: number) => string },
  ): Tarjeta => ({
    ...base,
    ...(valorPrevio === undefined
      ? {}
      : {
          cambio: {
            texto: formato.cambio(valorActual, valorPrevio),
            color: colorDeCambio(valorActual - valorPrevio, sentido),
          },
        }),
    pie:
      valorPrevio === undefined
        ? `${base.parte}% del precio`
        : `${etiquetaPrevia} ${formato.previo(valorPrevio)}`,
  });

  const enSoles = { cambio: porcentaje, previo: formatear };
  const tarjetas: Tarjeta[] = [
    tarjeta(
      {
        clave: "ganancia",
        etiqueta: perdida ? "Pérdida" : "Ganancia",
        valor: formatear(ganancia),
        parte: parte(ganancia),
        tono: perdida ? "perdida" : "ganancia",
      },
      ganancia,
      previo?.ganancia,
      "bueno",
      enSoles,
    ),
    tarjeta(
      {
        clave: "costo",
        etiqueta: "Costo",
        valor: formatear(costo),
        parte: parte(costo),
        tono: "costo",
      },
      costo,
      previo?.costo,
      "neutro",
      enSoles,
    ),
    tarjeta(
      {
        clave: "margen",
        etiqueta: "Margen",
        valor: `${margen}%`,
        parte: Math.max(0, Math.min(100, Math.round(margen))),
        tono: "margen",
      },
      margen,
      previo?.margen,
      "bueno",
      {
        // El margen ya es un porcentaje: su cambio se cuenta en puntos.
        cambio: (a, p) => {
          const puntos = Math.round((a - p) * 10) / 10;
          return `${puntos > 0 ? "+" : puntos < 0 ? "−" : ""}${Math.abs(puntos)} pts`;
        },
        previo: (p) => `${p}%`,
      },
    ),
    tarjeta(
      {
        clave: "descuentos",
        etiqueta: "Descuentos",
        valor: descontado(descuentos),
        parte: parte(descuentos),
        tono: "descuento",
      },
      descuentos,
      previo?.descuentos,
      "malo",
      { cambio: porcentaje, previo: descontado },
    ),
  ];

  return (
    <section className="ui-tarjetas-ganancia" aria-label="Rentabilidad del periodo">
      <dl className="ui-tarjetas-ganancia__rejilla">
        {tarjetas.map((t) => (
          <div
            key={t.clave}
            className={`ui-tarjetas-ganancia__tarjeta ui-tarjetas-ganancia__tarjeta--${t.tono}`}
          >
            <dt>{t.etiqueta}</dt>
            <dd className="ui-tarjetas-ganancia__valor">{t.valor}</dd>
            <dd className="ui-tarjetas-ganancia__pista" aria-hidden="true">
              <span className="ui-tarjetas-ganancia__barra" style={{ inlineSize: `${t.parte}%` }} />
            </dd>
            <dd className="ui-tarjetas-ganancia__pie">
              <span className="ui-tarjetas-ganancia__detalle">{t.pie}</span>
              {t.cambio ? (
                <span
                  className={`ui-tarjetas-ganancia__cambio ui-tarjetas-ganancia__cambio--${t.cambio.color}`}
                >
                  {t.cambio.texto}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      {nota ? <p className="ui-tarjetas-ganancia__nota">{nota}</p> : null}
    </section>
  );
}
