import { Translatable, LocalizedString } from './common.model';

export type TipoModificador = 'EXCLUYENTE' | 'OPCIONAL';
export type Turno = 'ALMUERZO' | 'CENA';

export type Alergeno =
  | 'Gluten'
  | 'Crustáceos'
  | 'Huevos'
  | 'Pescado'
  | 'Cacahuetes'
  | 'Soja'
  | 'Lácteos'
  | 'Frutos de cáscara'
  | 'Apio'
  | 'Mostaza'
  | 'Granos de sésamo'
  | 'Dióxido de azufre y sulfitos'
  | 'Altramuces'
  | 'Moluscos';

export const MAPA_ALERGENOS: Record<Alergeno, string> = {
  Gluten: 'ALERGENOS.gluten',
  'Crustáceos': 'ALERGENOS.crustaceos',
  Huevos: 'ALERGENOS.huevo',
  Pescado: 'ALERGENOS.pescado',
  Cacahuetes: 'ALERGENOS.cacahuetes',
  Soja: 'ALERGENOS.soja',
  'Lácteos': 'ALERGENOS.lactosa',
  'Frutos de cáscara': 'ALERGENOS.frutos-secos',
  Apio: 'ALERGENOS.apio',
  Mostaza: 'ALERGENOS.mostaza',
  'Granos de sésamo': 'ALERGENOS.sesamo',
  'Dióxido de azufre y sulfitos': 'ALERGENOS.sulfitos',
  Altramuces: 'ALERGENOS.altramuces',
  Moluscos: 'ALERGENOS.moluscos'
};

export interface VarianteProducto {
  nombre: Translatable;
  precio: number;
}

export interface OpcionModificador {
  nombre: Translatable;
  precioAdicional: number;
}

export interface GrupoModificadores {
  nombre: Translatable;
  tipo: TipoModificador;
  opciones: OpcionModificador[];
  obligatorio?: boolean;
}

export interface Producto {
  id: string;
  nombre: Translatable;
  descripcion: Translatable;
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

export { LocalizedString, Translatable };

export const MAPA_DESTINO_CATEGORIA: Record<CategoriaProducto, DestinoReceptor> = {
  entrante: 'COCINA',
  principal: 'COCINA',
  postre: 'COCINA',
  bebida: 'BARRA',
  especial: 'COCINA'
};
