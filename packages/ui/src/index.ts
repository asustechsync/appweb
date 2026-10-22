export { tokens, tokensOscuro, type Tokens } from "./tokens";
export { GUION_TEMA, TEMA_LLAVE, type Tema } from "./tema";
export { GuionTemaInicial } from "./GuionTemaInicial";
export { DocumentoRaiz } from "./DocumentoRaiz";

// Iconos que las paginas necesitan pasar como prop (ej. NavegacionSecciones).
// El resto de los iconos son detalle interno de cada primitivo y no hace
// falta exponerlos aqui.
export {
  type PropsIcono,
  IconoEtiqueta,
  IconoPregunta,
  IconoMoneda,
  IconoDevolucion,
  IconoCategoria,
  IconoProveedor,
  IconoPack,
  IconoMarca,
  IconoTicket,
  IconoCamion,
  IconoGaleria,
  IconoInicio,
  IconoClientes,
  IconoVentas,
  IconoCatalogo,
  IconoOpiniones,
  IconoPromociones,
  IconoCarrito,
  IconoPapelera,
  IconoOpciones,
  IconoCorreo,
  IconoCandado,
  IconoTelefono,
  IconoFlechaIzquierda,
  IconoPedidos,
  IconoUbicacion,
  IconoUsuario,
  IconoTarjetaPersonal,
  IconoLuna,
  IconoSoporte,
  IconoGlobo,
  IconoPerfil,
  IconoEscudo,
  IconoConfiguracion,
  IconoPremio,
  IconoFavorito,
  IconoLibro,
  IconoBuscar,
  IconoEstrella,
} from "./iconos";

