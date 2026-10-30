import { evaluarClave } from "@appweb/core/clave";
import { IconoPerfil } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "./api";
import { BotonPrincipal } from "./componentes/BotonPrincipal";
import { CampoTexto } from "./componentes/CampoTexto";
import { useSesion } from "./estado-sesion";

type Modo = "ingresar" | "registro" | "recuperar";

const TEXTOS: Record<Modo, { titulo: string; detalle: string; boton: string }> = {
  ingresar: {
    titulo: "Hola de nuevo",
    detalle: "Ingresa para ver tus pedidos y comprar más rápido.",
    boton: "Ingresar",
  },
  registro: {
    titulo: "Crea tu cuenta",
    detalle: "Sigue tus pedidos y sube de nivel con cada compra.",
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
export function Acceso() {
  const { abrir } = useSesion();
  const [modo, setModo] = useState<Modo>("ingresar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
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
        <View style={estilos.icono}>
          <IconoPerfil tamano={28} color={t.color.texto} />
        </View>
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>{textos.titulo}</Text>
          <Text style={estilos.detalle}>{textos.detalle}</Text>
        </View>

        <View style={estilos.campos}>
          <CampoTexto
            etiqueta="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {modo === "registro" ? (
            <CampoTexto
              etiqueta="Celular"
              value={telefono}
              onChangeText={setTelefono}
              placeholder="987654321"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          ) : null}
          {modo !== "recuperar" ? (
            <CampoTexto
              etiqueta="Contraseña"
              value={clave}
              onChangeText={setClave}
              placeholder="Tu contraseña"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={modo === "registro" ? "new-password" : "current-password"}
              textContentType={modo === "registro" ? "newPassword" : "password"}
            />
          ) : null}

          {modo === "registro" ? (
            <View style={estilos.requisitos}>
              {evaluarClave(clave)
                .filter((r) => r.obligatorio)
                .map((r) => (
                  <Text key={r.id} style={[estilos.requisito, r.cumplido && estilos.cumplido]}>
                    {r.cumplido ? "✓" : "·"} {r.texto}
                  </Text>
                ))}
            </View>
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

        <BotonPrincipal texto={textos.boton} onPress={enviar} cargando={cargando} />

        <View style={estilos.pie}>
          {modo === "ingresar" ? (
            <>
              <Text style={estilos.detalle}>¿No tienes cuenta?</Text>
              <Pressable accessibilityRole="button" onPress={() => cambiarModo("registro")}>
                <Text style={estilos.enlaceFuerte}>Crea una</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={estilos.detalle}>
                {modo === "registro" ? "¿Ya tienes cuenta?" : "¿La recordaste?"}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => cambiarModo("ingresar")}>
                <Text style={estilos.enlaceFuerte}>Ingresa</Text>
              </Pressable>
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
    gap: t.espacio[5],
    padding: t.espacio[6],
    paddingTop: t.espacio[10],
    paddingBottom: t.espacio[32],
  },
  icono: {
    width: t.espacio[16],
    height: t.espacio[16],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
    backgroundColor: t.color.acento,
  },
  encabezado: {
    gap: t.espacio[1],
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontWeight: "700",
  },
  detalle: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  campos: {
    gap: t.espacio[4],
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
  olvide: {
    alignSelf: "flex-end",
    marginTop: -t.espacio[2],
  },
  enlace: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "500",
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
