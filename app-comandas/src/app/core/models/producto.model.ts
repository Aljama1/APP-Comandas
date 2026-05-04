export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  categoria: CategoriaProducto;
  alergenos: string[]; // Lista de IDs de alérgenos que CONTIENE el producto (ej. ['gluten', 'lactosa'])
}

/**
 * Categorías estandarizadas para el menú digital.
 * Esto ayuda a organizar la carta por secciones.
 */
export type CategoriaProducto = 'entrante' | 'principal' | 'postre' | 'bebida' | 'especial';

/**
 * Destino de despacho de cada línea del pedido.
 * Determina a qué puesto de trabajo llega el producto:
 *   - BARRA: lo prepara el camarero/barman (bebidas).
 *   - COCINA: se despacha al equipo de cocina (comidas).
 */
export type DestinoReceptor = 'BARRA' | 'COCINA';

/**
 * Mapa que vincula cada categoría del menú con su destino de producción.
 * Si una categoría no aparece en el mapa, se asume COCINA por defecto.
 *
 * Decisión de diseño: centralizar esta lógica en una constante
 * facilita añadir nuevas categorías sin modificar la lógica de negocio.
 */
export const MAPA_DESTINO_CATEGORIA: Record<CategoriaProducto, DestinoReceptor> = {
  'entrante': 'COCINA',
  'principal': 'COCINA',
  'postre': 'COCINA',
  'bebida': 'BARRA',
  'especial': 'COCINA'
};
