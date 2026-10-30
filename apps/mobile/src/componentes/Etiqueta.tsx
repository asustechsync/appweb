import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StyleSheet, Text } from "react-native";

export type TonoEtiqueta = "exito" | "alerta" | "error" | "neutro";

const COLORES: Record<TonoEtiqueta, { fondo: string; texto: string }> = {
  exito: { fondo: t.color.acento, texto: t.color.acentoTexto },
  alerta: { fondo: t.color.tendenciaFondo, texto: t.color.tendenciaTexto },
  error: { fondo: t.color.ofertaFondo, texto: t.color.ofertaTexto },
  neutro: { fondo: t.color.fondoSutil, texto: t.color.textoSuave },
};

/** Etiqueta pastel en mayusculas, radio pequeño: estados de pedido y reseña. */
export function Etiqueta({ texto, tono }: { texto: string; tono: TonoEtiqueta }) {
  const colores = COLORES[tono];
  return (
    <Text style={[estilos.etiqueta, { backgroundColor: colores.fondo, color: colores.texto }]}>
      {texto.toUpperCase()}
    </Text>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    alignSelf: "flex-start",
    paddingHorizontal: t.espacio[2],
    paddingVertical: 2,
    borderRadius: t.radio.sm,
    overflow: "hidden",
    fontSize: t.tipo.tamano.mini,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
