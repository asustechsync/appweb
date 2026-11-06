import { evaluarClave } from "@appweb/core/clave";
import { esquemaAutorregistro, esquemaIngreso, esquemaRecuperacion } from "@appweb/core/tipos";
import {
  IconoApple,
  IconoCandado,
  IconoCerrarCirculo,
  IconoCorreo,
  IconoFlechaIzquierda,
  IconoGoogle,
  IconoMarcarCirculo,
  IconoTelefono,
} from "@appweb/ui/iconos.nativos";
import { FUENTE_NATIVA } from "@appweb/ui/fuentes.nativas";
import { SIMBOLO_LOGO } from "@appweb/ui/marca";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  type TextInputInstance,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { api, urlDeTienda } from "./api";
import { Aparecer } from "./componentes/Aparecer";
import { BotonPrincipal } from "./componentes/BotonPrincipal";
import { BotonRedondo } from "./componentes/BotonRedondo";
import { BotonSocial } from "./componentes/BotonSocial";
import { Casilla } from "./componentes/Casilla";
import { IndicadorClave } from "./componentes/IndicadorClave";
import { CampoTexto } from "./componentes/CampoTexto";
import { SelectorPais } from "./componentes/SelectorPais";
import { useSesion } from "./estado-sesion";

type Modo = "ingresar" | "registro" | "recuperar";

const TEXTOS: Record<Modo, { titulo: string; detalle: string; boton: string }> = {
  ingresar: {
    titulo: "Bienvenido",
    detalle: "",
    boton: "Ingresar",
  },
  registro: {
    titulo: "Únete",
    detalle: "",
    boton: "Crear cuenta",
  },
  recuperar: {
    titulo: "¿Olvidaste tu contraseña?",
    detalle: "Te enviamos un enlace a tu correo para crear una nueva.",
    boton: "Enviar enlace",
  },
};

/** Segundos antes de poder pedir otro enlace de recuperacion. */
const ESPERA_REENVIO = 30;

type Campo = "email" | "clave" | "telefono";

/**
 * Revisa lo escrito con los mismos esquemas que usa el servidor, antes de
 * enviarlo: el error sale al instante bajo su campo y no tras la espera.
 */
function erroresDe(modo: Modo, datos: Record<Campo, string>): Partial<Record<Campo, string>> {
  const esquema =
    modo === "ingresar"
      ? esquemaIngreso
      : modo === "registro"
        ? esquemaAutorregistro
        : esquemaRecuperacion;
  const resultado = esquema.safeParse(datos);
  if (resultado.success) return {};
  const errores: Partial<Record<Campo, string>> = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as Campo;
    errores[campo] ??= problema.message;
  }
  return errores;
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar. Inténtalo de nuevo.";
}

/**
 * Ingresar, crear cuenta y recuperar la contraseña en una sola pantalla que
 * cambia de modo. Las reglas (intentos, requisitos de clave, mensajes) son las
 * de @appweb/api/acceso: las mismas que la web.
 */
