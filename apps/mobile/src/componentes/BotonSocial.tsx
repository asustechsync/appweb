import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface PropsBotonSocial {
  texto: string;
  icono: ReactNode;
  onPress?: () => void;
}

/**
 * Boton para entrar con otra cuenta (Google, Apple), con la forma del secundario de la
 * web (esquinas de 8) y el estilo de la app: bloque blanco, sin borde. Como alla, sin proveedor conectado
 * todavia no hace nada.
 */
export function BotonSocial({ texto, icono, onPress }: PropsBotonSocial) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}
    >
      {icono}
      <Text style={estilos.texto}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    flex: 1,
    height: t.espacio[12],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.espacio[2],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
    boxShadow: t.sombra.difusa,
  },
  presionado: {
    transform: [{ scale: 0.98 }],
  },
  texto: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.base,
    fontFamily: FUENTE_NATIVA.texto[500],
  },
});
