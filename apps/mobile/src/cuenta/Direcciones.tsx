import { IconoPapelera, IconoUbicacion } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { api } from "../api";
import { BotonPrincipal } from "../componentes/BotonPrincipal";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { CampoTexto } from "../componentes/CampoTexto";
import { Etiqueta } from "../componentes/Etiqueta";

type Direccion = Awaited<ReturnType<typeof api.cuenta.direcciones.query>>[number];

const VACIA = { departamento: "", provincia: "", distrito: "", calle: "", referencia: "" };

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar.";
}

/** Direcciones guardadas: la principal arriba, marcar otra, borrar y agregar una nueva. */
export function Direcciones({ onVolver }: { onVolver: () => void }) {
  const [direcciones, setDirecciones] = useState<Direccion[] | null>(null);
  const [formulario, setFormulario] = useState(false);
  const [datos, setDatos] = useState(VACIA);
  const [principal, setPrincipal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    api.cuenta.direcciones
      .query()
      .then(setDirecciones)
      .catch((e: unknown) => setError(mensajeDe(e)));
  }, []);

  useEffect(cargar, [cargar]);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await api.cuenta.crearDireccion.mutate({
        ...datos,
        referencia: datos.referencia.trim() || undefined,
        principal: principal || direcciones?.length === 0,
      });
      setDatos(VACIA);
      setPrincipal(false);
      setFormulario(false);
      cargar();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  function marcar(direccionId: string) {
    api.cuenta.marcarPrincipal
      .mutate({ direccionId })
      .then(cargar)
      .catch((e: unknown) => Alert.alert("No se pudo", mensajeDe(e)));
  }

  function eliminar(direccion: Direccion) {
    Alert.alert("Eliminar dirección", direccion.calle, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          api.cuenta.eliminarDireccion
            .mutate({ direccionId: direccion.id })
            .then(cargar)
            .catch((e: unknown) => Alert.alert("No se pudo", mensajeDe(e))),
      },
    ]);
  }

  const campo = (clave: keyof typeof VACIA) => ({
    value: datos[clave],
    onChangeText: (valor: string) => setDatos((actual) => ({ ...actual, [clave]: valor })),
  });

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Mis direcciones" onVolver={onVolver} />
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {direcciones === null ? (
          <ActivityIndicator color={t.color.texto} />
        ) : direcciones.length === 0 && !formulario ? (
          <Text style={estilos.suave}>Aún no guardaste direcciones.</Text>
        ) : (
          direcciones.map((direccion) => (
            <View key={direccion.id} style={estilos.tarjeta}>
              <IconoUbicacion tamano={20} color={t.color.texto} />
              <View style={estilos.datos}>
                {direccion.principal ? <Etiqueta texto="Principal" tono="exito" /> : null}
                <Text style={estilos.calle}>{direccion.calle}</Text>
                <Text style={estilos.zona}>
                  {direccion.distrito}, {direccion.provincia}, {direccion.departamento}
                </Text>
                {direccion.referencia ? (
                  <Text style={estilos.zona}>Ref.: {direccion.referencia}</Text>
                ) : null}
                {direccion.principal ? null : (
                  <Pressable accessibilityRole="button" onPress={() => marcar(direccion.id)}>
                    <Text style={estilos.enlace}>Usar como principal</Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar dirección"
                hitSlop={8}
                onPress={() => eliminar(direccion)}
              >
                <IconoPapelera tamano={18} color={t.color.textoTenue} />
              </Pressable>
            </View>
          ))
        )}

        {formulario ? (
          <View style={estilos.formulario}>
            <Text style={estilos.subtitulo}>Nueva dirección</Text>
            <CampoTexto etiqueta="Departamento" placeholder="Lima" {...campo("departamento")} />
            <CampoTexto etiqueta="Provincia" placeholder="Lima" {...campo("provincia")} />
            <CampoTexto etiqueta="Distrito" placeholder="Miraflores" {...campo("distrito")} />
            <CampoTexto
              etiqueta="Dirección"
              placeholder="Av. Larco 123, dpto. 401"
              {...campo("calle")}
            />
            <CampoTexto
              etiqueta="Referencia (opcional)"
              placeholder="Frente al parque"
              {...campo("referencia")}
            />
            <View style={estilos.interruptor}>
              <Text style={estilos.calle}>Usar como principal</Text>
              <Switch
                value={principal}
                onValueChange={setPrincipal}
                trackColor={{ true: t.color.marca[500], false: t.color.fondoSutil }}
                thumbColor={t.color.fondo}
              />
            </View>
            {error ? <Text style={estilos.error}>{error}</Text> : null}
            <BotonPrincipal texto="Guardar dirección" onPress={guardar} cargando={guardando} />
            <Pressable accessibilityRole="button" onPress={() => setFormulario(false)}>
              <Text style={[estilos.enlace, estilos.centrado]}>Cancelar</Text>
            </Pressable>
          </View>
        ) : (
          <BotonPrincipal texto="Agregar dirección" onPress={() => setFormulario(true)} />
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    paddingBottom: t.espacio[16],
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  datos: {
    flex: 1,
    gap: t.espacio[1],
  },
  calle: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  zona: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
  enlace: {
    marginTop: t.espacio[1],
    color: t.color.texto,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "600",
  },
  centrado: {
    textAlign: "center",
  },
  formulario: {
    gap: t.espacio[3],
    marginTop: t.espacio[2],
  },
  subtitulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
  },
  interruptor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  error: {
    padding: t.espacio[3],
    borderRadius: t.radio.md,
    overflow: "hidden",
    backgroundColor: t.color.ofertaFondo,
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.sm,
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
});
