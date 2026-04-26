export interface PerfilUsuario {
  uid?: string; // ID único proporcionado por Firebase Auth
  nombre: string;
  mesaId: number | null;
  alergenos: string[]; // Lista de IDs de alérgenos activos
}
