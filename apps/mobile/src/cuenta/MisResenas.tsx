import {
  ETIQUETAS_ESTADO_RESENA,
  MAX_ESTRELLAS,
  MAX_LETRAS_COMENTARIO,
  tonoDeEstadoResena,
} from "@appweb/core/resenas";
import { IconoEstrella, IconoEstrellaRellena } from "@appweb/ui/iconos.nativos";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, urlDeImagen } from "../api";
import { BotonPrincipal } from "../componentes/BotonPrincipal";
import { CabeceraPantalla } from "../componentes/CabeceraPantalla";
import { Etiqueta } from "../componentes/Etiqueta";

type Producto = Awaited<ReturnType<typeof api.cuenta.porResenar.query>>[number];

const ESCALA = Array.from({ length: MAX_ESTRELLAS }, (_, i) => i + 1);

/**
 * Productos recibidos para opinar. Cada uno muestra la reseña que ya dejo (y
 * su estado de revision) o el formulario para escribirla. Una reseña publicada
 * ya no se edita: lo decide @appweb/api, no esta pantalla.
 */
export function MisResenas({ onVolver }: { onVolver: () => void }) {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api.cuenta.porResenar
      .query()
      .then(setProductos)
      .catch((e: unknown) => setFallo(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <View style={estilos.pantalla}>
      <CabeceraPantalla titulo="Mis reseñas" onVolver={onVolver} />
      {fallo ? (
        <Text style={[estilos.suave, estilos.centro]}>{fallo}</Text>
      ) : productos === null ? (
        <ActivityIndicator style={estilos.centro} color={t.color.texto} />
      ) : productos.length === 0 ? (
        <Text style={[estilos.suave, estilos.centro]}>
          Cuando recibas un pedido podrás opinar de sus productos aquí.
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={estilos.lista}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {productos.map((producto) => (
            <TarjetaResena key={producto.productoId} producto={producto} onGuardada={cargar} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TarjetaResena({ producto, onGuardada }: { producto: Producto; onGuardada: () => void }) {
  const resena = producto.resena;
  const [editando, setEditando] = useState(false);
  const [estrellas, setEstrellas] = useState(resena?.estrellas ?? 0);
  const [comentario, setComentario] = useState(resena?.comentario ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await api.cuenta.guardarResena.mutate({
        productoId: producto.productoId,
        estrellas,
        comentario: comentario.trim() || undefined,
      });
      setEditando(false);
      onGuardada();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const abierto = editando || !resena;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <View style={estilos.foto}>
          {producto.imagenUrl ? (
            <Image source={{ uri: urlDeImagen(producto.imagenUrl) }} style={estilos.imagen} />
          ) : null}
        </View>
        <View style={estilos.datos}>
          <Text style={estilos.nombre} numberOfLines={2}>
            {producto.nombre}
          </Text>
          {resena ? (
            <Etiqueta
              texto={ETIQUETAS_ESTADO_RESENA[resena.estado]}
              tono={tonoDeEstadoResena(resena.estado)}
            />
          ) : null}
        </View>
      </View>

      <View style={estilos.estrellas}>
        {ESCALA.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} estrellas`}
            disabled={!abierto}
            onPress={() => setEstrellas(n)}
            hitSlop={4}
          >
            {n <= estrellas ? (
              <IconoEstrellaRellena tamano={26} color={t.color.calificacion} />
            ) : (
              <IconoEstrella tamano={26} color={t.color.textoTenue} />
            )}
          </Pressable>
        ))}
      </View>

      {abierto ? (
        <>
          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder="¿Qué te pareció? (opcional)"
            placeholderTextColor={t.color.textoTenue}
            multiline
            maxLength={MAX_LETRAS_COMENTARIO}
            style={estilos.comentario}
          />
          {error ? <Text style={estilos.error}>{error}</Text> : null}
          <BotonPrincipal
            texto={resena ? "Guardar cambios" : "Publicar reseña"}
            onPress={guardar}
            cargando={guardando}
          />
        </>
      ) : (
        <>
          {resena?.comentario ? <Text style={estilos.texto}>{resena.comentario}</Text> : null}
          {resena?.estado === "APROBADA" ? null : (
            <Pressable accessibilityRole="button" onPress={() => setEditando(true)}>
              <Text style={estilos.enlace}>Editar reseña</Text>
            </Pressable>
          )}
        </>
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
    gap: t.espacio[2],
  },
  nombre: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  estrellas: {
    flexDirection: "row",
    gap: t.espacio[2],
  },
  comentario: {
    minHeight: t.espacio[24],
    padding: t.espacio[3],
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoControl,
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    textAlignVertical: "top",
  },
  texto: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  enlace: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xs,
    fontWeight: "600",
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
