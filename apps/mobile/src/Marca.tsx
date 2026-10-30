import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, urlDeImagen } from "./api";
import { CabeceraPantalla } from "./componentes/CabeceraPantalla";
import { Rejilla } from "./componentes/Rejilla";

type DatosMarca = Awaited<ReturnType<typeof api.catalogo.marca.query>>;

interface PropsMarca {
  slug: string;
  onVolver: () => void;
  onAbrir: (slug: string) => void;
}

/** Pagina de una marca: su logo y nombre arriba, y todos sus productos visibles. */
export function Marca({ slug, onVolver, onAbrir }: PropsMarca) {
  const [marca, setMarca] = useState<DatosMarca | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    api.catalogo.marca
      .query({ slug })
      .then(setMarca)
      .catch((error: unknown) => setFallo(error instanceof Error ? error.message : String(error)));
  }, [slug]);

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo={marca?.nombre ?? "Marca"} onVolver={onVolver} />
      {fallo || !marca ? (
        <View style={estilos.centro}>
          {fallo ? (
            <Text style={estilos.suave}>{fallo}</Text>
          ) : (
            <ActivityIndicator color={t.color.texto} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <View style={estilos.tarjeta}>
            <View style={estilos.logo}>
              {marca.logo ? (
                <Image
                  source={{ uri: urlDeImagen(marca.logo) }}
                  style={estilos.imagen}
                  resizeMode="contain"
                />
              ) : (
                <Text style={estilos.inicial}>{marca.nombre.charAt(0)}</Text>
              )}
            </View>
            <View>
              <Text style={estilos.nombre}>{marca.nombre}</Text>
              <Text style={estilos.suave}>
                {marca.productos.length} {marca.productos.length === 1 ? "producto" : "productos"}
              </Text>
            </View>
          </View>
          <Rejilla productos={marca.productos} onAbrir={onAbrir} />
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
    alignItems: "center",
    justifyContent: "center",
    padding: t.espacio[6],
  },
  contenido: {
    gap: t.espacio[5],
    paddingTop: t.espacio[2],
    paddingBottom: t.espacio[16],
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[4],
    marginHorizontal: t.espacio[4],
    padding: t.espacio[4],
    borderRadius: t.radio.xl,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.md,
  },
  logo: {
    width: t.espacio[16],
    height: t.espacio[16],
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: t.radio.lg,
    backgroundColor: t.color.fondoFoto,
  },
  imagen: {
    width: "80%",
    height: "80%",
  },
  inicial: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontWeight: "700",
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontWeight: "600",
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
});
