export type RolUsuario = 'ADMINISTRADOR' | 'CLIENTE' | 'INVITADO';

export interface Usuario {
  uid: string;                 // ID único generado por Firebase Auth
  nombre: string;              // Nombre completo o apodo del usuario
  email?: string;              // Correo electrónico (opcional si es INVITADO)
  rol: RolUsuario;             // Rol en el sistema
  alergiasActivas: string[];   // Lista de IDs de alérgenos que afectan a este cliente (Ej: ['gluten', 'lactosa'])
  fechaCreacion: number;       // Timestamp de registro
}
