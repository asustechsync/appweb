import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

interface PropsCampoTexto extends Omit<TextInputProps, "style"> {
  etiqueta: string;
}

/** Campo blanco, sin borde y con sombra difusa, con su etiqueta encima. */
export function CampoTexto({ etiqueta, ...props }: PropsCampoTexto) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput placeholderTextColor={t.color.textoTenue} style={estilos.campo} {...props} />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: t.espacio[2],
  },
  etiqueta: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "500",
  },
  campo: {
    height: t.espacio[12] + t.espacio[1],
    paddingHorizontal: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
  },
});
