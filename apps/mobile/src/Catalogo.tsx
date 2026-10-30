import { IconoOpciones } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "./api";
import { BotonRedondo } from "./componentes/BotonRedondo";
import { Buscador } from "./componentes/Buscador";
import { CabeceraPantalla } from "./componentes/CabeceraPantalla";
import { Categorias } from "./componentes/Categorias";
import { type Filtros, PanelFiltros } from "./componentes/PanelFiltros";
import { Rejilla } from "./componentes/Rejilla";

type Listado = Awaited<ReturnType<typeof api.catalogo.listado.query>>;
type Producto = Listado["productos"][number];

/** Espera tras la ultima tecla antes de buscar: no se pide en cada letra. */
const ESPERA_BUSQUEDA_MS = 350;

/**
 * Pestaña Catalogo: buscador arriba, categorias y el listado con filtros. Con
 * texto en el buscador, la busqueda manda y las categorias se apartan.
 */
export function Catalogo({ onAbrir }: { onAbrir: (slug: string) => void }) {
  const [categorias, setCategorias] = useState<{ slug: string; nombre: string }[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [listado, setListado] = useState<Listado | null>(null);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Producto[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [recargas, setRecargas] = useState(0);

  // Las categorias salen de la portada (cacheada): la primera queda elegida.
  useEffect(() => {
    api.catalogo.portada
      .query()
      .then((portada) => {
        setCategorias(portada.categorias);
        setCategoria((actual) => actual ?? portada.categorias[0]?.slug ?? null);
      })
      .catch((error: unknown) => setFallo(error instanceof Error ? error.message : String(error)));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `recargas` fuerza recargar
  useEffect(() => {
    if (!categoria) return;
    let vigente = true;
    setCargando(true);
    api.catalogo.listado
      .query({ categoria, filtros })
      .then((datos) => {
        if (vigente) {
          setListado(datos);
          setFallo(null);
        }
      })
      .catch((error: unknown) => {
        if (vigente) setFallo(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [categoria, filtros, recargas]);

  useEffect(() => {
    const busqueda = texto.trim();
    if (busqueda.length < 2) {
      setResultados(null);
      return;
    }
    let vigente = true;
    const espera = setTimeout(() => {
      api.catalogo.buscar
        .query({ texto: busqueda })
        .then((encontrados) => vigente && setResultados(encontrados))
        .catch(() => vigente && setResultados([]));
    }, ESPERA_BUSQUEDA_MS);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto]);

  function elegirCategoria(slug: string | null) {
    if (!slug) return;
    setCategoria(slug);
    // Los filtros de una categoria (tallas, marcas) no valen en otra.
    setFiltros({});
  }

  const buscando = resultados !== null || texto.trim().length >= 2;
  const productos = buscando ? (resultados ?? []) : (listado?.productos ?? []);
  const activos = Object.keys(filtros).filter((k) => k !== "orden" || filtros[k] !== "novedades");

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla
        titulo="Catálogo"
        derecha={
          <BotonRedondo etiqueta="Filtros" contador={activos.length} onPress={() => setPanel(true)}>
            <IconoOpciones tamano={20} color={t.color.texto} />
          </BotonRedondo>
        }
      />
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => setRecargas((n) => n + 1)} />
        }
      >
        <View style={estilos.margen}>
          <Buscador valor={texto} onCambiar={setTexto} onFiltros={() => setPanel(true)} />
        </View>

        {buscando ? null : (
          <Categorias
            categorias={categorias}
            elegida={categoria}
            onElegir={elegirCategoria}
            sinTodo
          />
        )}

        <View style={[estilos.margen, estilos.resumen]}>
          <Text style={estilos.contador}>
            {buscando
              ? `${productos.length} resultados para “${texto.trim()}”`
              : `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`}
          </Text>
          {cargando ? <ActivityIndicator size="small" color={t.color.textoSuave} /> : null}
        </View>

        {fallo ? (
          <Text style={[estilos.suave, estilos.margen]}>{fallo}</Text>
        ) : productos.length === 0 && !cargando ? (
          <View style={estilos.vacio}>
            <Text style={estilos.tituloVacio}>No encontramos productos</Text>
            <Text style={estilos.suave}>
              {buscando ? "Prueba con otra palabra." : "Quita algún filtro para ver más."}
            </Text>
          </View>
        ) : (
          <Rejilla productos={productos} onAbrir={onAbrir} />
        )}
      </ScrollView>

      <PanelFiltros
        visible={panel}
        facetas={listado?.facetas ?? { tallas: [], colores: [], marcas: [] }}
        filtros={filtros}
        onCerrar={() => setPanel(false)}
        onAplicar={(siguientes) => {
          setFiltros(siguientes);
          setTexto("");
          setPanel(false);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    gap: t.espacio[4],
    paddingTop: t.espacio[2],
    paddingBottom: t.espacio[8],
  },
  margen: {
    paddingHorizontal: t.espacio[4],
  },
  resumen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contador: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  vacio: {
    alignItems: "center",
    gap: t.espacio[1],
    paddingVertical: t.espacio[10],
  },
  tituloVacio: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
    fontWeight: "600",
  },
  suave: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    textAlign: "center",
  },
});
