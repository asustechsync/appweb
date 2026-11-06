import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { IconoOjo, IconoOjoTachado } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { type ReactNode, type Ref, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
} from "react-native";

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
  /** Para enfocarlo desde fuera (el "Siguiente" del teclado en el campo anterior). */
  ref?: Ref<TextInputInstance>;
  /** Mensaje bajo el campo cuando lo escrito no vale. */
  error?: string | null;
}

/** Texto guia: `textoSuave` al 30 % (0x4D de 255), algo mas suave que el de la web. */
const COLOR_PLACEHOLDER = `${t.color.textoSuave}4D`;

/** Campo de texto con su etiqueta encima y, si hace falta, un icono a la izquierda. */
export function CampoTexto({
  etiqueta,
  icono,
  etiquetaOculta = false,
  variante = "bloque",
  error,
  ref,
  secureTextEntry,
  ...props
}: PropsCampoTexto) {
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const formulario = variante === "formulario";
  const conOjo = formulario && secureTextEntry;
  return (
    <View style={estilos.bloque}>
      {etiquetaOculta ? null : <Text style={estilos.etiqueta}>{etiqueta}</Text>}
      <View
        style={[estilos.caja, formulario && estilos.cajaFormulario, enfocado && estilos.enfocado]}
      >
        {icono ? (
          <View style={[estilos.icono, formulario && estilos.iconoFormulario]}>{icono}</View>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={etiqueta}
          placeholderTextColor={COLOR_PLACEHOLDER}
          secureTextEntry={secureTextEntry && !visible}
          style={[estilos.campo, formulario && estilos.campoFormulario]}
          {...props}
          onFocus={(e) => {
            setEnfocado(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            props.onBlur?.(e);
          }}
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
      {error ? <Text style={estilos.error}>{error}</Text> : null}
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
    fontFamily: FUENTE_NATIVA.texto[500],
  },
  caja: {
    flexDirection: "row",
    alignItems: "center",
    height: t.espacio[12] + t.espacio[1],
    paddingHorizontal: t.espacio[4],
    gap: t.espacio[3],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
    boxShadow: t.sombra.difusa,
  },
  cajaFormulario: {
    height: t.espacio[12],
    paddingHorizontal: 0,
    gap: 0,
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoBloque,
  },
  /**
   * Foco con halo, sin borde: el campo activo se distingue sin mover nada. `boxShadow`
   * y no `elevation`: cambiar la elevacion en Android rehace la vista y el campo
   * pierde el foco al tocarlo.
   */
  enfocado: {
    boxShadow: `0 2px 10px ${t.color.acentoMovil}24`,
  },
  error: {
    color: t.color.error,
    fontSize: t.tipo.tamano.xs,
    fontFamily: FUENTE_NATIVA.texto[400],
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
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  campoFormulario: {
    fontSize: t.tipo.tamano.base,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  ojo: {
    width: t.espacio[12],
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.65,
  },
});
