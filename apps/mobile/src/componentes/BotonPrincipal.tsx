import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface PropsBotonPrincipal {
  texto: string;
  onPress: () => void;
  cargando?: boolean;
  /** Radio de las esquinas. Por defecto, pildora. */
  radio?: number;
  /** Colores propios (fondo y texto). Por defecto, el acento de la app. */
  colores?: { fondo: string; texto: string };
  /** Alto propio. Por defecto, el de los campos de la app. */
  alto?: number;
  /** Apagado y sin respuesta al toque (por ejemplo, hasta aceptar los terminos). */
  deshabilitado?: boolean;
}

/** Boton en forma de pildora, a todo el ancho. Mientras carga muestra la rueda. */
export function BotonPrincipal({
  texto,
  onPress,
  cargando = false,
  radio = t.radio.completo,
  colores,
  alto,
  deshabilitado = false,
}: PropsBotonPrincipal) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: cargando }}
      disabled={cargando || deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { borderRadius: radio },
        colores && { backgroundColor: colores.fondo },
        alto ? { height: alto } : null,
        deshabilitado && estilos.apagado,
        pressed && estilos.presionado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colores?.texto ?? t.color.textoInverso} />
      ) : (
        <Text style={[estilos.texto, colores && { color: colores.texto }]}>{texto}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    height: t.espacio[12] + t.espacio[1],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.color.acentoMovil,
  },
  apagado: {
    opacity: 0.5,
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
