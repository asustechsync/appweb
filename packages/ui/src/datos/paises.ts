export interface Pais {
  /** ISO 3166-1 alpha-2 en minuscula, para flag-icons ("pe", "us"). */
  iso2: string;
  nombre: string;
  /** Prefijo telefonico sin el "+". */
  prefijo: string;
}

/**
 * Paises frecuentes primero: son los que se muestran por defecto en
 * `SelectorPais` antes de escribir nada, para no pintar las ~190 banderas
 * de golpe. El resto solo aparece al buscar por nombre o prefijo.
 */
export const PAISES: Pais[] = [
  { iso2: "pe", nombre: "Perú", prefijo: "51" },
  { iso2: "cl", nombre: "Chile", prefijo: "56" },
  { iso2: "bo", nombre: "Bolivia", prefijo: "591" },
  { iso2: "co", nombre: "Colombia", prefijo: "57" },
  { iso2: "ec", nombre: "Ecuador", prefijo: "593" },
  { iso2: "ar", nombre: "Argentina", prefijo: "54" },
  { iso2: "mx", nombre: "México", prefijo: "52" },
  { iso2: "br", nombre: "Brasil", prefijo: "55" },
  { iso2: "uy", nombre: "Uruguay", prefijo: "598" },
  { iso2: "py", nombre: "Paraguay", prefijo: "595" },
  { iso2: "ve", nombre: "Venezuela", prefijo: "58" },
  { iso2: "pa", nombre: "Panamá", prefijo: "507" },
  { iso2: "cr", nombre: "Costa Rica", prefijo: "506" },
  { iso2: "gt", nombre: "Guatemala", prefijo: "502" },
  { iso2: "hn", nombre: "Honduras", prefijo: "504" },
  { iso2: "sv", nombre: "El Salvador", prefijo: "503" },
  { iso2: "ni", nombre: "Nicaragua", prefijo: "505" },
  { iso2: "do", nombre: "República Dominicana", prefijo: "1809" },
  { iso2: "cu", nombre: "Cuba", prefijo: "53" },
  { iso2: "us", nombre: "Estados Unidos", prefijo: "1" },
  { iso2: "ca", nombre: "Canadá", prefijo: "1" },
  { iso2: "es", nombre: "España", prefijo: "34" },
  { iso2: "pt", nombre: "Portugal", prefijo: "351" },
  { iso2: "fr", nombre: "Francia", prefijo: "33" },
  { iso2: "de", nombre: "Alemania", prefijo: "49" },
  { iso2: "it", nombre: "Italia", prefijo: "39" },
  { iso2: "gb", nombre: "Reino Unido", prefijo: "44" },
  { iso2: "nl", nombre: "Países Bajos", prefijo: "31" },
  { iso2: "ch", nombre: "Suiza", prefijo: "41" },
  { iso2: "jp", nombre: "Japón", prefijo: "81" },
  { iso2: "cn", nombre: "China", prefijo: "86" },
  { iso2: "kr", nombre: "Corea del Sur", prefijo: "82" },
  { iso2: "au", nombre: "Australia", prefijo: "61" },
  { iso2: "in", nombre: "India", prefijo: "91" },
];
