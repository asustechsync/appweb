import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsSelector {
  titulo: string;
  opciones: string[];
  elegida: string | null;
  onElegir: (opcion: string) => void;
}

/** Fila de opciones (tallas o colores). La elegida va en negro; el resto, blanco con sombra. */
export function Selector({ titulo, opciones, elegida, onElegir }: PropsSelector) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <View style={estilos.fila}>
        {opciones.map((opcion) => {
          const activa = opcion === elegida;
          return (
            <Pressable
              key={opcion}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              onPress={() => onElegir(opcion)}
              style={[estilos.opcion, activa && estilos.opcionActiva]}
            >
              <Text style={[estilos.texto, activa && estilos.textoActivo]}>{opcion}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: t.espacio[2],
  },
  titulo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "500",
  },
  fila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.espacio[2],
  },
  opcion: {
    minWidth: t.espacio[12],
    height: t.espacio[10],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.espacio[3],
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  opcionActiva: {
    backgroundColor: t.color.marca[500],
  },
  texto: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  textoActivo: {
    color: t.color.textoInverso,
  },
});