// Primitivos. Las paginas importan de aqui y nunca escriben estilos propios.
// Se van añadiendo conforme hagan falta; cada uno con su CSS en
// src/componentes/<familia>/, que consume las variables de theme.css.
export { Contenedor, type PropsContenedor } from "./componentes/base/Contenedor";
export { PaginaTienda, type PropsPaginaTienda } from "./componentes/disposiciones/PaginaTienda";
export { Logo, type PropsLogo } from "./componentes/base/Logo";
export { BotonCarrito, type PropsBotonCarrito } from "./componentes/navegacion/BotonCarrito";
export { Migas, type MigaDeRuta, type PropsMigas } from "./componentes/navegacion/Migas";
export { MenuUsuario } from "./componentes/navegacion/MenuUsuario";
export {
  Header,
  type CategoriaDeCabecera,
  type PropsHeader,
} from "./componentes/navegacion/Header";
export { Ubicacion, type PropsUbicacion } from "./componentes/navegacion/Ubicacion";
export { BotonWhatsApp, type PropsBotonWhatsApp } from "./componentes/navegacion/BotonWhatsApp";
export {
  PiePagina,
  type PropsPiePagina,
  type GrupoDePie,
  type EnlaceDePie,
} from "./componentes/navegacion/PiePagina";
export { Buscador, type PropsBuscador } from "./componentes/navegacion/Buscador";
export { AccionesCuenta, type PropsAccionesCuenta } from "./componentes/navegacion/AccionesCuenta";
export {
  CodigoPromocional,
  type PropsCodigoPromocional,
} from "./componentes/formularios/CodigoPromocional";
export { CabeceraLineas } from "./componentes/compra/CabeceraLineas";
export { BloqueLineas } from "./componentes/compra/BloqueLineas";
export { AlternarTema } from "./componentes/base/AlternarTema";
export { IndicadorClave, type PropsIndicadorClave } from "./componentes/formularios/IndicadorClave";
export {
  EscaparatePortada,
  type PropsEscaparatePortada,
  type BannerDePortada,
} from "./componentes/portada/EscaparatePortada";
export { BloqueColeccion, type PropsBloqueColeccion } from "./componentes/portada/BloqueColeccion";
export {
  CarruselBanners,
  type PropsCarruselBanners,
  type BannerDeslizable,
} from "./componentes/portada/CarruselBanners";
export { CarruselPortada, type PropsCarruselPortada } from "./componentes/portada/CarruselPortada";
export { CarruselMarcas, type PropsCarruselMarcas } from "./componentes/portada/CarruselMarcas";
export { Beneficio, type PropsBeneficio } from "./componentes/portada/Beneficio";
export {
  NavegacionSecciones,
  type PropsNavegacionSecciones,
  type SeccionDeNavegacion,
} from "./componentes/navegacion/NavegacionSecciones";
export {
  ItemDesplegable,
  type PropsItemDesplegable,
  type EnlaceDeDesplegable,
} from "./componentes/navegacion/ItemDesplegable";
export { Hero, type PropsHero, type DiapositivaHero } from "./componentes/portada/Hero";
export { CabeceraSeccion, type PropsCabeceraSeccion } from "./componentes/base/CabeceraSeccion";
export {
  BloqueFormulario,
  type PropsBloqueFormulario,
} from "./componentes/formularios/BloqueFormulario";
export { Precio, type PropsPrecio } from "./componentes/catalogo/Precio";
export { TarjetaProducto, type PropsTarjetaProducto } from "./componentes/catalogo/TarjetaProducto";
export { FotoProducto, type PropsFotoProducto } from "./componentes/catalogo/FotoProducto";
export { TarjetaMarca, type PropsTarjetaMarca } from "./componentes/catalogo/TarjetaMarca";
export {
  BarraResultados,
  separarOrden,
  type PropsBarraResultados,
} from "./componentes/catalogo/BarraResultados";
export {
  BarraFiltros,
  type PropsBarraFiltros,
  type GrupoDeFiltro,
  type OpcionDeFiltro,
  type RangoDeFiltro,
} from "./componentes/catalogo/BarraFiltros";
export { BannerOferta, type PropsBannerOferta } from "./componentes/catalogo/BannerOferta";
export { BannerPromo, type PropsBannerPromo } from "./componentes/portada/BannerPromo";
export {
  RejillaProductos,
  type PropsRejillaProductos,
} from "./componentes/catalogo/RejillaProductos";
export { Carrusel, type PropsCarrusel } from "./componentes/portada/Carrusel";
// Alias temporal para compatibilidad
export {
  Carrusel as CarruselProductos,
  type PropsCarrusel as PropsCarruselProductos,
} from "./componentes/portada/Carrusel";
export {
  GaleriaProducto,
  type PropsGaleriaProducto,
  type ImagenGaleria,
} from "./componentes/catalogo/GaleriaProducto";
export {
  SelectorVariantes,
  type PropsSelectorVariantes,
  type OpcionDeCompra,
} from "./componentes/catalogo/SelectorVariantes";
export { FichaProducto, type PropsFichaProducto } from "./componentes/catalogo/FichaProducto";
export { Estrellas, type PropsEstrellas } from "./componentes/catalogo/Estrellas";
export {
  ListaResenas,
  type PropsListaResenas,
  type ResenaPublicada,
} from "./componentes/catalogo/ListaResenas";
export { Acordeon, type PropsAcordeon, type SeccionDeAcordeon } from "./componentes/base/Acordeon";
export {
  DisposicionListado,
  type PropsDisposicionListado,
} from "./componentes/disposiciones/DisposicionListado";
export {
  PaginaInformativa,
  TablaInformativa,
  EnlaceDestacado,
  type PropsPaginaInformativa,
  type PropsEnlaceDestacado,
} from "./componentes/disposiciones/PaginaInformativa";
export {
  LayoutProducto,
  type PropsLayoutProducto,
} from "./componentes/disposiciones/LayoutProducto";
export {
  PanelAcciones,
  type PropsPanelAcciones,
} from "./componentes/paneles/PanelAcciones";
export {
  InformacionGrid,
  type PropsInformacionGrid,
  type Dato,
} from "./componentes/paneles/InformacionGrid";

