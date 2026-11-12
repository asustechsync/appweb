import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { IconoMarcar, IconoTendenciaAlza, IconoTendenciaBaja } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsTarjetaMetrica {
  titulo: string;
  valor: string;
  /** Cambio contra el periodo anterior, en %. Sin el, no se muestra. */
  cambio?: number;
  /** Etiqueta del periodo anterior, por ejemplo "ayer" o "semana pasada". */
  contra?: string;
  /** Valor de la misma metrica en el periodo anterior. */
  anterior?: string;
  seleccionada: boolean;
  onSeleccionar: () => void;
}

/** Cifra grande con su variacion: verde si sube, rojo si baja, gris si no cambia. */
export function TarjetaMetrica({
  titulo,
  valor,
  cambio,
  contra,
  anterior,
  seleccionada,
  onSeleccionar,
}: PropsTarjetaMetrica) {
  const sube = (cambio ?? 0) > 0;
  const baja = (cambio ?? 0) < 0;
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: seleccionada }}
          accessibilityLabel={`Ver ${titulo} en la gráfica`}
          onPress={onSeleccionar}
          hitSlop={8}
          style={[estilos.casilla, seleccionada && estilos.casillaActiva]}
        >
          {seleccionada ? <IconoMarcar tamano={14} color={t.color.fondo} /> : null}
        </Pressable>
      </View>
      <Text style={estilos.valor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      {cambio !== undefined || contra || anterior ? (
        <View style={estilos.pie}>
          {cambio !== undefined ? (
            <View style={estilos.variacion}>
              {cambio !== 0 ? (
                sube ? (
                  <IconoTendenciaAlza tamano={16} color={t.color.exito} />
                ) : (
                  <IconoTendenciaBaja tamano={16} color={t.color.error} />
                )
              ) : null}
              <Text style={[estilos.cambio, sube && estilos.sube, baja && estilos.baja]}>
                {cambio > 0 ? "+" : cambio < 0 ? "−" : ""}
                {Math.abs(cambio)}%
              </Text>
            </View>
          ) : null}
          {contra || anterior ? (
            <Text style={estilos.comparacion} numberOfLines={1}>
              {contra ? `vs ${contra}` : "Periodo anterior"}
              {anterior ? <Text style={estilos.valorAnterior}> {anterior}</Text> : null}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
    borderWidth: 1,
    borderColor: t.color.borde,
    minHeight: 132,
    justifyContent: "space-between",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.espacio[2],
  },
  casilla: {
    width: t.espacio[5],
    height: t.espacio[5],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.color.bordeFuerte,
    borderRadius: t.radio.sm,
  },
  casillaActiva: {
    borderColor: t.color.info,
    backgroundColor: t.color.info,
  },
  titulo: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  valor: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  cambio: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.etiqueta,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  sube: {
    color: t.color.exito,
  },
  baja: {
    color: t.color.error,
  },
  comparacion: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  pie: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: t.espacio[1],
  },
  variacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[1],
  },
  valorAnterior: {
    fontFamily: FUENTE_NATIVA.texto[500],
  },
});
