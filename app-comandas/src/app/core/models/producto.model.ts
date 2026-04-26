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