// Compra (Clase B): carrito y checkout.
export {
  DisposicionCompra,
  type PropsDisposicionCompra,
} from "./componentes/disposiciones/DisposicionCompra";
export {
  SelectorCantidad,
  type PropsSelectorCantidad,
} from "./componentes/formularios/SelectorCantidad";
export { LineaDeCarrito, type PropsLineaDeCarrito } from "./componentes/compra/LineaDeCarrito";
export {
  ResumenCompra,
  type PropsResumenCompra,
} from "./componentes/compra/ResumenCompra";
export {
  ArticulosResumen,
  type ArticuloResumen,
  type PropsArticulosResumen,
} from "./componentes/compra/ArticulosResumen";
export { GrupoOpciones, type PropsGrupoOpciones } from "./componentes/formularios/GrupoOpciones";
export {
  DisposicionConfirmacion,
  type PropsDisposicionConfirmacion,
} from "./componentes/disposiciones/DisposicionConfirmacion";
export {
  LineaEstados,
  type PasoDeLinea,
  type PropsLineaEstados,
} from "./componentes/compra/LineaEstados";
export {
  BloqueDetalle,
  MontoDetalle,
  FilaDetalles,
  type PropsBloqueDetalle,
} from "./componentes/paneles/BloqueDetalle";
export {
  GaleriaEditable,
  type PropsGaleriaEditable,
  type ImagenEditable,
} from "./componentes/paneles/GaleriaEditable";
export { EstadoVacio, type PropsEstadoVacio } from "./componentes/base/EstadoVacio";
export { Cargando, type PropsCargando } from "./componentes/base/Cargando";
export { Formulario, type PropsFormulario } from "./componentes/formularios/Formulario";
export {
  DisposicionAcceso,
  type PropsDisposicionAcceso,
} from "./componentes/disposiciones/DisposicionAcceso";
export { Campo, type PropsCampo } from "./componentes/formularios/Campo";
export { CampoTexto, type PropsCampoTexto } from "./componentes/formularios/CampoTexto";
export {
  SelectorEstrellas,
  type PropsSelectorEstrellas,
} from "./componentes/formularios/SelectorEstrellas";
export { Casilla, type PropsCasilla } from "./componentes/formularios/Casilla";
export { AccesoSocial } from "./componentes/navegacion/AccesoSocial";
export { FilaCampos, type PropsFilaCampos } from "./componentes/formularios/FilaCampos";
export { FilaUnida, type PropsFilaUnida } from "./componentes/paneles/FilaUnida";
export { Pestanas, type OpcionDePestana, type PropsPestanas } from "./componentes/base/Pestanas";
export { FilaOpciones, type PropsFilaOpciones } from "./componentes/formularios/FilaOpciones";
export { SelectorPais, type PropsSelectorPais } from "./componentes/formularios/SelectorPais";
export { SelectorFecha, type PropsSelectorFecha } from "./componentes/formularios/SelectorFecha";
export {
  SelectorCalendario,
  type PropsSelectorCalendario,
} from "./componentes/formularios/SelectorCalendario";
export { PAISES, type Pais } from "./datos/paises";
export { Boton, type PropsBoton } from "./componentes/base/Boton";
export { Alerta, type PropsAlerta } from "./componentes/base/Alerta";
export {
  TarjetaSeleccionable,
  type PropsTarjetaSeleccionable,
} from "./componentes/formularios/TarjetaSeleccionable";
export {
  SeccionCheckout,
  DatosSeccion,
  type PropsSeccionCheckout,
} from "./componentes/compra/SeccionCheckout";
export {
  TarjetaPedido,
  type PropsTarjetaPedido,
  type ItemDePedido,
} from "./componentes/compra/TarjetaPedido";

// Cuenta y panel (Clase C).
export {
  DisposicionCuenta,
  type PropsDisposicionCuenta,
  type SeccionDeCuenta,
} from "./componentes/disposiciones/DisposicionCuenta";
export {
  MenuCuenta,
  type GrupoMenuCuenta,
  type OpcionMenuCuenta,
  type PropsMenuCuenta,
} from "./componentes/navegacion/MenuCuenta";
export {
  DisposicionPanel,
  type PropsDisposicionPanel,
  type SeccionDePanel,
} from "./componentes/disposiciones/DisposicionPanel";
export { Tarjeta, type PropsTarjeta } from "./componentes/base/Tarjeta";
export { TarjetaInfo, type PropsTarjetaInfo } from "./componentes/paneles/TarjetaInfo";
export { FilaTarjetas, type PropsFilaTarjetas } from "./componentes/paneles/FilaTarjetas";
export { TarjetaMetrica, type PropsTarjetaMetrica } from "./componentes/paneles/TarjetaMetrica";
export { RejillaMetricas, type PropsRejillaMetricas } from "./componentes/paneles/RejillaMetricas";
export {
  EscaleraNiveles,
  ProgresoNivel,
  PuntoNivel,
  RejillaNiveles,
  TarjetaNivel,
  type PropsEscaleraNiveles,
  type PropsProgresoNivel,
  type PropsTarjetaNivel,
  type TonoNivel,
  type TramoNivel,
} from "./componentes/paneles/EscaleraNiveles";
export { FilaLista, type PropsFilaLista } from "./componentes/paneles/FilaLista";
export { Insignia, type PropsInsignia } from "./componentes/base/Insignia";
export {
  CampoSelect,
  type PropsCampoSelect,
  type OpcionDeSelect,
} from "./componentes/formularios/CampoSelect";
export {
  SelectorBuscable,
  type PropsSelectorBuscable,
  type OpcionDeSelectorBuscable,
} from "./componentes/formularios/SelectorBuscable";
export {
  CampoSelectorLista,
  type PropsCampoSelectorLista,
} from "./componentes/formularios/CampoSelectorLista";
export {
  SelectorLista,
  type PropsSelectorLista,
  type OpcionDeSelectorLista,
} from "./componentes/formularios/SelectorLista";
