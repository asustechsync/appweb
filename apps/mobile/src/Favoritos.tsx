import { IconoFavorito } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "./api";
import { CabeceraPantalla } from "./componentes/CabeceraPantalla";
import { Rejilla } from "./componentes/Rejilla";
import { useFavoritos } from "./estado-favoritos";

type Producto = Awaited<ReturnType<typeof api.catalogo.productos.query>>[number];

/**
 * Pestaña Favoritos: los productos marcados con el corazon, con precio y stock
 * de hoy. Quitar el corazon desde aqui los saca de la lista al momento.
 */
export function Favoritos({ onAbrir }: { onAbrir: (slug: string) => void }) {
  const { slugs } = useFavoritos();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  // Se pide al servidor solo si se agregan favoritos; quitar uno filtra en local.
  const clave = [...slugs].sort().join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: la clave resume los slugs
  useEffect(() => {
    if (slugs.length === 0) {
      setProductos([]);
      return;
    }
    api.catalogo.productos
      .query({ slugs })
      .then((encontrados) => {
        setProductos(encontrados);
        setFallo(null);
      })
      .catch((error: unknown) => setFallo(error instanceof Error ? error.message : String(error)));
  }, [clave]);

  const visibles = (productos ?? []).filter((p) => slugs.includes(p.slug));

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Favoritos" />
      {slugs.length === 0 ? (
        <View style={estilos.centro}>
          <View style={estilos.icono}>
            <IconoFavorito tamano={30} color={t.color.ofertaTexto} />
          </View>
          <Text style={estilos.titulo}>Aún no tienes favoritos</Text>
          <Text style={estilos.suave}>Toca el corazón de un producto para guardarlo aquí.</Text>
        </View>
      ) : fallo ? (
        <View style={estilos.centro}>
          <Text style={estilos.suave}>{fallo}</Text>
        </View>
      ) : productos === null ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={t.color.texto} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <Text style={estilos.contador}>
            {visibles.length} {visibles.length === 1 ? "guardado" : "guardados"}
          </Text>
          <Rejilla productos={visibles} onAbrir={onAbrir} />
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
    gap: t.espacio[2],
    padding: t.espacio[6],
  },
  icono: {
    width: t.espacio[20],
    height: t.espacio[20],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.ofertaFondo,
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
  contenido: {
    gap: t.espacio[3],
    paddingTop: t.espacio[2],
    paddingBottom: t.espacio[8],
  },
  contador: {
    paddingHorizontal: t.espacio[4],
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
});
