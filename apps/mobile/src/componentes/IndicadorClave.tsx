import { IconoMarcarCirculo, IconoMarcarCirculoRelleno } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { StyleSheet, Text, View } from "react-native";

type Requisito = { id: string; texto: string; obligatorio: boolean; cumplido: boolean };

interface PropsIndicadorClave {
  requisitos: Requisito[];
  /** Sin nada escrito no se pinta nada, para no dejar un hueco en el formulario. */
  vacia?: boolean;
}

/** Cada requisito en una sola palabra, para que quepan dos por fila. */
const PALABRA: Record<string, string> = {
  mayuscula: "Mayúscula",
  numero: "Número",
  largo: "Largo",
  extra: "Símbolo",
};

/**
 * Requisitos de la clave siempre en dos columnas, una palabra cada uno: un
 * check gris claro si falta y uno verde relleno si se cumple. Solo aparece al
 * escribir.
 */
export function IndicadorClave({ requisitos, vacia = false }: PropsIndicadorClave) {
  if (vacia) return null;

  return (
    <View style={estilos.bloque} accessibilityLiveRegion="polite">
      <View style={estilos.lista}>
        {requisitos.map((r) => (
          <View
            key={r.id}
            accessibilityLabel={`${r.texto}: ${r.cumplido ? "cumplido" : "falta"}`}
            style={estilos.fila}
          >
            {r.cumplido ? (
              <IconoMarcarCirculoRelleno tamano={t.espacio[4]} color={t.color.claveMuyFuerte} />
            ) : (
              <IconoMarcarCirculo tamano={t.espacio[4]} color={t.color.textoMarca} />
            )}
            <Text style={[estilos.texto, r.cumplido && estilos.textoCumplido]}>
              {PALABRA[r.id] ?? r.texto}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: t.espacio[2],
  },
  lista: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: t.espacio[2],
  },
  fila: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
  },
  texto: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  textoCumplido: {
    color: t.color.texto,
  },
});
