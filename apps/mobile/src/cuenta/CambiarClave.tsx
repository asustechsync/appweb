import { evaluarClave } from "@appweb/core/clave";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { BotonPrincipal } from "../componentes/BotonPrincipal";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { CampoTexto } from "../componentes/CampoTexto";

/** Cambio de contraseña: pide la actual y la nueva, con sus requisitos en vivo. */
export function CambiarClave({ onVolver }: { onVolver: () => void }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await api.cuenta.cambiarClave.mutate({ claveActual: actual, claveNueva: nueva });
      Alert.alert("Listo", "Tu contraseña cambió.", [{ text: "OK", onPress: onVolver }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Contraseña" onVolver={onVolver} />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <CampoTexto
          etiqueta="Contraseña actual"
          value={actual}
          onChangeText={setActual}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />
        <CampoTexto
          etiqueta="Contraseña nueva"
          value={nueva}
          onChangeText={setNueva}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <View style={estilos.requisitos}>
          {evaluarClave(nueva)
            .filter((r) => r.obligatorio)
            .map((r) => (
              <Text key={r.id} style={[estilos.requisito, r.cumplido && estilos.cumplido]}>
                {r.cumplido ? "✓" : "·"} {r.texto}
              </Text>
            ))}
        </View>
        {error ? <Text style={estilos.error}>{error}</Text> : null}
        <BotonPrincipal texto="Cambiar contraseña" onPress={guardar} cargando={guardando} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    gap: t.espacio[4],
    padding: t.espacio[4],
  },
  requisitos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.espacio[3],
    marginTop: -t.espacio[2],
  },
  requisito: {
    color: t.color.textoTenue,
    fontSize: t.tipo.tamano.xs,
  },
  cumplido: {
    color: t.color.exito,
  },
  error: {
    padding: t.espacio[3],
    borderRadius: t.radio.md,
    overflow: "hidden",
    backgroundColor: t.color.ofertaFondo,
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.sm,
  },
});
