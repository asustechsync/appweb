import { evaluarClave } from "@appweb/core/clave";
import { esquemaNuevaClave } from "@appweb/core/tipos";
import {
  IconoCandado,
  IconoCerrarCirculo,
  IconoFlechaIzquierda,
  IconoMarcarCirculo,
} from "@appweb/ui/iconos.nativos";
import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { SIMBOLO_LOGO } from "@appweb/ui/marca";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  type TextInputInstance,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { api } from "./api";
import { Aparecer } from "./componentes/Aparecer";
import { BotonPrincipal } from "./componentes/BotonPrincipal";
import { BotonRedondo } from "./componentes/BotonRedondo";
import { CampoTexto } from "./componentes/CampoTexto";
import { IndicadorClave } from "./componentes/IndicadorClave";

interface PropsNuevaClave {
  /** El token del enlace del correo. */
  token: string;
  onVolver: () => void;
  /** Tras guardar: lleva al ingreso para entrar con la clave nueva. */
  onIngresar: () => void;
}

/**
 * Destino del enlace de recuperacion cuando se abre en la app. Mismas reglas
 * que la pagina de la web: las decide @appweb/api/acceso.
 */
export function NuevaClave({ token, onVolver, onIngresar }: PropsNuevaClave) {
  const margenes = useSafeAreaInsets();
  // Margen de arriba proporcional al alto de la pantalla: centrar del todo haria
  // saltar el logo al cambiar de modo, y uno fijo quedaba pegado arriba.
  const { height: alto } = useWindowDimensions();
  // Nunca menos que lo que ocupa Volver arriba, para que no tape el logo.
  const margenSuperior = Math.max(
    t.espacio[4] + t.espacio[12] + t.espacio[3],
    Math.round(alto * 0.1),
  );
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [errorRepetida, setErrorRepetida] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [lista, setLista] = useState(false);
  const campoRepetida = useRef<TextInputInstance>(null);

  async function guardar() {
    setError(null);
    const analizado = esquemaNuevaClave.safeParse({ token, clave });
    const fallaClave = analizado.success
      ? null
      : (analizado.error.issues.find((i) => i.path[0] === "clave")?.message ?? null);
    const fallaRepetida = clave === repetida ? null : "Las dos contraseñas no coinciden";
    setErrorClave(fallaClave);
    setErrorRepetida(fallaRepetida);
    if (fallaClave || fallaRepetida) return;
    if (!analizado.success) {
      setError(analizado.error.issues[0]?.message ?? "El enlace no es válido");
      return;
    }

    setGuardando(true);
    try {
      await api.acceso.restablecer.mutate({ token, clave });
      setLista(true);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior="padding">
      <ScrollView
        contentContainerStyle={[
          estilos.contenido,
          { paddingTop: margenSuperior, paddingBottom: t.espacio[4] + margenes.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.volver}>
          <BotonRedondo etiqueta="Volver" onPress={onVolver}>
            <IconoFlechaIzquierda tamano={20} color={t.color.texto} />
          </BotonRedondo>
        </View>
        <View style={estilos.columna}>
          <View style={estilos.cabecera}>
            <Svg width={t.espacio[12]} height={t.espacio[12]} viewBox={SIMBOLO_LOGO.viewBox}>
              <Path fill={t.color.textoLogo} fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
            </Svg>
          </View>

          <Aparecer orden={0} disparador={lista}>
            <Text style={estilos.titulo}>
              {lista ? "Contraseña lista" : "Elige tu nueva contraseña"}
            </Text>
          </Aparecer>

          {lista ? (
            <>
              <Aparecer orden={1} disparador={lista}>
                <View style={[estilos.mensaje, estilos.exito]}>
                  <IconoMarcarCirculo tamano={18} color={t.color.acentoTexto} />
                  <Text style={[estilos.textoMensaje, estilos.textoExito]}>
                    Tu contraseña cambió. Ya puedes ingresar con la nueva.
                  </Text>
                </View>
              </Aparecer>
              <Aparecer orden={2} disparador={lista}>
                <BotonPrincipal
                  texto="Ingresar"
                  onPress={onIngresar}
                  radio={t.radio.lg}
                  alto={t.espacio[12]}
                />
              </Aparecer>
            </>
          ) : (
            <>
              {error ? (
                <Aparecer orden={0} disparador={error}>
                  <View style={[estilos.mensaje, estilos.fallo]}>
                    <IconoCerrarCirculo tamano={18} color={t.color.ofertaTexto} />
                    <Text style={[estilos.textoMensaje, estilos.textoFallo]}>{error}</Text>
                  </View>
                </Aparecer>
              ) : null}
              <View style={estilos.campos}>
                <Aparecer orden={1} disparador={lista}>
                  <CampoTexto
                    etiqueta="Contraseña nueva"
                    etiquetaOculta
                    variante="formulario"
                    icono={<IconoCandado tamano={20} color={t.color.textoSuave} />}
                    value={clave}
                    onChangeText={(texto) => {
                      setClave(texto);
                      setErrorClave(null);
                    }}
                    error={errorClave}
                    placeholder="Contraseña nueva"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoRepetida.current?.focus()}
                  />
                </Aparecer>
                <Aparecer orden={2} disparador={lista}>
                  <IndicadorClave requisitos={evaluarClave(clave)} vacia={clave === ""} />
                </Aparecer>
                <Aparecer orden={3} disparador={lista}>
                  <CampoTexto
                    ref={campoRepetida}
                    etiqueta="Repite la contraseña"
                    etiquetaOculta
                    variante="formulario"
                    icono={<IconoCandado tamano={20} color={t.color.textoSuave} />}
                    value={repetida}
                    onChangeText={(texto) => {
                      setRepetida(texto);
                      setErrorRepetida(null);
                    }}
                    error={errorRepetida}
                    placeholder="Repite la contraseña"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={guardar}
                  />
                </Aparecer>
              </View>
              <Aparecer orden={4} disparador={lista}>
                <BotonPrincipal
                  texto="Guardar contraseña"
                  onPress={guardar}
                  cargando={guardando}
                  radio={t.radio.lg}
                  alto={t.espacio[12]}
                />
              </Aparecer>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    alignItems: "center",
    padding: t.espacio[4],
  },
  columna: {
    width: "100%",
    maxWidth: 416,
    gap: t.espacio[5],
  },
  cabecera: {
    alignItems: "center",
  },
  // Volver se queda arriba a la izquierda, fuera de la columna: asi no empuja
  // el logo ni el formulario, que bajan con el margen proporcional.
  volver: {
    position: "absolute",
    top: t.espacio[4],
    left: t.espacio[4],
    zIndex: 1,
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontFamily: FUENTE_NATIVA.texto[700],
    textAlign: "center",
  },
  campos: {
    gap: t.espacio[4],
  },
  mensaje: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: t.espacio[2],
    padding: t.espacio[3],
    borderRadius: t.radio.lg,
  },
  textoMensaje: {
    flex: 1,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
  },
  fallo: {
    backgroundColor: t.color.ofertaFondo,
  },
  textoFallo: {
    color: t.color.ofertaTexto,
  },
  exito: {
    backgroundColor: t.color.acento,
  },
  textoExito: {
    color: t.color.acentoTexto,
  },
});
