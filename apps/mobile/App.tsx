import { MONEDA } from "@appweb/core/formato";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

// Pantalla de prueba: confirma que la app lee los tokens de `@appweb/ui` y
// las funciones de `@appweb/core`. Se reemplaza con la primera pantalla real.
export default function App() {
  return (
    <View style={estilos.pantalla}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Monorepo conectado</Text>
        <Text style={estilos.texto}>Colores y espacios desde @appweb/ui</Text>
        <Text style={estilos.precio}>{MONEDA.format(49.9)}</Text>
        <Text style={estilos.texto}>Precio formateado por @appweb/core</Text>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: t.espacio[4],
    backgroundColor: t.color.neutro[50],
  },
  tarjeta: {
    alignSelf: "stretch",
    gap: t.espacio[2],
    padding: t.espacio[6],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontWeight: "600",
  },
  texto: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  precio: {
    marginTop: t.espacio[2],
    color: t.color.texto,
    fontSize: t.tipo.tamano["3xl"],
    fontWeight: "700",
  },
});
