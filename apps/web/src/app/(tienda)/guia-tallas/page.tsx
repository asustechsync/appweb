import type { Metadata } from "next";

import { PaginaInformativa } from "@appweb/ui";

/** Contenido estatico, sin base de datos: no necesita "use cache". */
export const metadata: Metadata = {
  title: "Guía de Tallas | SOCKS",
  description: "Tabla de tallas para boxers, calzones y medias, por edad y medida.",
};

export default function PaginaGuiaTallas() {
  return (
    <PaginaInformativa titulo="Guía de Tallas">
      <p>
        Toma la medida de cintura o de pie antes de comprar. Si tu medida cae entre dos
        tallas, elige la mayor.
      </p>

      <h2>Boxers y calzones — adultos</h2>
      <div className="ui-pagina-informativa__tabla-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Talla</th>
              <th>Cintura (cm)</th>
              <th>Cintura (in)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S</td>
              <td>70 – 78</td>
              <td>28 – 31</td>
            </tr>
            <tr>
              <td>M</td>
              <td>79 – 87</td>
              <td>31 – 34</td>
            </tr>
            <tr>
              <td>L</td>
              <td>88 – 96</td>
              <td>35 – 38</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>97 – 106</td>
              <td>38 – 42</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Básicos — bebés y niños</h2>
      <div className="ui-pagina-informativa__tabla-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Talla</th>
              <th>Edad aproximada</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3M</td>
              <td>0 – 3 meses</td>
            </tr>
            <tr>
              <td>6M</td>
              <td>3 – 6 meses</td>
            </tr>
            <tr>
              <td>12M</td>
              <td>6 – 12 meses</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Medias</h2>
      <p>
        La talla de medias se mide por el número de calzado, no por edad ni por cintura.
      </p>
      <div className="ui-pagina-informativa__tabla-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Talla</th>
              <th>Número de calzado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>6</td>
              <td>22 – 25</td>
            </tr>
            <tr>
              <td>8</td>
              <td>26 – 29</td>
            </tr>
            <tr>
              <td>10</td>
              <td>30 – 33</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        ¿Tu medida no coincide con ninguna talla o tienes dudas sobre un producto puntual?
        Escríbenos por <a href="/ayuda/contacto">contacto</a>.
      </p>
    </PaginaInformativa>
  );
}
