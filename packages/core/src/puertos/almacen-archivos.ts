/**
 * Donde viven los archivos que sube el panel (fotos de producto). Quien sube
 * solo conoce esta interfaz: cambiar de Supabase a S3 o Cloudinary es
 * escribir otra clase, no tocar el panel.
 */
export interface AlmacenArchivos {
  readonly nombre: string;
  /** Guarda el archivo y devuelve la URL publica con la que se muestra. */
  subir(ruta: string, contenido: Uint8Array<ArrayBuffer>, tipo: string): Promise<{ url: string }>;
  /** Borra por URL publica. Una URL que no es de este almacen se ignora. */
  borrar(url: string): Promise<void>;
}

/**
 * Supabase Storage por su API HTTP: sin SDK, un `fetch`, como el correo. El
 * bucket tiene que existir y ser publico (las fotos se ven sin sesion).
 */
export class AlmacenSupabase implements AlmacenArchivos {
  readonly nombre = "Supabase Storage";

  constructor(
    private readonly config: {
      /** https://<proyecto>.supabase.co */
      url: string;
      /** Clave service_role: solo en el servidor, nunca en el navegador. */
      clave: string;
      bucket: string;
    },
  ) {}

  private get prefijoPublico(): string {
    return `${this.config.url}/storage/v1/object/public/${this.config.bucket}/`;
  }

  private cabeceras(): Record<string, string> {
    return { authorization: `Bearer ${this.config.clave}`, apikey: this.config.clave };
  }

  async subir(
    ruta: string,
    contenido: Uint8Array<ArrayBuffer>,
    tipo: string,
  ): Promise<{ url: string }> {
    const respuesta = await fetch(
      `${this.config.url}/storage/v1/object/${this.config.bucket}/${ruta}`,
      {
        method: "POST",
        headers: {
          ...this.cabeceras(),
          "content-type": tipo,
          // Cada foto tiene nombre unico y no cambia: se puede cachear un año.
          "cache-control": "max-age=31536000",
          "x-upsert": "false",
        },
        body: contenido,
      },
    );
    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      throw new Error(`Supabase Storage respondió ${respuesta.status}: ${detalle.slice(0, 200)}`);
    }
    return { url: `${this.prefijoPublico}${ruta}` };
  }

  async borrar(url: string): Promise<void> {
    if (!url.startsWith(this.prefijoPublico)) return;
    const ruta = url.slice(this.prefijoPublico.length);
    await fetch(`${this.config.url}/storage/v1/object/${this.config.bucket}/${ruta}`, {
      method: "DELETE",
      headers: this.cabeceras(),
    });
  }
}
