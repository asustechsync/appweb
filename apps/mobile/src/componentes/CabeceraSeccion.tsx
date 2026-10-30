import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsCabeceraSeccion {
  titulo: string;
  onVerTodo?: () => void;
}

/** Titulo de una seccion de la portada, con "Ver todo" a la derecha si hay accion. */
export function CabeceraSeccion({ titulo, onVerTodo }: PropsCabeceraSeccion) {
  return (
    <View style={estilos.fila}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {onVerTodo ? (
        <Pressable accessibilityRole="button" onPress={onVerTodo} hitSlop={8}>
          <Text style={estilos.enlace}>Ver todo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: t.espacio[4],
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  enlace: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
});
