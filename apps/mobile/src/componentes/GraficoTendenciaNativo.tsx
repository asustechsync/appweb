import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useId, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

interface Marca {
  posicion: number;
  texto: string;
}

interface PropsGraficoTendenciaNativo {
  titulo: string;
  detalle: string;
  etiquetaActual: string;
  valorActual: string;
  etiquetaPrevia: string;
  valorPrevio: string;
  serie: number[];
  seriePrevia: number[];
  marcas: Marca[];
  formatear: (valor: number) => string;
  suavizado?: boolean;
  nota?: string;
}

const ANCHO = 640;
const ALTO = 205;
const IZQUIERDA = 48;
const DERECHA = 630;
const ARRIBA = 42;
const ABAJO = 160;

/** Grafica nativa con escala, series comparativas y exploración táctil. */
export function GraficoTendenciaNativo({
  titulo,
  detalle,
  etiquetaActual,
  valorActual,
  etiquetaPrevia,
  valorPrevio,
  serie,
  seriePrevia,
  marcas,
  formatear,
  suavizado = true,
  nota,
}: PropsGraficoTendenciaNativo) {
  const idDegradado = `gradiente-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [ancho, setAncho] = useState(0);
  const [indiceTocado, setIndiceTocado] = useState<number | null>(null);
  const largo = Math.max(serie.length, seriePrevia.length);

  if (largo < 2) return null;

  const tope = Math.max(...serie, ...seriePrevia, 1);
  const marcasVerticales = crearMarcasVerticales(tope);
  const maximo = marcasVerticales.at(-1) ?? tope;
  const y = (valor: number) => ABAJO - (valor / maximo) * (ABAJO - ARRIBA);
  const puntos = (valores: number[]) => {
    const dibujables = suavizado ? suavizar(valores) : valores;
    return dibujables.map((valor, indice): [number, number] => [
      IZQUIERDA + (indice / (largo - 1)) * (DERECHA - IZQUIERDA),
      y(valor),
    ]);
  };
  const puntosActuales = puntos(serie);
  const puntosPrevios = puntos(seriePrevia);
  const trazoActual = trazarCurva(puntosActuales);
  const trazoPrevio = trazarCurva(puntosPrevios);
  const primero = puntosActuales[0];
  const ultimo = puntosActuales.at(-1);
  const indice = indiceTocado ?? serie.length - 1;
  const valorEnIndice = serie[indice] ?? serie.at(-1) ?? 0;
  const previoEnIndice = seriePrevia[indice] ?? seriePrevia.at(-1) ?? 0;
  const proporcion = indice / (largo - 1);
  const xActivo = IZQUIERDA + proporcion * (DERECHA - IZQUIERDA);
  const yActivo = y(valorEnIndice);

  function explorar(x: number) {
    if (ancho <= 0) return;
    const fraccion = Math.max(
      0,
      Math.min(1, (x / ancho - IZQUIERDA / ANCHO) / ((DERECHA - IZQUIERDA) / ANCHO)),
    );
    setIndiceTocado(Math.round(fraccion * (largo - 1)));
  }

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View style={estilos.titulos}>
          <Text style={estilos.titulo}>{titulo}</Text>
          <Text style={estilos.detalle}>{detalle}</Text>
          {nota ? <Text style={estilos.nota}>{nota}</Text> : null}
        </View>
      </View>
      <View style={estilos.leyenda}>
        <View style={estilos.cifra}>
          <View style={estilos.rotulo}>
            <View style={estilos.muestraActual} />
            <Text style={estilos.etiqueta}>{etiquetaActual}</Text>
          </View>
          <Text style={estilos.valor}>{valorActual}</Text>
        </View>
        <View style={estilos.cifra}>
          <View style={estilos.rotulo}>
            <View style={estilos.muestraPrevia} />
            <Text style={estilos.etiqueta}>{etiquetaPrevia}</Text>
          </View>
          <Text style={estilos.valorPrevio}>{valorPrevio}</Text>
        </View>
      </View>

      <View
        style={estilos.areaGrafico}
        onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}
        onTouchStart={(evento) => explorar(evento.nativeEvent.locationX)}
        onTouchMove={(evento) => explorar(evento.nativeEvent.locationX)}
        accessibilityLabel={`${titulo}: ${valorActual}, ${etiquetaPrevia}: ${valorPrevio}`}
      >
        <Svg width="100%" height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.color.serieActual} stopOpacity="0.28" />
              <Stop offset="1" stopColor={t.color.serieActual} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {marcasVerticales.map((marca) => (
            <Line
              key={marca}
              x1={IZQUIERDA}
              x2={DERECHA}
              y1={y(marca)}
              y2={y(marca)}
              stroke={t.color.borde}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
          ))}
          {primero && ultimo && puntosActuales.length > 1 ? (
            <Path
              d={`${trazoActual} L${ultimo[0]},${ABAJO} L${primero[0]},${ABAJO} Z`}
              fill={`url(#${idDegradado})`}
            />
          ) : null}
          {puntosPrevios.length > 1 ? (
            <Path
              d={trazoPrevio}
              fill="none"
              stroke={t.color.seriePrevia}
              strokeWidth={2}
              strokeDasharray="6 6"
              opacity={0.75}
            />
          ) : null}
          {puntosActuales.length > 1 ? (
            <Path d={trazoActual} fill="none" stroke={t.color.serieActual} strokeWidth={3} />
          ) : null}
          {indiceTocado !== null ? (
            <Line
              x1={xActivo}
              x2={xActivo}
              y1={ARRIBA}
              y2={ABAJO}
              stroke={t.color.serieActual}
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.55}
            />
          ) : null}
          {ultimo ? (
            <Circle
              cx={indiceTocado === null ? ultimo[0] : xActivo}
              cy={indiceTocado === null ? ultimo[1] : yActivo}
              r={5}
              fill={t.color.serieActual}
              stroke={t.color.fondo}
              strokeWidth={2}
            />
          ) : null}
        </Svg>
        <View pointerEvents="none" style={estilos.etiquetasEjeY}>
          {marcasVerticales.map((marca) => (
            <Text key={marca} style={[estilos.etiquetaEjeY, { top: Math.max(0, y(marca) - 8) }]}>
              {compacto(marca)}
            </Text>
          ))}
        </View>
        <View pointerEvents="none" style={estilos.etiquetasEjeX}>
          {marcas.map((marca) => {
            const posicion = ((IZQUIERDA + marca.posicion * (DERECHA - IZQUIERDA)) / ANCHO) * 100;
            return (
              <Text
                key={`${marca.posicion}-${marca.texto}`}
                style={[
                  estilos.etiquetaEjeX,
                  { left: `${posicion}%` },
                  marca.posicion === 0
                    ? estilos.ejeInicio
                    : marca.posicion === 1
                      ? estilos.ejeFin
                      : estilos.ejeCentro,
                ]}
              >
                {marca.texto}
              </Text>
            );
          })}
        </View>
      </View>
      {indiceTocado !== null ? (
        <View style={estilos.tooltip}>
          <Text style={estilos.tooltipTexto}>
            {etiquetaActual}: {formatear(valorEnIndice)}
          </Text>
          <Text style={estilos.tooltipTexto}>
            {etiquetaPrevia}: {formatear(previoEnIndice)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function compacto(valor: number): string {
  if (valor >= 1000) return `${Math.round(valor / 100) / 10}k`;
  return String(Math.round(valor * 10) / 10);
}

function crearMarcasVerticales(tope: number): number[] {
  const bruto = tope / 3;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fraccion = bruto / potencia;
  const factor =
    fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 2.5 ? 2.5 : fraccion <= 5 ? 5 : 10;
  const paso = factor * potencia;
  const cantidad = Math.max(1, Math.ceil(tope / paso));
  return Array.from({ length: cantidad + 1 }, (_, indice) => indice * paso);
}

function suavizar(valores: number[]): number[] {
  return valores.map((valor, indice) => {
    if (indice === 0 || indice === valores.length - 1) return valor;
    const ventana = valores.slice(Math.max(0, indice - 2), Math.min(valores.length, indice + 3));
    return ventana.reduce((suma, actual) => suma + actual, 0) / ventana.length;
  });
}

function trazarCurva(puntos: [number, number][]): string {
  const primero = puntos[0];
  if (!primero) return "";
  if (puntos.length < 3) {
    return puntos.reduce(
      (trazo, [x, y], indice) => (indice === 0 ? `M${x},${y}` : `${trazo} L${x},${y}`),
      "",
    );
  }

  const secantes = puntos.slice(0, -1).map((punto, indice) => {
    const siguiente = puntos[indice + 1]!;
    return (siguiente[1] - punto[1]) / (siguiente[0] - punto[0]);
  });
  const pendientes = [secantes[0] ?? 0];
  for (let indice = 1; indice < puntos.length - 1; indice++) {
    const antes = secantes[indice - 1] ?? 0;
    const despues = secantes[indice] ?? 0;
    pendientes.push(antes * despues <= 0 ? 0 : (antes + despues) / 2);
  }
  pendientes.push(secantes.at(-1) ?? 0);

  for (let indice = 0; indice < secantes.length; indice++) {
    const secante = secantes[indice] ?? 0;
    if (secante === 0) {
      pendientes[indice] = 0;
      pendientes[indice + 1] = 0;
      continue;
    }
    const a = (pendientes[indice] ?? 0) / secante;
    const b = (pendientes[indice + 1] ?? 0) / secante;
    const suma = a * a + b * b;
    if (suma > 9) {
      const escala = 3 / Math.sqrt(suma);
      pendientes[indice] = escala * a * secante;
      pendientes[indice + 1] = escala * b * secante;
    }
  }

  let trazo = `M${primero[0]},${primero[1]}`;
  for (let indice = 0; indice < puntos.length - 1; indice++) {
    const a = puntos[indice]!;
    const b = puntos[indice + 1]!;
    const tercio = (b[0] - a[0]) / 3;
    trazo += ` C${a[0] + tercio},${a[1] + (pendientes[indice] ?? 0) * tercio} ${b[0] - tercio},${b[1] - (pendientes[indice + 1] ?? 0) * tercio} ${b[0]},${b[1]}`;
  }
  return trazo;
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: t.espacio[4],
    padding: t.espacio[5],
    borderWidth: 1,
    borderColor: t.color.borde,
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
  },
  encabezado: {
    gap: t.espacio[2],
  },
  titulos: {
    gap: t.espacio[1],
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
  detalle: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  nota: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.espacio[4],
  },
  cifra: {
    gap: t.espacio[1],
  },
  rotulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
  },
  muestraActual: {
    width: t.espacio[2],
    height: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.serieActual,
  },
  muestraPrevia: {
    width: t.espacio[2],
    height: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.seriePrevia,
  },
  etiqueta: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  valor: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  valorPrevio: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xl,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
  areaGrafico: {
    height: ALTO,
    position: "relative",
  },
  etiquetasEjeY: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: IZQUIERDA - 5,
  },
  etiquetaEjeY: {
    position: "absolute",
    left: 0,
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.etiqueta,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  etiquetasEjeX: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  etiquetaEjeX: {
    position: "absolute",
    color: t.color.textoMarca,
    fontSize: t.tipo.tamano.etiqueta,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  ejeInicio: {
    transform: [{ translateX: 0 }],
  },
  ejeCentro: {
    transform: [{ translateX: -12 }],
  },
  ejeFin: {
    transform: [{ translateX: -30 }],
  },
  tooltip: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: t.espacio[2],
    padding: t.espacio[2],
    borderRadius: t.radio.sm,
    backgroundColor: t.color.fondoControl,
  },
  tooltipTexto: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
});
