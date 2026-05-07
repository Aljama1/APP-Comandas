export type Alergeno = 'Gluten' | 'Crustáceos' | 'Huevos' | 'Pescado' | 'Cacahuetes' | 'Soja' | 'Lácteos' | 'Frutos de cáscara' | 'Apio' | 'Mostaza' | 'Granos de sésamo' | 'Dióxido de azufre y sulfitos' | 'Altramuces' | 'Moluscos';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  urlImagen?: string;
  categoria: CategoriaProducto;
  alergenos: Alergeno[];
  disponible: boolean;
}

export type CategoriaProducto = 'entrante' | 'principal' | 'postre' | 'bebida' | 'especial';

export type DestinoReceptor = 'BARRA' | 'COCINA';

export const MAPA_DESTINO_CATEGORIA: Record<CategoriaProducto, DestinoReceptor> = {
  'entrante': 'COCINA',
  'principal': 'COCINA',
  'postre': 'COCINA',
  'bebida': 'BARRA',
  'especial': 'COCINA'
};