import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface PropsBotonPrincipal {
  texto: string;
  onPress: () => void;
  cargando?: boolean;
}

/** Boton negro en forma de pildora, a todo el ancho. Mientras carga muestra la rueda. */
export function BotonPrincipal({ texto, onPress, cargando = false }: PropsBotonPrincipal) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: cargando }}
      disabled={cargando}
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}
    >
      {cargando ? (
        <ActivityIndicator color={t.color.textoInverso} />
      ) : (
        <Text style={estilos.texto}>{texto}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    height: t.espacio[12] + t.espacio[1],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
    backgroundColor: t.color.marca[500],
  },
  presionado: {
    transform: [{ scale: 0.98 }],
  },
  texto: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
  },
});
