import { IconoBuscar, IconoOpciones } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface PropsBuscador {
  valor: string;
  onCambiar: (texto: string) => void;
  onFiltros?: () => void;
}

/** Buscador blanco, sin borde y con sombra difusa; el boton de filtros va aparte, a su derecha. */
export function Buscador({ valor, onCambiar, onFiltros }: PropsBuscador) {
  return (
    <View style={estilos.fila}>
      <View style={[estilos.caja, estilos.campoCaja]}>
        <IconoBuscar tamano={20} color={t.color.textoTenue} />
        <TextInput
          value={valor}
          onChangeText={onCambiar}
          placeholder="¿Qué estás buscando?"
          placeholderTextColor={t.color.textoTenue}
          returnKeyType="search"
          style={estilos.campo}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filtros"
        onPress={onFiltros}
        style={({ pressed }) => [estilos.caja, estilos.filtros, pressed && estilos.presionado]}
      >
        <IconoOpciones tamano={20} color={t.color.texto} />
      </Pressable>
    </View>
  );
}

const ALTO = t.espacio[12];

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
  },
  caja: {
    height: ALTO,
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.lg,
  },
  campoCaja: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    paddingHorizontal: t.espacio[4],
  },
  campo: {
    flex: 1,
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
  },
  filtros: {
    width: ALTO,
    alignItems: "center",
    justifyContent: "center",
  },
  presionado: {
    transform: [{ scale: 0.94 }],
  },
});
