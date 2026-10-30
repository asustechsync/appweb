import { ETIQUETAS_ORDEN, ORDENES } from "@appweb/core/filtros";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BotonPrincipal } from "./BotonPrincipal";

/** Los filtros con la misma forma que en la URL de la web: los valida el servidor. */
export type Filtros = Record<string, string>;

interface Facetas {
  tallas: string[];
  colores: string[];
  marcas: { slug: string; nombre: string }[];
}

interface PropsPanelFiltros {
  visible: boolean;
  facetas: Facetas;
  filtros: Filtros;
  onAplicar: (filtros: Filtros) => void;
  onCerrar: () => void;
}

/**
 * Hoja que sube desde abajo con orden, talla, color, marca, ofertas y stock.
 * Los cambios quedan en borrador hasta tocar "Ver resultados".
 */
export function PanelFiltros({
  visible,
  facetas,
  filtros,
  onAplicar,
  onCerrar,
}: PropsPanelFiltros) {
  const margenes = useSafeAreaInsets();
  const [borrador, setBorrador] = useState<Filtros>(filtros);

  // Al abrir, el borrador parte de lo que ya esta aplicado.
  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  function elegir(clave: string, valor: string) {
    setBorrador((actual) => {
      const siguiente = { ...actual };
      // Tocar la opcion elegida la quita.
      if (siguiente[clave] === valor) delete siguiente[clave];
      else siguiente[clave] = valor;
      return siguiente;
    });
  }

  function interruptor(clave: string, encendido: boolean) {
    setBorrador((actual) => {
      const siguiente = { ...actual };
      if (encendido) siguiente[clave] = "1";
      else delete siguiente[clave];
      return siguiente;
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={estilos.velo} onPress={onCerrar} accessibilityLabel="Cerrar filtros" />
      <View style={[estilos.hoja, { paddingBottom: Math.max(margenes.bottom, t.espacio[4]) }]}>
        <View style={estilos.asa} />
        <View style={estilos.cabecera}>
          <Text style={estilos.titulo}>Filtros</Text>
          <Pressable accessibilityRole="button" onPress={() => setBorrador({})} hitSlop={8}>
            <Text style={estilos.limpiar}>Limpiar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={estilos.secciones} showsVerticalScrollIndicator={false}>
          <Grupo
            titulo="Ordenar por"
            opciones={ORDENES.map((o) => ({ valor: o, texto: ETIQUETAS_ORDEN[o] }))}
            elegida={borrador.orden ?? "novedades"}
            onElegir={(v) => setBorrador((a) => ({ ...a, orden: v }))}
          />
          {facetas.tallas.length > 0 ? (
            <Grupo
              titulo="Talla"
              opciones={facetas.tallas.map((v) => ({ valor: v, texto: v }))}
              elegida={borrador.talla}
              onElegir={(v) => elegir("talla", v)}
            />
          ) : null}
          {facetas.colores.length > 0 ? (
            <Grupo
              titulo="Color"
              opciones={facetas.colores.map((v) => ({ valor: v, texto: v }))}
              elegida={borrador.color}
              onElegir={(v) => elegir("color", v)}
            />
          ) : null}
          {facetas.marcas.length > 0 ? (
            <Grupo
              titulo="Marca"
              opciones={facetas.marcas.map((m) => ({ valor: m.slug, texto: m.nombre }))}
              elegida={borrador.marca}
              onElegir={(v) => elegir("marca", v)}
            />
          ) : null}
          <Interruptor
            texto="Solo ofertas"
            valor={borrador.ofertas === "1"}
            onCambiar={(v) => interruptor("ofertas", v)}
          />
          <Interruptor
            texto="Solo con stock"
            valor={borrador.stock === "1"}
            onCambiar={(v) => interruptor("stock", v)}
          />
        </ScrollView>

        <BotonPrincipal texto="Ver resultados" onPress={() => onAplicar(borrador)} />
      </View>
    </Modal>
  );
}

interface PropsGrupo {
  titulo: string;
  opciones: { valor: string; texto: string }[];
  elegida: string | undefined;
  onElegir: (valor: string) => void;
}

function Grupo({ titulo, opciones, elegida, onElegir }: PropsGrupo) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.subtitulo}>{titulo}</Text>
      <View style={estilos.opciones}>
        {opciones.map((opcion) => {
          const activa = opcion.valor === elegida;
          return (
            <Pressable
              key={opcion.valor}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              onPress={() => onElegir(opcion.valor)}
              style={[estilos.opcion, activa && estilos.opcionActiva]}
            >
              <Text style={[estilos.textoOpcion, activa && estilos.textoActivo]}>
                {opcion.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Interruptor({
  texto,
  valor,
  onCambiar,
}: {
  texto: string;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
}) {
  return (
    <View style={estilos.interruptor}>
      <Text style={estilos.subtitulo}>{texto}</Text>
      <Switch
        value={valor}
        onValueChange={onCambiar}
        trackColor={{ true: t.color.marca[500], false: t.color.fondoSutil }}
        thumbColor={t.color.fondo}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  velo: {
    flex: 1,
    backgroundColor: t.color.velo,
  },
  hoja: {
    maxHeight: "85%",
    gap: t.espacio[4],
    paddingHorizontal: t.espacio[5],
    paddingTop: t.espacio[2],
    borderTopLeftRadius: t.radio.xl,
    borderTopRightRadius: t.radio.xl,
    backgroundColor: t.color.fondoPortada,
  },
  asa: {
    alignSelf: "center",
    width: t.espacio[10],
    height: t.espacio[1],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondoSutil,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.xl,
    fontWeight: "600",
  },
  limpiar: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "500",
  },
  secciones: {
    gap: t.espacio[5],
    paddingBottom: t.espacio[2],
  },
  grupo: {
    gap: t.espacio[2],
  },
  subtitulo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
    fontWeight: "600",
  },
  opciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.espacio[2],
  },
  opcion: {
    paddingHorizontal: t.espacio[4],
    paddingVertical: t.espacio[2],
    borderRadius: t.radio.completo,
    backgroundColor: t.color.fondo,
    boxShadow: t.sombra.sm,
  },
  opcionActiva: {
    backgroundColor: t.color.marca[500],
  },
  textoOpcion: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.sm,
  },
  textoActivo: {
    color: t.color.textoInverso,
  },
  interruptor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
