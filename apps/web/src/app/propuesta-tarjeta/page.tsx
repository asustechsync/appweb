import Image from "next/image";
import Link from "next/link";

import "./propuesta-tarjeta.css";

const productos = [
  { id: "01", marca: "QILING", nombre: "Boxer estampado azul", precio: "S/ 39.90", anterior: "S/ 49.90", descuento: "−20%", categoria: "BOXERS" },
  { id: "02", marca: "BOSTON", nombre: "Medias antideslizantes", precio: "S/ 18.90", anterior: "S/ 24.90", descuento: "−24%", categoria: "MEDIAS" },
];

function FotoProducto({ segunda = false }: { segunda?: boolean }) {
  return <Image className={segunda ? "concepto__imagen concepto__imagen--alternativa" : "concepto__imagen"} src="/producto.webp" alt="Boxer estampado azul" width={480} height={480} priority />;
}

export default function PropuestaTarjeta() {
  return (
    <main className="propuesta">
      <header className="propuesta__cabecera">
        <span className="propuesta__sobrelinea">PROPUESTAS · TARJETA VERTICAL</span>
        <h1>Dos opciones para el carrusel</h1>
        <p>Conservamos el formato vertical de tu portada y damos más claridad al precio, las etiquetas y la acción.</p>
      </header>

      <div className="propuesta__opciones">
        <article className="opcion">
          <header className="opcion__cabecera"><span className="opcion__numero">01</span><div><h2>Clásica mejorada</h2><p>Se parece a la actual, con mejor jerarquía.</p></div></header>
          <section className="tarjeta tarjeta--clasica" aria-label="Tarjeta vertical clásica mejorada">
            <div className="tarjeta__foto tarjeta__foto--referencia"><div className="tarjeta__etiquetas"><span className="etiqueta etiqueta--nuevo">NUEVO</span></div><button className="tarjeta__favorito tarjeta__favorito--referencia" aria-label="Guardar en favoritos">♡</button><FotoProducto /><div className="tarjeta__ahorro-foto"><span>−20%</span><b>Oferta</b></div></div>
            <div className="tarjeta__datos tarjeta__datos--referencia"><div className="tarjeta__linea-marca"><span className="tarjeta__marca">{productos[0].marca}</span><span className="tarjeta__valoracion"><b>★ 4.9</b><i /> 621</span></div><h3>{productos[0].nombre}</h3>
              <div className="tarjeta__precio tarjeta__precio--referencia"><strong>{productos[0].precio}</strong><del>{productos[0].anterior}</del><span>Ahorra 20%</span></div>
              <div className="tarjeta__variantes"><span className="tarjeta__variante-activa">Talla <b>M</b>⌄</span><span className="tarjeta__dato-chip">BOXER</span></div>
              <Link className="tarjeta__boton tarjeta__boton--referencia" href="/productos">Ver producto <b>↗</b></Link>
            </div>
          </section>
          <p className="opcion__resumen">Imagen, valoración, precio y variante en una sola columna.</p>
        </article>

        <article className="opcion">
          <header className="opcion__cabecera"><span className="opcion__numero">02</span><div><h2>Compra destacada</h2><p>Más simple. Más clara.</p></div></header>
          <section className="tarjeta tarjeta--destacada" aria-label="Tarjeta vertical de compra destacada">
            <div className="tarjeta__foto tarjeta__foto--destacada"><div className="tarjeta__etiquetas"><span className="etiqueta etiqueta--oferta">−24%</span></div><FotoProducto segunda /></div>
            <div className="tarjeta__datos tarjeta__datos--destacada"><span className="tarjeta__marca">{productos[1].marca}</span><h3>{productos[1].nombre}</h3><div className="tarjeta__etiquetas-info"><span className="tarjeta__top">TOP</span><span className="tarjeta__atributo">SUAVE</span></div>
              <div className="tarjeta__precio tarjeta__precio--destacada"><strong>{productos[1].precio}</strong><del>{productos[1].anterior}</del></div>
              <div className="tarjeta__tallas" aria-label="Tallas disponibles"><div><i>S</i><i>M</i><i>L</i><i>XL</i></div></div>
            </div>
          </section>
          <p className="opcion__resumen">Solo producto, precio y tallas.</p>
        </article>
      </div>
      <section className="propuesta__nuevas" aria-labelledby="nuevas-propuestas">
        <header className="propuesta__nuevas-cabecera"><span className="propuesta__sobrelinea">NUEVAS RUTAS</span><h2 id="nuevas-propuestas">Más detalle, mismo formato</h2><p>Dos variaciones modernas basadas en la tarjeta que compartiste.</p></header>
        <div className="propuesta__opciones">
          <article className="opcion">
            <header className="opcion__cabecera"><span className="opcion__numero">03</span><div><h2>Esencial</h2><p>Lo importante, bien ordenado.</p></div></header>
            <section className="tarjeta tarjeta--nueva tarjeta--esencial" aria-label="Propuesta moderna esencial">
              <div className="tarjeta__foto"><div className="tarjeta__etiquetas"><span className="etiqueta etiqueta--oferta">OFERTA</span></div><FotoProducto /></div>
              <div className="tarjeta__datos tarjeta__datos--nueva"><span className="tarjeta__marca">BOSTON</span><h3>Medias antideslizantes para bebé</h3><div className="tarjeta__badges"><span className="tarjeta__top">TOP</span><span className="tarjeta__dato-chip">Suela segura</span></div>
                <div className="tarjeta__precio"><strong>S/ 10.90</strong><del>S/ 14.90</del></div><div className="tarjeta__nota-corta">Suaves todo el día</div>
              </div>
            </section>
            <p className="opcion__resumen">Agrega una ventaja breve sin quitar foco al precio.</p>
          </article>

          <article className="opcion">
            <header className="opcion__cabecera"><span className="opcion__numero">04</span><div><h2>Selección</h2><p>Un acento editorial y tallas visibles.</p></div></header>
            <section className="tarjeta tarjeta--nueva tarjeta--seleccion" aria-label="Propuesta moderna selección">
              <div className="tarjeta__foto"><div className="tarjeta__etiquetas"><span className="etiqueta etiqueta--nuevo">NUEVO</span><span className="etiqueta etiqueta--oferta">−27%</span></div><FotoProducto segunda /><span className="tarjeta__contador-foto">01 / 04</span></div>
              <div className="tarjeta__datos tarjeta__datos--nueva"><div className="tarjeta__linea-marca"><span className="tarjeta__marca">BOSTON</span><span className="tarjeta__disponible"><i />En stock</span></div><h3>Medias antideslizantes acolchadas para bebé</h3><div className="tarjeta__badges"><span className="tarjeta__top">TOP</span><span className="tarjeta__dato-chip">Pack x3</span></div>
                <div className="tarjeta__precio"><strong>S/ 10.90</strong><del>S/ 14.90</del></div><div className="tarjeta__tallas tarjeta__tallas--nueva"><i>0–6 m</i><i>6–12 m</i><i>12–24 m</i></div>
              </div>
            </section>
            <p className="opcion__resumen">Añade stock y presentación del pack en un bloque compacto.</p>
          </article>
        </div>
      </section>
      <footer className="propuesta__nota">Maqueta visual de referencia. Los datos mostrados son de ejemplo.</footer>
    </main>
  );
}
