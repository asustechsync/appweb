import { type ReactNode, useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

interface PropsAparecer {
  /** Posicion en la secuencia: cada paso entra un poco despues del anterior. */
  orden: number;
  /** Cuando cambia, la animacion vuelve a empezar (por ejemplo, el modo de una pantalla). */
  disparador: unknown;
  /** Margenes del bloque: van en el envoltorio para que el hueco con el vecino no cambie. */
  estilo?: StyleProp<ViewStyle>;
  children: ReactNode;
}

const DURACION = 260;
const PASO = 50;
const DESPLAZAMIENTO = 10;

/**
 * Entrada escalonada: sube unos pixeles mientras aparece, con un retraso segun
 * `orden`. No desmonta a sus hijos, asi que un campo conserva lo escrito.
 */
export function Aparecer({ orden, disparador, estilo, children }: PropsAparecer) {
  const avance = useRef(new Animated.Value(0)).current;

  // biome-ignore lint/correctness/useExhaustiveDependencies: solo el disparador reinicia la entrada
  useEffect(() => {
    avance.setValue(0);
    Animated.timing(avance, {
      toValue: 1,
      duration: DURACION,
      delay: orden * PASO,
      useNativeDriver: true,
    }).start();
  }, [disparador]);

  return (
    <Animated.View
      style={[
        estilo,
        {
          opacity: avance,
          transform: [
            {
              translateY: avance.interpolate({
                inputRange: [0, 1],
                outputRange: [DESPLAZAMIENTO, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
