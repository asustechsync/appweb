# Guía reutilizable de conceptos de cards

Documento de referencia para diseñar cards con cualquier asistente de IA. Resume patrones observados en el archivo comunitario de Figma **100 card design templates UI kit** y los adapta como criterios para la tienda de básicos.

> El archivo de Figma contiene plantillas genéricas, no 100 cards de producto. Los patrones de abajo describen estructuras visuales observadas; las recomendaciones para ropa son una adaptación al catálogo de esta tienda.

## Fuente visual

- Archivo Figma: [100 card design templates UI kit — Community](https://www.figma.com/design/P3xKwcE6mL2hiaHei1dg1U/100-card-design-templates-UI-kit--Community-?node-id=416-1246)
- Página **Vertical 50**: tarjetas altas; buenas para fotos, perfiles, productos, contenido editorial y resúmenes.
- Página **Horizontal 50**: tarjetas apaisadas; buenas para filas compactas, resultados, actividad y contenido con imagen lateral.
- Página **Local components**: piezas repetibles como etiquetas y elementos de identidad.

## Principios que se repiten

1. **Una jerarquía principal.** Un título o dato lidera; subtítulo y metadatos tienen menor peso.
2. **Imagen con función clara.** Puede ser protagonista en un bloque superior, miniatura junto al texto o fondo de una sección.
3. **Agrupar metadatos.** Estado, fecha, categoría, valoración o etiquetas se presentan como una fila, grupo o zona secundaria.
4. **Separar contenido y acción.** El CTA puede ocupar el pie completo o quedar alineado al lado del contenido.
5. **Usar divisores con moderación.** Espaciado y contraste suave suelen bastar; una línea sirve para separar grupos densos.
6. **Elegir orientación según contenido.** Vertical cuando imagen y lectura necesitan espacio; horizontal cuando se comparan o recorren muchos elementos.
7. **Repetir patrones.** Miniaturas, etiquetas, estadísticas y filas se mantienen consistentes dentro de una misma tarjeta.
8. **Mantener límites de contenido.** Títulos breves, descripción corta y metadatos acotados evitan alturas impredecibles.

## Familias de patrones observadas

### Cards verticales

- **Imagen + contenido + acción:** imagen arriba; título, texto corto y botón debajo.
- **Imagen con pie integrado:** la imagen ocupa la mitad o más; el bloque inferior funciona como pie editorial.
- **Contenido centrado:** imagen o avatar centrado, título y descripción centrados, etiqueta o botón al final.
- **Cabecera con identidad:** avatar/logo, título y subtítulo arriba; texto o datos organizados abajo.
- **Lista dentro de una card:** varias filas con miniatura, título y descripción breve.
- **Contenido por secciones:** títulos secundarios y divisores para separar información relacionada.
- **Progreso o métrica:** indicador visual destacado con etiqueta y texto de contexto.
- **Galería o mosaico:** varias imágenes pequeñas dentro de un mismo bloque.
- **Card con etiquetas:** chips al final o junto al texto para resumir estados o categorías.
- **Imagen de fondo con texto superpuesto:** útil para promoción/editorial; requiere contraste suficiente.

### Cards horizontales

- **Miniatura + texto:** imagen/avatar a la izquierda y título con descripción a la derecha.
- **Contenido + metadato lateral:** fecha, estado, número o acción en el extremo derecho.
- **Franja de estado:** banda estrecha de color que codifica una categoría sin teñir toda la tarjeta.
- **Texto con etiquetas:** descripción breve seguida por una fila de chips.
- **Fila de métricas:** varias cifras o detalles alineados horizontalmente.
- **Resumen con acción:** contenido principal ocupa el ancho y botón secundario queda al extremo.
- **Fila de lista:** miniatura pequeña, dos líneas de texto y metadatos compactos; adecuada para resultados.
- **Progreso o estado:** barra/indicador acompañado por texto y etiqueta.
- **Varias secciones en línea:** grupos de detalles separados por espacio o divisor vertical.

## Adaptación recomendada para cards de ropa

### Orden de información

1. **Área de foto:** producto completo, recorte consistente y fondo neutro.
2. **Señales sobre la foto:** favorito y una etiqueta prioritaria, por ejemplo `NUEVO` o `OFERTA`.
3. **Marca y valoración:** metadatos discretos, en la misma fila cuando quepan.
4. **Nombre del producto:** máximo dos líneas en las cards de catálogo.
5. **Precio:** fácil de localizar; precio anterior y descuento solo si aplican.
6. **Variante:** color o talla disponible, solo cuando ayude a elegir antes de entrar a la ficha.
7. **Acción:** botón de compra si el flujo permite comprar desde la card; de lo contrario, enlace claro a la ficha.

### Tres composiciones base

#### A. Catálogo compacto vertical

Foto grande arriba, insignia discreta, marca/valoración, título de dos líneas y precio. Mantener talla/color resumidos y llevar la selección completa a la ficha.

#### B. Compra rápida vertical

Foto arriba; nombre y precio; selector pequeño de talla/color; botón de ancho completo en el pie. Usar solo si la compra rápida está implementada y la variante seleccionada queda inequívoca.

#### C. Resultado horizontal

Miniatura cuadrada o vertical a la izquierda; marca, nombre y precio al centro; etiquetas/variantes y acción a la derecha en pantallas amplias. En móvil, pasar la acción debajo del texto.

## Criterios para elegir un patrón

- **Catálogo con muchas opciones:** tarjeta vertical compacta para facilitar el escaneo.
- **Producto destacado o campaña:** imagen grande y composición editorial, con una sola etiqueta de promoción.
- **Compra desde el listado:** tarjeta de compra rápida; solo si talla y color pueden seleccionarse sin ambigüedad.
- **Búsqueda o lista de guardados:** patrón horizontal con miniatura, nombre y precio.
- **Pantalla estrecha:** priorizar foto, nombre y precio; mover detalles secundarios a la ficha.
- **Información densa:** separar en grupos claros y limitar el número de chips.

## Reglas visuales del proyecto

- Mobile-first: estilos base para móvil; los quiebres añaden opciones para pantallas mayores.
- Usar los tokens y primitivos existentes de `packages/ui`; no fijar colores, espacios, radios ni sombras dentro de páginas.
- Paleta compartida: lienzo gris claro, superficies blancas, texto grafito, bordes muy sutiles y acento pistacho reservado.
- La imagen debe mantener una proporción y tratamiento consistentes entre productos.
- Las etiquetas no deben competir con el nombre ni el precio.
- No inventar valoraciones, descuentos, stock, tallas, colores ni datos del producto.
- No distorsionar el producto para encajarlo en la tarjeta; usar `object-fit: contain` cuando la foto necesite mostrar la prenda completa.
- Mantener controles accesibles, objetivos táctiles cómodos y nombres explícitos para botones de icono.

## Lista de revisión

- [ ] Se identifica el producto rápidamente.
- [ ] Imagen, título y precio tienen una jerarquía clara.
- [ ] La card sigue siendo legible en móvil y con textos largos.
- [ ] Etiquetas y valoración solo aparecen cuando hay datos reales.
- [ ] Color y talla visibles corresponden a variantes disponibles.
- [ ] La acción principal tiene un destino/efecto inequívoco.
- [ ] Todas las cards del mismo listado conservan alineación y ritmo visual.
- [ ] El diseño usa tokens y componentes compartidos del proyecto.

## Prompt base para reutilizar con una IA

```text
Diseña una card de producto mobile-first para una tienda de ropa interior y básicos.
Usa como referencia estructural la familia [VERTICAL/HORIZONTAL] de la guía de cards.
Producto: [nombre real]. Marca: [marca]. Precio: [precio real]. Variantes disponibles: [tallas/colores reales]. Datos opcionales confirmados: [valoración, oferta, envío].
Prioriza [foto / precio / compra rápida]. Usa una jerarquía clara, composición limpia,
fondo neutro y espacio suficiente. No inventes datos ni cambies el producto.
Entrega estados normal, oferta/agotado (si corresponde) y comportamiento adaptable
a móvil/escritorio. Sigue los tokens y componentes existentes del proyecto.
```