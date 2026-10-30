import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { IconoNotificacion } from "@appweb/ui/iconos.nativos";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "./api";
import { useSesion } from "./estado-sesion";
import { Avatar } from "./componentes/Avatar";
import { BotonRedondo } from "./componentes/BotonRedondo";
import { Buscador } from "./componentes/Buscador";
import { CabeceraSeccion } from "./componentes/CabeceraSeccion";
import { CarruselBanners } from "./componentes/CarruselBanners";
import { Categorias } from "./componentes/Categorias";
import { TarjetaProducto } from "./componentes/TarjetaProducto";

type DatosPortada = Awaited<ReturnType<typeof api.catalogo.portada.query>>;

/**
 * Portada de la app: cabecera, buscador, promociones, categorias, ofertas en
 * una fila deslizable y novedades en dos columnas. Todo llega en una sola
 * peticion (`catalogo.portada`), servida desde la cache de la tienda.
 */
interface PropsPortada {
  onAbrir: (slug: string) => void;
  onCuenta: () => void;
}

export function Portada({ onAbrir, onCuenta }: PropsPortada) {
  const { sesion } = useSesion();
  const [datos, setDatos] = useState<DatosPortada | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [recargando, setRecargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setFallo(null);
      setDatos(await api.catalogo.portada.query());
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se pudo cargar la tienda.");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function recargar() {
    setRecargando(true);
    await cargar();
    setRecargando(false);
  }

  // Busqueda y categoria filtran las novedades en el celular: ya estan cargadas.
  const novedades = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (datos?.novedades ?? []).filter(
      (p) =>
        (!categoria || p.categoriaSlug === categoria) &&
        (!texto || p.nombre.toLowerCase().includes(texto)),
    );
  }, [datos, busqueda, categoria]);

  if (fallo) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.tituloAviso}>No se pudo cargar</Text>
        <Text style={estilos.suave}>{fallo}</Text>
        <Text style={estilos.suave}>¿Está corriendo la tienda con npm run dev?</Text>
      </View>
    );
  }

  if (!datos) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={t.color.texto} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={estilos.contenido}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}
    >
      <View style={estilos.cabecera}>
        <Avatar nombre={sesion?.nombre} onPress={onCuenta} />
        <View style={estilos.saludos}>
          <Text style={estilos.saludo}>Hola de nuevo</Text>
          <Text style={estilos.titulo} numberOfLines={1}>
            {sesion?.nombre ?? "Básicos para hoy"}
          </Text>
        </View>
        <BotonRedondo etiqueta="Notificaciones" cuadrado>
          <IconoNotificacion tamano={22} color={t.color.texto} />
        </BotonRedondo>
      </View>

      <View style={estilos.margen}>
        <Buscador valor={busqueda} onCambiar={setBusqueda} />
      </View>

      <CarruselBanners banners={datos.banners} />

      <Categorias categorias={datos.categorias} elegida={categoria} onElegir={setCategoria} />

      {datos.ofertas.length > 0 ? (
        <View style={estilos.seccion}>
          <CabeceraSeccion titulo="Ofertas" onVerTodo={() => {}} />
          <FlatList
            data={datos.ofertas}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.filaOfertas}
            keyExtractor={(p) => p.slug}
            renderItem={({ item }) => (
              <TarjetaProducto
                producto={item}
                onAbrir={onAbrir}
                ancho={t.espacio[36] + t.espacio[4]}
              />
            )}
          />
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <CabeceraSeccion titulo="Novedades" onVerTodo={() => {}} />
        {novedades.length === 0 ? (
          <Text style={[estilos.suave, estilos.margen]}>No hay productos para esta búsqueda.</Text>
        ) : (
          <View style={estilos.rejilla}>
            {novedades.map((producto) => (
              <View key={producto.slug} style={estilos.celda}>
                <TarjetaProducto producto={producto} onAbrir={onAbrir} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: t.espacio[6],
    paddingTop: t.espacio[2],
    paddingBottom: t.espacio[8],
  },
  margen: {
    paddingHorizontal: t.espacio[4],
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: t.espacio[2],
    padding: t.espacio[6],
  },
  cabecera: {
    flexDirection: "row",
    gap: t.espacio[3],
    paddingHorizontal: t.espacio[4],
  },
  saludos: {
    flex: 1,
  },
  saludo: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano["2xl"],
    fontWeight: "700",
  },
  seccion: {
    gap: t.espacio[3],
  },
  filaOfertas: {
    gap: t.espacio[3],
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
  },
  rejilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.espacio[3],
    paddingHorizontal: t.espacio[4],
  },
  celda: {
    width: "48%",
    flexGrow: 1,
    maxWidth: "50%",
  },
  tituloAviso: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.lg,
    fontWeight: "600",
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
});
