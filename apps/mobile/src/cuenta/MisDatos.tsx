import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { useSesion } from "../estado-sesion";
import { BotonPrincipal } from "../componentes/BotonPrincipal";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { CampoTexto } from "../componentes/CampoTexto";

type Perfil = Awaited<ReturnType<typeof api.cuenta.perfil.query>>;

/** Lo vacio no viaja: el esquema de core trata un campo ausente como "sin dato". */
function opcional(valor: string | null | undefined): string | undefined {
  const limpio = valor?.trim();
  return limpio ? limpio : undefined;
}

/**
 * Datos personales: nombre, apellidos, apodo y celular. El correo no se edita.
 * Documento, nacimiento y genero se editan en la web; aqui se reenvian tal
 * cual para no borrarlos al guardar.
 */
export function MisDatos({ onVolver }: { onVolver: () => void }) {
  const { cambiarNombre } = useSesion();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nombre, setNombre] = useState("");
  const [paterno, setPaterno] = useState("");
  const [materno, setMaterno] = useState("");
  const [apodo, setApodo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.cuenta.perfil
      .query()
      .then((datos) => {
        setPerfil(datos);
        setNombre(datos.nombre);
        setPaterno(datos.apellidoPaterno ?? "");
        setMaterno(datos.apellidoMaterno ?? "");
        setApodo(datos.apodo ?? "");
        setTelefono(datos.telefono ?? "");
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  async function guardar() {
    if (!perfil) return;
    setError(null);
    setGuardando(true);
    try {
      await api.cuenta.guardarDatos.mutate({
        nombre: nombre.trim(),
        apellidoPaterno: opcional(paterno),
        apellidoMaterno: opcional(materno),
        apodo: opcional(apodo),
        telefono: opcional(telefono),
        tipoDocumento: perfil.tipoDocumento ?? undefined,
        numeroDocumento: opcional(perfil.numeroDocumento),
        fechaNacimiento: perfil.fechaNacimiento ?? undefined,
        genero: perfil.genero ?? undefined,
      });
      await cambiarNombre(nombre.trim());
      Alert.alert("Listo", "Guardamos tus datos.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Mis datos" onVolver={onVolver} />
      {perfil === null && !error ? (
        <ActivityIndicator style={estilos.cargando} color={t.color.texto} />
      ) : (
        <ScrollView
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {perfil ? <Text style={estilos.correo}>{perfil.email}</Text> : null}
          <CampoTexto etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
          <CampoTexto etiqueta="Apellido paterno" value={paterno} onChangeText={setPaterno} />
          <CampoTexto etiqueta="Apellido materno" value={materno} onChangeText={setMaterno} />
          <CampoTexto etiqueta="¿Cómo te llamamos?" value={apodo} onChangeText={setApodo} />
          <CampoTexto
            etiqueta="Celular"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
          {error ? <Text style={estilos.error}>{error}</Text> : null}
          <BotonPrincipal texto="Guardar" onPress={guardar} cargando={guardando} />
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  cargando: {
    marginTop: t.espacio[10],
  },
  contenido: {
    gap: t.espacio[4],
    padding: t.espacio[4],
    paddingBottom: t.espacio[16],
  },
  correo: {
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
});
