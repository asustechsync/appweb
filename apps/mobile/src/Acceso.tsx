import { evaluarClave } from "@appweb/core/clave";
import {
  IconoApple,
  IconoCandado,
  IconoCorreo,
  IconoFlechaIzquierda,
  IconoGoogle,
  IconoTelefono,
} from "@appweb/ui/iconos.nativos";
import { SIMBOLO_LOGO } from "@appweb/ui/marca";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { api, urlDeTienda } from "./api";
import { BotonPrincipal } from "./componentes/BotonPrincipal";
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
  const [modo, setModo] = useState<Modo>("ingresar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("pe");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function cambiarModo(siguiente: Modo) {
    setModo(siguiente);
    setError(null);
    setAviso(null);
  }

  async function enviar() {
    setError(null);
    setAviso(null);
    setCargando(true);
    try {
      if (modo === "ingresar") {
        await abrir(await api.acceso.ingresar.mutate({ email, clave }));
      } else if (modo === "registro") {
        await abrir(await api.acceso.registrar.mutate({ email, clave, telefono }));
      } else {
        await api.acceso.recuperar.mutate({ email });
        setAviso("Si el correo tiene una cuenta, te llegará el enlace en unos minutos.");
      }
    } catch (fallo) {
      setError(mensajeDe(fallo));
    } finally {
      setCargando(false);
    }
  }

  const textos = TEXTOS[modo];

  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.columna}>
          {onVolver ? (
            <Pressable
              accessibilityRole="button"
              onPress={onVolver}
              hitSlop={8}
              style={estilos.volver}
            >
              <IconoFlechaIzquierda tamano={16} color={t.color.textoSuave} />
              <Text style={estilos.enlace}>Volver</Text>
            </Pressable>
          ) : null}
          <View style={estilos.logo}>
            <Svg width={t.espacio[16]} height={t.espacio[16]} viewBox={SIMBOLO_LOGO.viewBox}>
              <Path fill={t.color.textoLogo} fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
            </Svg>
          </View>
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo}>{textos.titulo}</Text>
            {textos.detalle ? <Text style={estilos.detalle}>{textos.detalle}</Text> : null}
          </View>

          <View style={estilos.campos}>
            <CampoTexto
              etiqueta="Correo"
              etiquetaOculta
              variante="formulario"
              icono={<IconoCorreo tamano={20} color={t.color.textoSuave} />}
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {modo !== "recuperar" ? (
              <CampoTexto
                etiqueta="Contraseña"
                etiquetaOculta
                variante="formulario"
                icono={<IconoCandado tamano={20} color={t.color.textoSuave} />}
                value={clave}
                onChangeText={setClave}
                placeholder="Contraseña"
                secureTextEntry
                autoCapitalize="none"
                autoComplete={modo === "registro" ? "new-password" : "current-password"}
                textContentType={modo === "registro" ? "newPassword" : "password"}
              />
            ) : null}

            {modo === "registro" ? (
              <IndicadorClave requisitos={evaluarClave(clave)} vacia={clave === ""} />
            ) : null}

            {modo === "registro" ? (
              <View style={estilos.telefono}>
                <SelectorPais valor={pais} onCambio={setPais} />
                <View style={estilos.telefonoCampo}>
                  <CampoTexto
                    etiqueta="Teléfono"
                    etiquetaOculta
                    variante="formulario"
                    icono={<IconoTelefono tamano={20} color={t.color.textoSuave} />}
                    value={telefono}
                    onChangeText={(texto) => setTelefono(texto.replace(/\D/g, ""))}
                    placeholder="Teléfono"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </View>
              </View>
            ) : null}

            {modo === "registro" ? (
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
            ) : null}

            {modo === "ingresar" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => cambiarModo("recuperar")}
                style={estilos.olvide}
                hitSlop={8}
              >
                <Text style={estilos.enlace}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={estilos.error}>{error}</Text> : null}
          {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

          <BotonPrincipal
            texto={textos.boton}
            onPress={enviar}
            cargando={cargando}
            radio={t.radio.md}
            alto={t.espacio[12]}
            deshabilitado={modo === "registro" && !acepta}
          />

          {modo !== "recuperar" ? (
            <>
              <View style={estilos.separador}>
                <View style={estilos.linea} />
                <Text style={estilos.detalle}>o</Text>
                <View style={estilos.linea} />
              </View>
              <View style={estilos.alternativas}>
                <BotonSocial texto="Google" icono={<IconoGoogle tamano={20} />} />
                <BotonSocial
                  texto="Apple"
                  icono={<IconoApple tamano={20} color={t.color.textoSuave} />}
                />
              </View>
            </>
          ) : null}

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
    justifyContent: "center",
    alignItems: "center",
    padding: t.espacio[4],
    paddingVertical: t.espacio[8],
  },
  columna: {
    width: "100%",
    maxWidth: 416,
    // Alto de la pantalla mas larga (crear cuenta), como en la web: el logo no salta al cambiar de modo.
    minHeight: 672,
    gap: t.espacio[5],
  },
  volver: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: t.espacio[1],
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.espacio[5],
  },
  encabezado: {
    gap: t.espacio[1],
    alignItems: "center",
  },
  titulo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.base,
    textAlign: "center",
  },
  detalle: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
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
  },
  error: {
    padding: t.espacio[3],
    borderRadius: t.radio.md,
    overflow: "hidden",
    backgroundColor: t.color.ofertaFondo,
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.sm,
  },
  aviso: {
    padding: t.espacio[3],
    borderRadius: t.radio.md,
    overflow: "hidden",
    backgroundColor: t.color.acento,
    color: t.color.acentoTexto,
    fontSize: t.tipo.tamano.sm,
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
    fontWeight: "700",
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
    fontWeight: "600",
  },
});
