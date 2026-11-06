import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsBotonRedondo {
  etiqueta: string;
  children: ReactNode;
  /** Numero sobre el boton (articulos del carrito). Sin el, no hay globo. */
  contador?: number;
  onPress?: () => void;
}

/** Boton cuadrado de esquinas redondeadas, blanco con sombra difusa, para la cabecera. */
export function BotonRedondo({ etiqueta, children, contador, onPress }: PropsBotonRedondo) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}
    >
      {children}
      {contador ? (
        <View style={estilos.globo}>
          <Text style={estilos.numero}>{contador}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: t.espacio[12],
    height: t.espacio[12],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
    boxShadow: t.sombra.difusa,
  },
  presionado: {
    transform: [{ scale: 0.94 }],
  },
  globo: {
    position: "absolute",
    top: -t.espacio[1],
    right: -t.espacio[1],
    minWidth: t.espacio[5],
    height: t.espacio[5],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.espacio[1],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.acentoMovil,
  },
  numero: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.mini,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
});
