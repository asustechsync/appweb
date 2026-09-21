/** Genero del perfil. Opcional: nadie esta obligado a decirlo. */
export const GENEROS = ["MASCULINO", "FEMENINO", "OTRO", "PREFIERO_NO_DECIR"] as const;

export type Genero = (typeof GENEROS)[number];

export const ETIQUETA_GENERO: Record<Genero, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  OTRO: "Otro",
  PREFIERO_NO_DECIR: "Prefiero no decir",
};
