export type Alergeno = 'Gluten' | 'Crustáceos' | 'Huevos' | 'Pescado' | 'Cacahuetes' | 'Soja' | 'Lácteos' | 'Frutos de cáscara' | 'Apio' | 'Mostaza' | 'Granos de sésamo' | 'Dióxido de azufre y sulfitos' | 'Altramuces' | 'Moluscos';

export type Turno = 'ALMUERZO' | 'CENA';
export type TipoModificador = 'EXCLUYENTE' | 'OPCIONAL';

export interface VarianteProducto {
  nombre: string;
  precio: number;
}

export interface OpcionModificador {
  nombre: string;
  precioAdicional: number;
}

export interface GrupoModificadores {
  nombre: string;
  tipo: TipoModificador;
  opciones: OpcionModificador[];
  obligatorio?: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  urlImagen?: string;
  categoria: CategoriaProducto;
  alergenos: Alergeno[];
  disponible: boolean;
  variantes?: VarianteProducto[];
  modificadores?: GrupoModificadores[];
  turnos?: Turno[];
  orden?: number;
  stock?: number;
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