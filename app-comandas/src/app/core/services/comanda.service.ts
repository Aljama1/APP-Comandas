import { Injectable, signal, computed } from '@angular/core';
import { LineaComanda } from '../models/comanda.interface';
import { Producto } from '../models/producto.interface';

@Injectable({
  providedIn: 'root'
})
export class ComandaService {
  private readonly STORAGE_KEY = 'trace_carrito';

  // Estado reactivo principal
  public lineasComanda = signal<LineaComanda[]>(this.recuperarDeStorage());

  // Señales computadas derivadas del estado
  public totalArticulos = computed(() => {
    return this.lineasComanda().reduce((acc, linea) => acc + linea.cantidad, 0);
  });

  public subtotalComanda = computed(() => {
    return this.lineasComanda().reduce((acc, linea) => acc + linea.subtotal, 0);
  });

  constructor() { }

  /**
   * Agrega un producto a la comanda. Si ya existe, incrementa la cantidad.
   */
  public agregarLinea(producto: Producto, cantidad: number = 1, notasEspeciales: string = ''): void {
    this.lineasComanda.update(lineas => {
      const existeIndice = lineas.findIndex(l => l.idProducto === producto.id && l.notasEspeciales === notasEspeciales);
      
      if (existeIndice >= 0) {
        // Actualizamos la cantidad si el producto (y sus notas) es exactamente el mismo
        const lineasActualizadas = [...lineas];
        const linea = lineasActualizadas[existeIndice];
        linea.cantidad += cantidad;
        linea.subtotal = linea.cantidad * linea.precioUnitario;
        return lineasActualizadas;
      } else {
        // Creamos una nueva línea
        const nuevaLinea: LineaComanda = {
          idProducto: producto.id,
          nombreProducto: producto.nombre,
          cantidad: cantidad,
          precioUnitario: producto.precio,
          subtotal: producto.precio * cantidad,
          notasEspeciales: notasEspeciales
        };
        return [...lineas, nuevaLinea];
      }
    });
    this.persistir();
  }

  /**
   * Elimina completamente un producto de la comanda.
   */
  public eliminarLinea(idProducto: string, notasEspeciales: string | undefined = undefined): void {
    this.lineasComanda.update(lineas => lineas.filter(l => !(l.idProducto === idProducto && l.notasEspeciales === notasEspeciales)));
    this.persistir();
  }

  /**
   * Modifica la cantidad de una línea específica en 1 (incrementar o decrementar).
   */
  public actualizarCantidad(idProducto: string, operacion: 'incrementar' | 'decrementar', notasEspeciales: string | undefined = undefined): void {
    this.lineasComanda.update(lineas => {
      const lineasActualizadas = [...lineas];
      const indice = lineasActualizadas.findIndex(l => l.idProducto === idProducto && l.notasEspeciales === notasEspeciales);
      
      if (indice >= 0) {
        const linea = lineasActualizadas[indice];
        if (operacion === 'incrementar') {
          linea.cantidad += 1;
        } else if (operacion === 'decrementar') {
          linea.cantidad -= 1;
          if (linea.cantidad <= 0) {
            // Si la cantidad llega a 0, eliminamos del listado
            return lineasActualizadas.filter((_, i) => i !== indice);
          }
        }
        linea.subtotal = linea.cantidad * linea.precioUnitario;
      }
      return lineasActualizadas;
    });
    this.persistir();
  }

  /**
   * Modifica las notas a cocina de una línea existente.
   */
  public actualizarNotasLinea(idProducto: string, notasAntiguas: string | undefined, nuevasNotas: string): void {
    this.lineasComanda.update(lineas => {
      const lineasActualizadas = [...lineas];
      const indice = lineasActualizadas.findIndex(l => l.idProducto === idProducto && l.notasEspeciales === notasAntiguas);
      
      if (indice >= 0) {
        lineasActualizadas[indice].notasEspeciales = nuevasNotas;
      }
      return lineasActualizadas;
    });
    this.persistir();
  }

  /**
   * Vacía completamente la comanda actual.
   */
  public vaciarComanda(): void {
    this.lineasComanda.set([]);
    this.persistir();
  }

  /**
   * Guarda el estado actual del carrito en localStorage.
   */
  private persistir(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.lineasComanda()));
  }

  /**
   * Intenta recuperar el carrito guardado en localStorage.
   */
  private recuperarDeStorage(): LineaComanda[] {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      return datos ? JSON.parse(datos) : [];
    } catch {
      return [];
    }
  }
}
