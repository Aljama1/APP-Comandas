export type EstadoComanda = 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'SERVIDO' | 'PAGADO';

export interface LineaPedido {
  idProducto: string;          // Referencia al ID del producto
  nombreProducto: string;      // Nombre congelado en el momento de pedir
  cantidad: number;            // Cantidad solicitada
  precioUnitario: number;      // Precio bloqueado en el momento de pedir
  subtotal: number;            // cantidad * precioUnitario
  notasEspeciales?: string;    // Peticiones especiales del cliente (Ej: 'Sin salsa y muy hecho')
}

export interface Comanda {
  id: string;                  // ID único de la comanda
  idMesa: string;              // ID de la mesa desde la que el cliente solicitó
  idCliente: string;           // ID del cliente que generó la comanda
  lineasPedido: LineaPedido[]; // Matriz con los platos solicitados
  estado: EstadoComanda;       // Estado de flujo de vida de la comanda en cocina
  precioTotal: number;         // Sumatorio total
  fechaCreacion: number;       // Timestamp
  fechaActualizacion: number;  // Timestamp
}
