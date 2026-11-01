import { IconoOjo, IconoOjoTachado } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

interface PropsCampoTexto extends Omit<TextInputProps, "style"> {
  etiqueta: string;
  /** Icono a la izquierda, dentro del campo. */
  icono?: ReactNode;
  /** Sin etiqueta visible: el placeholder la reemplaza; el lector de pantalla la sigue leyendo. */
  etiquetaOculta?: boolean;
  /**
   * `bloque`: blanco, sin borde. `formulario`: la estructura del campo de la web (sin
   * borde, esquinas de 8, icono en su propia columna y, en claves, el ojo para verla).
   */
  variante?: "bloque" | "formulario";
}

/** Texto guia: `textoSuave` al 30 % (0x4D de 255), algo mas suave que el de la web. */
const COLOR_PLACEHOLDER = `${t.color.textoSuave}4D`;

/** Campo de texto con su etiqueta encima y, si hace falta, un icono a la izquierda. */
export function CampoTexto({
  etiqueta,
  icono,
  etiquetaOculta = false,
  variante = "bloque",
  secureTextEntry,
  ...props
}: PropsCampoTexto) {
  const [visible, setVisible] = useState(false);
  const formulario = variante === "formulario";
  const conOjo = formulario && secureTextEntry;
  return (
    <View style={estilos.bloque}>
      {etiquetaOculta ? null : <Text style={estilos.etiqueta}>{etiqueta}</Text>}
      <View style={[estilos.caja, formulario && estilos.cajaFormulario]}>
        {icono ? (
          <View style={[estilos.icono, formulario && estilos.iconoFormulario]}>{icono}</View>
        ) : null}
        <TextInput
          accessibilityLabel={etiqueta}
          placeholderTextColor={COLOR_PLACEHOLDER}
          secureTextEntry={secureTextEntry && !visible}
          style={[estilos.campo, formulario && estilos.campoFormulario]}
          {...props}
        />
        {conOjo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            onPress={() => setVisible((v) => !v)}
            style={estilos.ojo}
          >
            {visible ? (
              <IconoOjoTachado tamano={20} color={t.color.textoSuave} />
            ) : (
              <IconoOjo tamano={20} color={t.color.textoSuave} />
            )}
          </Pressable>
        ) : null}
      </View>
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
  caja: {
    flexDirection: "row",
    alignItems: "center",
    height: t.espacio[12] + t.espacio[1],
    paddingHorizontal: t.espacio[4],
    gap: t.espacio[3],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
  },
  cajaFormulario: {
    height: t.espacio[12],
    paddingHorizontal: 0,
    gap: 0,
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoBloque,
  },
  icono: {
    opacity: 0.6,
  },
  iconoFormulario: {
    width: t.espacio[12],
    alignItems: "center",
    justifyContent: "center",
  },
  campo: {
    flex: 1,
    height: "100%",
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
  },
  campoFormulario: {
    fontSize: t.tipo.tamano.base,
  },
  ojo: {
    width: t.espacio[12],
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.65,
  },
});
