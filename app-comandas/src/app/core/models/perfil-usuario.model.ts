import { Alergeno } from './producto.model';

export interface PerfilUsuario {
  uid?: string; // ID único proporcionado por Firebase Auth
  nombre: string;
  mesaId: number | null;
  alergenos: Alergeno[]; // Lista de IDs de alérgenos activos
}
