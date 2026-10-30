import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StyleSheet, Text, View } from "react-native";

interface PropsTarjetaMetrica {
  titulo: string;
  valor: string;
  /** Cambio contra el periodo anterior, en %. Sin el, no se muestra. */
  cambio?: number;
  /** "vs ayer", "vs semana pasada"... */
  contra?: string;
}

/** Cifra grande con su variacion: verde si sube, rojo si baja, gris si no cambia. */
export function TarjetaMetrica({ titulo, valor, cambio, contra }: PropsTarjetaMetrica) {
  const sube = (cambio ?? 0) > 0;
  const baja = (cambio ?? 0) < 0;
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.valor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      {cambio !== undefined ? (
        <Text
          style={[estilos.cambio, sube && estilos.sube, baja && estilos.baja]}
          numberOfLines={1}
        >
          {sube ? "▲" : baja ? "▼" : "•"} {Math.abs(cambio)}%{contra ? ` ${contra}` : ""}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flex: 1,
    gap: t.espacio[1],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  titulo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "500",
  },
  valor: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontWeight: "700",
  },
  cambio: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.etiqueta,
    fontWeight: "500",
  },
  sube: {
    color: t.color.exito,
  },
  baja: {
    color: t.color.ofertaTexto,
  },
});