export function Acceso({ onVolver }: { onVolver?: () => void }) {
  const { abrir } = useSesion();
  const margenes = useSafeAreaInsets();
  // Margen de arriba proporcional al alto de la pantalla: centrar del todo haria
  // saltar el logo al cambiar de modo, y uno fijo quedaba pegado arriba.
  const { height: alto } = useWindowDimensions();
  // Nunca menos que lo que ocupa Volver arriba, para que no tape el logo.
  const margenSuperior = Math.max(
    t.espacio[4] + t.espacio[12] + t.espacio[3],
    Math.round(alto * 0.1),
  );
  const [modo, setModo] = useState<Modo>("ingresar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("pe");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [espera, setEspera] = useState(0);
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const campoClave = useRef<TextInputInstance>(null);
  const campoTelefono = useRef<TextInputInstance>(null);

  // Cuenta atras tras enviar el enlace: evita pedir varios seguidos.
  useEffect(() => {
    if (espera <= 0) return;
    const reloj = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(reloj);
  }, [espera]);

  function cambiarModo(siguiente: Modo) {
    setModo(siguiente);
    setErrores({});
    setError(null);
    setAviso(null);
  }

  /** Escribir en un campo borra su error: no se queda en rojo mientras se corrige. */
  function escribir(campo: Campo, valor: string, guardar: (v: string) => void) {
    guardar(valor);
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }));
  }

  async function enviar() {
    setError(null);
    setAviso(null);
    const encontrados = erroresDe(modo, { email, clave, telefono });
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setCargando(true);
    try {
      if (modo === "ingresar") {
        await abrir(await api.acceso.ingresar.mutate({ email, clave }));
      } else if (modo === "registro") {
        await abrir(await api.acceso.registrar.mutate({ email, clave, telefono }));
      } else {
        await api.acceso.recuperar.mutate({ email });
        setAviso("Si el correo tiene una cuenta, te llegará el enlace en unos minutos.");
        setEspera(ESPERA_REENVIO);
      }
    } catch (fallo) {
      setError(mensajeDe(fallo));
    } finally {
      setCargando(false);
    }
  }

  const textos = TEXTOS[modo];

  // Al cambiar de modo, cada bloque visible entra un poco despues del anterior.
  let paso = 0;
  const orden = () => paso++;

  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      // Tambien en Android: con la app de borde a borde el sistema ya no encoge la
      // ventana al abrir el teclado y lo de abajo quedaba tapado.
      behavior="padding"
    >
      <ScrollView
        // Con la app de borde a borde, el final quedaba bajo la barra de navegacion.
        contentContainerStyle={[
          estilos.contenido,
          { paddingTop: margenSuperior, paddingBottom: t.espacio[4] + margenes.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {onVolver ? (
          <View style={estilos.volver}>
            <BotonRedondo etiqueta="Volver" onPress={onVolver}>
              <IconoFlechaIzquierda tamano={20} color={t.color.texto} />
            </BotonRedondo>
          </View>
        ) : null}
        <View style={estilos.columna}>
          <View style={estilos.cabecera}>
            <Svg width={t.espacio[12]} height={t.espacio[12]} viewBox={SIMBOLO_LOGO.viewBox}>
              <Path fill={t.color.textoLogo} fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
            </Svg>
          </View>
          <Aparecer orden={orden()} disparador={modo}>
            <View style={estilos.encabezado}>
              <Text style={estilos.titulo}>{textos.titulo}</Text>
              {textos.detalle ? <Text style={estilos.detalle}>{textos.detalle}</Text> : null}
            </View>
          </Aparecer>

          <View style={estilos.campos}>
            <Aparecer orden={orden()} disparador={modo}>
              <CampoTexto
                etiqueta="Correo"
                etiquetaOculta
                variante="formulario"
                icono={<IconoCorreo tamano={20} color={t.color.textoSuave} />}
                value={email}
                onChangeText={(texto) => escribir("email", texto, setEmail)}
                error={errores.email}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                // "Siguiente" salta a la clave; en recuperar es el unico campo y envia.
                returnKeyType={modo === "recuperar" ? "send" : "next"}
                submitBehavior={modo === "recuperar" ? "blurAndSubmit" : "submit"}
                onSubmitEditing={() =>
                  modo === "recuperar" ? enviar() : campoClave.current?.focus()
                }
              />
            </Aparecer>
            {modo !== "recuperar" ? (
              <Aparecer orden={orden()} disparador={modo}>
                <CampoTexto
                  etiqueta="Contraseña"
                  etiquetaOculta
                  variante="formulario"
                  icono={<IconoCandado tamano={20} color={t.color.textoSuave} />}
                  value={clave}
                  onChangeText={(texto) => escribir("clave", texto, setClave)}
                  error={errores.clave}
                  placeholder="Contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={modo === "registro" ? "new-password" : "current-password"}
                  textContentType={modo === "registro" ? "newPassword" : "password"}
                  ref={campoClave}
                  returnKeyType={modo === "registro" ? "next" : "go"}
                  submitBehavior={modo === "registro" ? "submit" : "blurAndSubmit"}
                  onSubmitEditing={() =>
                    modo === "registro" ? campoTelefono.current?.focus() : enviar()
                  }
                />
              </Aparecer>
            ) : null}

            {modo === "registro" ? (
              <Aparecer orden={orden()} disparador={modo}>
                <IndicadorClave requisitos={evaluarClave(clave)} vacia={clave === ""} />
              </Aparecer>
            ) : null}

            {modo === "registro" ? (
              <Aparecer orden={orden()} disparador={modo}>
                <View style={estilos.telefono}>
                  <SelectorPais valor={pais} onCambio={setPais} />
                  <View style={estilos.telefonoCampo}>
                    <CampoTexto
                      etiqueta="Teléfono"
                      etiquetaOculta
                      variante="formulario"
                      icono={<IconoTelefono tamano={20} color={t.color.textoSuave} />}
                      value={telefono}
                      onChangeText={(texto) =>
                        escribir("telefono", texto.replace(/\D/g, ""), setTelefono)
                      }
                      error={errores.telefono}
                      placeholder="Teléfono"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      ref={campoTelefono}
                      // Sin aceptar los terminos solo cierra el teclado: falta marcar la casilla.
                      returnKeyType="go"
                      onSubmitEditing={() => {
                        if (acepta) enviar();
                      }}
                    />
                  </View>
                </View>
              </Aparecer>
            ) : null}

            {modo === "registro" ? (
              <Aparecer orden={orden()} disparador={modo}>
                <Casilla
                  marcada={acepta}
                  onCambio={setAcepta}
                  etiqueta={
                    <>
                      Acepto los{" "}
                      <Text
                        style={estilos.enlaceSubrayado}
                        onPress={() => Linking.openURL(urlDeTienda("/terminos"))}
                      >
                        Términos
                      </Text>{" "}
                      y la{" "}
                      <Text
                        style={estilos.enlaceSubrayado}
                        onPress={() => Linking.openURL(urlDeTienda("/privacidad"))}
                      >
                        Privacidad
                      </Text>
                    </>
                  }
                />
              </Aparecer>
            ) : null}

            {modo === "ingresar" ? (
              <Aparecer orden={orden()} disparador={modo}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => cambiarModo("recuperar")}
                  style={estilos.olvide}
                  hitSlop={8}
                >
                  <Text style={estilos.enlace}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
              </Aparecer>
            ) : null}
          </View>

          {/* Fuera de la secuencia del modo: entran solos, cada vez que cambia el texto. */}
          {error ? (
            <Aparecer orden={0} disparador={error}>
              <View style={[estilos.mensaje, estilos.error]}>
                <IconoCerrarCirculo tamano={18} color={t.color.ofertaTexto} />
                <Text style={[estilos.textoMensaje, estilos.textoError]}>{error}</Text>
              </View>
            </Aparecer>
          ) : null}
          {aviso ? (
            <Aparecer orden={0} disparador={aviso}>
              <View style={[estilos.mensaje, estilos.aviso]}>
                <IconoMarcarCirculo tamano={18} color={t.color.acentoTexto} />
                <Text style={[estilos.textoMensaje, estilos.textoAviso]}>{aviso}</Text>
              </View>
            </Aparecer>
          ) : null}

          <Aparecer orden={orden()} disparador={modo}>
            <BotonPrincipal
              texto={modo === "recuperar" && espera > 0 ? `Reenviar en ${espera} s` : textos.boton}
              onPress={enviar}
              cargando={cargando}
              radio={t.radio.lg}
              alto={t.espacio[12]}
              deshabilitado={
                (modo === "registro" && !acepta) || (modo === "recuperar" && espera > 0)
              }
            />
          </Aparecer>

          {modo !== "recuperar" ? (
            <>
              <Aparecer orden={orden()} disparador={modo}>
                <View style={estilos.separador}>
                  <View style={estilos.linea} />
                  <Text style={estilos.detalle}>o</Text>
                  <View style={estilos.linea} />
                </View>
              </Aparecer>
              <Aparecer orden={orden()} disparador={modo}>
                <View style={estilos.alternativas}>
                  <BotonSocial texto="Google" icono={<IconoGoogle tamano={20} />} />
                  <BotonSocial
                    texto="Apple"
                    icono={<IconoApple tamano={20} color={t.color.textoSuave} />}
                  />
                </View>
              </Aparecer>
            </>
          ) : null}

          <Aparecer orden={orden()} disparador={modo}>
            <View style={estilos.pie}>
              {modo === "ingresar" ? (
                <>
                  <Text style={estilos.detalle}>¿Nuevo aquí?</Text>
                  <Pressable accessibilityRole="button" onPress={() => cambiarModo("registro")}>
                    <Text style={estilos.enlaceFuerte}>Crear cuenta</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={estilos.detalle}>
                    {modo === "registro" ? "¿Ya tienes cuenta?" : "¿La recordaste?"}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={() => cambiarModo("ingresar")}>
                    <Text style={estilos.enlaceFuerte}>Conectar</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Aparecer>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  // Arriba y no centrado: asi el logo queda quieto al cambiar de modo sin forzar un alto
  // fijo, y solo hay scroll cuando el contenido de verdad no cabe.
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
  encabezado: {
    gap: t.espacio[1],
    alignItems: "center",
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontFamily: FUENTE_NATIVA.texto[700],
    textAlign: "center",
  },
  detalle: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
    textAlign: "center",
  },
  campos: {
    gap: t.espacio[4],
  },
  olvide: {
    alignSelf: "flex-end",
    marginTop: -t.espacio[2],
  },
  enlace: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[400],
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
  error: {
    backgroundColor: t.color.ofertaFondo,
  },
  textoError: {
    color: t.color.ofertaTexto,
  },
  aviso: {
    backgroundColor: t.color.acento,
  },
  textoAviso: {
    color: t.color.acentoTexto,
  },
  telefono: {
    flexDirection: "row",
    gap: t.espacio[2],
  },
  telefonoCampo: {
    flex: 1,
  },
  enlaceSubrayado: {
    color: t.color.texto,
    fontFamily: FUENTE_NATIVA.texto[700],
  },
  separador: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: t.color.borde,
  },
  alternativas: {
    flexDirection: "row",
    gap: t.espacio[2],
  },
  pie: {
    flexDirection: "row",
    justifyContent: "center",
    gap: t.espacio[1],
  },
  enlaceFuerte: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontFamily: FUENTE_NATIVA.texto[600],
  },
});
