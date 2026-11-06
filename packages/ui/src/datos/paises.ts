export interface Pais {
  /** ISO 3166-1 alpha-2 en minuscula, para flag-icons ("pe", "us"). */
  iso2: string;
  nombre: string;
  /** Prefijo telefonico sin el "+". */
  prefijo: string;
}

/**
 * La tienda vende solo en Tacna: primero Peru y sus fronteras (Chile, Bolivia), luego
 * la region y los paises desde donde llegan clientes o envios. Para ampliar, se
 * añade aqui y se corre `npm run ui:banderas`.
 */
export const PAISES: Pais[] = [
  { iso2: "pe", nombre: "Perú", prefijo: "51" },
  { iso2: "cl", nombre: "Chile", prefijo: "56" },
  { iso2: "bo", nombre: "Bolivia", prefijo: "591" },
  { iso2: "ec", nombre: "Ecuador", prefijo: "593" },
  { iso2: "br", nombre: "Brasil", prefijo: "55" },
  { iso2: "co", nombre: "Colombia", prefijo: "57" },
  { iso2: "ar", nombre: "Argentina", prefijo: "54" },
  { iso2: "us", nombre: "Estados Unidos", prefijo: "1" },
  { iso2: "es", nombre: "España", prefijo: "34" },
  { iso2: "ve", nombre: "Venezuela", prefijo: "58" },
  { iso2: "mx", nombre: "México", prefijo: "52" },
  { iso2: "pa", nombre: "Panamá", prefijo: "507" },
];
