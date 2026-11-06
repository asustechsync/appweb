/**
 * Las fuentes del proyecto para la app movil: las mismas familias que declara
 * `DocumentoRaiz.tsx` para la web (Manrope en el texto, Poppins en los titulos).
 *
 * En React Native cada peso es un archivo con su propio nombre de familia y
 * `fontWeight` no elige entre ellos: un texto pide su peso con
 * `fontFamily: FUENTE_NATIVA.texto[600]`, no con `fontWeight`.
 *
 * Satoshi y Bai Jamjuree (la cifra de `TarjetaMetrica`) aun no: Satoshi solo
 * existe aqui como .woff, que React Native no lee.
 */

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

/** Lo que carga la app al arrancar (`useFonts` de expo-font). */
export const ARCHIVOS_FUENTES_NATIVAS = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
};

type Familia = keyof typeof ARCHIVOS_FUENTES_NATIVAS;

/** Nombre de familia por uso y peso. */
export const FUENTE_NATIVA = {
  texto: {
    400: "Manrope_400Regular",
    500: "Manrope_500Medium",
    600: "Manrope_600SemiBold",
    700: "Manrope_700Bold",
  },
  titulos: {
    400: "Poppins_400Regular",
    500: "Poppins_500Medium",
    600: "Poppins_600SemiBold",
    700: "Poppins_700Bold",
  },
} as const satisfies Record<"texto" | "titulos", Record<400 | 500 | 600 | 700, Familia>>;
