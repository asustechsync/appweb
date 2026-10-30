import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

interface PropsCategorias {
  categorias: { slug: string; nombre: string }[];
  elegida: string | null;
  onElegir: (slug: string | null) => void;
  /** Sin la opcion "Todo" (el catalogo siempre muestra una categoria). */
  sinTodo?: boolean;
}

/** Fila deslizable de categorias: "Todo" y las del panel. La elegida va en negro. */
export function Categorias({ categorias, elegida, onElegir, sinTodo = false }: PropsCategorias) {
  const opciones = sinTodo ? categorias : [{ slug: null, nombre: "Todo" }, ...categorias];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.scroll}
      contentContainerStyle={estilos.fila}
    >
      {opciones.map((categoria) => {
        const activa = categoria.slug === elegida;
        return (
          <Pressable
            key={categoria.slug ?? "todo"}
            accessibilityRole="button"
            accessibilityState={{ selected: activa }}
            onPress={() => onElegir(categoria.slug)}
            style={[estilos.chip, activa && estilos.chipActivo]}
          >
            <Text style={[estilos.texto, activa && estilos.textoActivo]}>{categoria.nombre}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  // Sin esto el ScrollView se estira a lo alto y las burbujas quedan flotando.
  scroll: {
    flexGrow: 0,
  },
  fila: {
    alignItems: "center",
    gap: t.espacio[2],
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[1],
  },
  chip: {
    height: t.espacio[12],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  chipActivo: {
    backgroundColor: t.color.marca[500],
  },
  texto: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  textoActivo: {
    color: t.color.textoInverso,
  },
});
