import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { IconoUsuario } from "@appweb/ui/iconos.nativos";
import { Pressable, StyleSheet, Text } from "react-native";

interface PropsAvatar {
  /** Nombre de la persona: de el sale la inicial. Sin nombre, el icono de usuario. */
  nombre?: string;
  onPress?: () => void;
}

/** Circulo con la inicial de la persona, para la cabecera de la portada. */
export function Avatar({ nombre, onPress }: PropsAvatar) {
  const inicial = nombre?.trim().charAt(0).toUpperCase();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mi cuenta"
      onPress={onPress}
      style={({ pressed }) => [estilos.circulo, pressed && estilos.presionado]}
    >
      {inicial ? (
        <Text style={estilos.inicial}>{inicial}</Text>
      ) : (
        <IconoUsuario tamano={22} color={t.color.textoSuave} />
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    width: t.espacio[12],
    height: t.espacio[12],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoControl,
  },
  presionado: {
    transform: [{ scale: 0.94 }],
  },
  inicial: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "700",
  },
});
