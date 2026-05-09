import { DestinoReceptor, VarianteProducto, OpcionModificador } from './producto.model';
import { Translatable } from './common.model';

export type EstadoComanda = 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'SERVIDO' | 'PAGADO' | 'CANCELADO';

export interface LineaComanda {
  idProducto: string;          // Referencia al ID del producto
  nombreProducto: Translatable;      // Nombre traducible
  cantidad: number;            // Cantidad solicitada
  precioUnitario: number;      // Precio bloqueado en el momento de pedir
  subtotal: number;            // cantidad * precioUnitario
  destino: DestinoReceptor;    // A dónde se despacha esta línea: BARRA (bebidas) o COCINA (comidas)
  notasEspeciales?: string;    // Peticiones especiales del cliente (Ej: 'Sin salsa y muy hecho')
  preparado?: boolean;         // Control individual para ir tachando platos en la cocina
  varianteSeleccionada?: VarianteProducto; // Variante elegida (ej. Ración o Tapa)
  modificadoresSeleccionados?: OpcionModificador[]; // Modificadores extra elegidos
}

export interface Comanda {
  id?: string;                  // ID único de la comanda (opcional porque Firestore lo genera)
  idMesa: string;              // ID de la mesa desde la que el cliente solicitó
  idCliente: string;           // UID del cliente (Firebase Auth)
  nombreCliente: string;       // Nombre para facilitar lectura en cocina
  alergenosUsuario?: string[]; // (Opcional) Alérgenos que padece el cliente para alerta en cocina
  lineasComanda: LineaComanda[]; // Matriz con los platos solicitados
  estado: EstadoComanda;       // Estado de flujo de vida de la comanda en cocina
  precioTotal: number;         // Sumatorio total
  fechaCreacion: number;       // Timestamp (Date.now())
  fechaActualizacion: number;  // Timestamp
}

