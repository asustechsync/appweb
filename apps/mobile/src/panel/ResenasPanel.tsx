import { ETIQUETAS_ESTADO_RESENA, tonoDeEstadoResena } from "@appweb/core/resenas";
import { FECHA } from "@appweb/core/formato";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api, revalidarTienda, urlDeImagen } from "../api";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { Estrellas } from "../componentes/Estrellas";
import { Etiqueta } from "../componentes/Etiqueta";

type Lista = Awaited<ReturnType<typeof api.panel.resenas.listar.query>>;
type Resena = Lista["resenas"][number];

/**
 * Reseñas por moderar: las pendientes primero, la mas vieja arriba. Publicar o
 * retirar cambia lo que ve la tienda, asi que se le pide que regenere la
 * ficha de ese producto.
 */
export function ResenasPanel({ onVolver }: { onVolver: () => void }) {
  const [lista, setLista] = useState<Lista | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api.panel.resenas.listar
      .query({ estado: "PENDIENTE" })
      .then((datos) => {
        setLista(datos);
        setFallo(null);
      })
      .catch((e: unknown) => setFallo(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(cargar, [cargar]);

  async function decidir(resena: Resena, estado: "APROBADA" | "RECHAZADA") {
    setTrabajando(resena.id);
    try {
      const resultado = await api.panel.resenas.moderar.mutate({ resenaId: resena.id, estado });
      await revalidarTienda(resultado.revalidar.productos);
      cargar();
    } catch (e) {
      Alert.alert("No se pudo", e instanceof Error ? e.message : "Inténtalo de nuevo.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Reseñas por moderar" onVolver={onVolver} />
      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : !lista ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : lista.resenas.length === 0 ? (
        <Text style={[estilos.suave, estilos.centro]}>No hay reseñas por moderar.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}
        >
          {lista.resenas.map((resena) => (
            <View key={resena.id} style={estilos.tarjeta}>
              <View style={estilos.cabecera}>
                <View style={estilos.foto}>
                  {resena.imagen ? (
                    <Image source={{ uri: urlDeImagen(resena.imagen) }} style={estilos.imagen} />
                  ) : null}
                </View>
                <View style={estilos.datos}>
                  <Text style={estilos.nombre} numberOfLines={2}>
                    {resena.producto}
                  </Text>
                  <Text style={estilos.suaveIzq}>
                    {resena.autor} · {FECHA.format(new Date(resena.creadoEn))}
                  </Text>
                  <Etiqueta
                    texto={ETIQUETAS_ESTADO_RESENA[resena.estado]}
                    tono={tonoDeEstadoResena(resena.estado)}
                  />
                </View>
              </View>
              <Estrellas nota={resena.estrellas} tamano={16} />
              {resena.comentario ? <Text style={estilos.texto}>{resena.comentario}</Text> : null}
              <View style={estilos.acciones}>
                <Pressable
                  accessibilityRole="button"
                  disabled={trabajando === resena.id}
                  onPress={() => decidir(resena, "RECHAZADA")}
                  style={[estilos.boton, estilos.rechazar]}
                >
                  <Text style={estilos.textoRechazar}>Rechazar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={trabajando === resena.id}
                  onPress={() => decidir(resena, "APROBADA")}
                  style={[estilos.boton, estilos.aprobar]}
                >
                  {trabajando === resena.id ? (
                    <ActivityIndicator color={t.color.textoInverso} />
                  ) : (
                    <Text style={estilos.textoAprobar}>Publicar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  centro: {
    flex: 1,
    alignSelf: "center",
    padding: t.espacio[6],
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
  lista: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    paddingBottom: t.espacio[16],
  },
  tarjeta: {
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  cabecera: {
    flexDirection: "row",
    gap: t.espacio[3],
  },
  foto: {
    width: t.espacio[16],
    height: t.espacio[16],
    overflow: "hidden",
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoFoto,
  },
  imagen: {
    width: "100%",
    height: "100%",
  },
  datos: {
    flex: 1,
    gap: t.espacio[1],
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  suaveIzq: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.xs,
  },
  texto: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  acciones: {
    flexDirection: "row",
    gap: t.espacio[3],
  },
  boton: {
    flex: 1,
    height: t.espacio[12],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radio.completo,
  },
  rechazar: {
    backgroundColor: t.color.ofertaFondo,
  },
  aprobar: {
    backgroundColor: t.color.marca[500],
  },
  textoRechazar: {
    color: t.color.ofertaTexto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  textoAprobar: {
    color: t.color.textoInverso,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
});
