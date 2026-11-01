import { tokensNativos as t } from "@appweb/ui/tokens.native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsCasilla {
  /** Texto de la casilla; puede llevar enlaces dentro. */
  etiqueta: ReactNode;
  marcada: boolean;
  onCambio: (marcada: boolean) => void;
}

/** Casilla cuadrada con su texto al lado. Tocar la casilla o el texto la marca. */
export function Casilla({ etiqueta, marcada, onCambio }: PropsCasilla) {
  return (
    <View style={estilos.fila}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcada }}
        hitSlop={8}
        onPress={() => onCambio(!marcada)}
        style={[estilos.caja, marcada && estilos.cajaMarcada]}
      >
        {marcada ? <Text style={estilos.check}>✓</Text> : null}
      </Pressable>
      <Text style={estilos.texto} onPress={() => onCambio(!marcada)}>
        {etiqueta}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
  },
  caja: {
    width: t.espacio[5],
    height: t.espacio[5],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.sm,
    backgroundColor: t.color.fondoBloque,
  },
  cajaMarcada: {
    backgroundColor: t.color.acentoMovil,
  },
  check: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "700",
  },
  texto: {
    flex: 1,
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
});
