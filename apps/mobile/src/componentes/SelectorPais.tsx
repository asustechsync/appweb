import { IconoFlechaAbajo } from "@appweb/ui/iconos.nativos";
import { BANDERAS } from "@appweb/ui/banderas";
import { PAISES, type Pais } from "@appweb/ui/paises";
import { tokensNativos as t } from "@appweb/ui/tokens.native";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";

interface PropsSelectorPais {
  /** iso2 del pais elegido ("pe"). */
  valor: string;
  onCambio: (iso2: string) => void;
}

const SIN_TILDES = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** La misma bandera que pinta la web con `flag-icons` (4:3), como SVG. */
function Bandera({ iso2 }: { iso2: string }) {
  const xml = BANDERAS[iso2];
  return (
    <View style={estilos.bandera}>
      {xml ? <SvgXml xml={xml} width="100%" height="100%" /> : null}
    </View>
  );
}

/**
 * Prefijo telefonico con bandera, como el de la web: un boton con la bandera y
 * el +prefijo que abre una hoja con buscador por nombre o prefijo.
 */
export function SelectorPais({ valor, onCambio }: PropsSelectorPais) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const elegido: Pais = PAISES.find((p) => p.iso2 === valor) ?? PAISES[0]!;

  const visibles = useMemo(() => {
    const termino = SIN_TILDES(busqueda.trim().toLowerCase());
    if (termino === "") return PAISES;
    return PAISES.filter(
      (p) => SIN_TILDES(p.nombre.toLowerCase()).includes(termino) || p.prefijo.includes(termino),
    );
  }, [busqueda]);

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Prefijo telefónico: +${elegido.prefijo}, ${elegido.nombre}`}
        onPress={() => setAbierto(true)}
        style={estilos.boton}
      >
        <Bandera iso2={elegido.iso2} />
        <Text style={estilos.prefijo}>+{elegido.prefijo}</Text>
        <IconoFlechaAbajo tamano={12} color={t.color.textoSuave} />
      </Pressable>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={cerrar}>
        <Pressable style={estilos.velo} onPress={cerrar} accessibilityLabel="Cerrar" />
        <View style={estilos.hoja}>
          <TextInput
            autoFocus
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar país o prefijo"
            placeholderTextColor={`${t.color.textoSuave}4D`}
            style={estilos.buscador}
          />
          <FlatList
            data={visibles}
            keyExtractor={(p) => p.iso2}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={estilos.vacio}>Sin resultados</Text>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onCambio(item.iso2);
                  cerrar();
                }}
                style={[estilos.opcion, item.iso2 === elegido.iso2 && estilos.opcionActiva]}
              >
                <Bandera iso2={item.iso2} />
                <Text style={estilos.nombre}>{item.nombre}</Text>
                <Text style={estilos.prefijoOpcion}>+{item.prefijo}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  boton: {
    height: t.espacio[12],
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[2],
    paddingHorizontal: t.espacio[3],
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoBloque,
  },
  bandera: {
    width: 24,
    height: 18,
    overflow: "hidden",
    borderRadius: t.radio.sm / 2,
  },
  prefijo: {
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
  },
  velo: {
    flex: 1,
    backgroundColor: t.color.velo,
  },
  hoja: {
    maxHeight: "70%",
    gap: t.espacio[3],
    padding: t.espacio[4],
    borderTopLeftRadius: t.radio.xl,
    borderTopRightRadius: t.radio.xl,
    backgroundColor: t.color.fondoPortada,
  },
  buscador: {
    height: t.espacio[12],
    paddingHorizontal: t.espacio[4],
    borderRadius: t.radio.md,
    backgroundColor: t.color.fondoBloque,
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.espacio[3],
    paddingVertical: t.espacio[3],
    paddingHorizontal: t.espacio[2],
    borderRadius: t.radio.md,
  },
  opcionActiva: {
    backgroundColor: t.color.fondoBloque,
  },
  nombre: {
    flex: 1,
    color: t.color.texto,
    fontSize: t.tipo.tamano.base,
  },
  prefijoOpcion: {
    color: t.color.textoSuave,
    fontSize: t.tipo.tamano.sm,
  },
  vacio: {
    padding: t.espacio[4],
    color: t.color.textoSuave,
    textAlign: "center",
  },
});
