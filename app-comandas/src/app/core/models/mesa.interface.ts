export interface Mesa {
  id: string;                  // ID único de la mesa en la base de datos
  numeroMesa: number;          // Número visible de la mesa (Ej: Mesa 4)
  tokenQR: string;             // Token o Hash secreto del QR asociado a esta mesa
  capacidad: number;           // Capacidad máxima de comensales
  estaOcupada: boolean;        // Estado actual de la mesa
  idClienteActual?: string;    // Si está ocupada, UID del usuario/cliente vinculado a la sesión actual
}
