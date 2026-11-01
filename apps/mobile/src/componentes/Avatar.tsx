import { FECHA } from "@appweb/core/formato";
import { IconoUsuario } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PropsAvatar {
  /** Nombre de la persona: de el sale la inicial. Sin nombre, el icono de usuario. */
  nombre?: string;
  onPress?: () => void;
}

/**
 * Tarjeta de la cabecera de la portada: cuadro con la inicial, el nombre y la
 * fecha de hoy. Toda la tarjeta lleva a la cuenta.
 */
export function Avatar({ nombre, onPress }: PropsAvatar) {
  const inicial = nombre?.trim().charAt(0).toUpperCase();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mi cuenta"
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}
    >
      <View style={estilos.cuadro}>
        {inicial ? (
          <Text style={estilos.inicial}>{inicial}</Text>
        ) : (
          <IconoUsuario tamano={22} color={t.color.textoSuave} />
        )}
      </View>
      <View style={estilos.textos}>
        <Text style={estilos.nombre} numberOfLines={1}>
          {nombre ?? "Básicos para hoy"}
        </Text>
        <Text style={estilos.fecha} numberOfLines={1}>
          {FECHA.format(new Date())}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
  },
  presionada: {
    transform: [{ scale: 0.97 }],
  },
  cuadro: {
    width: t.espacio[12],
    height: t.espacio[12],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
  },
  inicial: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "700",
  },
  textos: {
    flex: 1,
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "700",
  },
  fecha: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
});
