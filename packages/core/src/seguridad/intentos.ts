/**
 * Limite de intentos por ventana deslizante: "como mucho N en los ultimos X
 * minutos". Frena a quien prueba claves al azar o llena formularios con un
 * script.
 *
 * Vive en memoria del proceso. En un servidor con varias instancias cada una
 * lleva su propia cuenta, asi que el limite real es N por instancia: no es una
 * cerradura perfecta, pero vuelve inutil un ataque de fuerza bruta sin tabla
 * nueva ni servicio externo. Si algun dia hace falta un limite exacto, se
 * cambia esta clase por una con Redis y quien la usa no se entera.
 */

export interface RevisionIntento {
  permitido: boolean;
  /** Cuanto falta para que se libere un intento. 0 si esta permitido. */
  reintentarEnMs: number;
}

/** Por encima de esto se barren las claves vencidas, para no crecer sin fin. */
const MAXIMO_CLAVES = 10_000;

export class LimiteDeIntentos {
  private readonly registros = new Map<string, number[]>();

  constructor(
    private readonly maximo: number,
    private readonly ventanaMs: number,
  ) {}

  private vigentes(clave: string, ahora: number): number[] {
    const desde = ahora - this.ventanaMs;
    const marcas = (this.registros.get(clave) ?? []).filter((marca) => marca > desde);
    if (marcas.length === 0) this.registros.delete(clave);
    else this.registros.set(clave, marcas);
    return marcas;
  }

  /** Mira si queda cupo, sin gastarlo. */
  revisar(clave: string, ahora: number = Date.now()): RevisionIntento {
    const marcas = this.vigentes(clave, ahora);
    if (marcas.length < this.maximo) return { permitido: true, reintentarEnMs: 0 };
    const masVieja = marcas[0] ?? ahora;
    return { permitido: false, reintentarEnMs: masVieja + this.ventanaMs - ahora };
  }

  /** Gasta un intento. */
  registrar(clave: string, ahora: number = Date.now()): void {
    if (this.registros.size > MAXIMO_CLAVES) this.barrer(ahora);
    const marcas = this.vigentes(clave, ahora);
    marcas.push(ahora);
    this.registros.set(clave, marcas);
  }

  /** Revisa y, si hay cupo, lo gasta en el mismo paso. */
  consumir(clave: string, ahora: number = Date.now()): RevisionIntento {
    const revision = this.revisar(clave, ahora);
    if (revision.permitido) this.registrar(clave, ahora);
    return revision;
  }

  /** Borra la cuenta de una clave, p. ej. al acertar la contraseña. */
  limpiar(clave: string): void {
    this.registros.delete(clave);
  }

  private barrer(ahora: number): void {
    for (const clave of [...this.registros.keys()]) this.vigentes(clave, ahora);
  }
}

/** "Demasiados intentos. Vuelve a intentarlo en 12 minutos." */
export function mensajeDeEspera(reintentarEnMs: number): string {
  const minutos = Math.max(1, Math.ceil(reintentarEnMs / 60_000));
  return `Demasiados intentos. Vuelve a intentarlo en ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`;
}
