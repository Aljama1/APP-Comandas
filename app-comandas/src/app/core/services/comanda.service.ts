import { Injectable, signal, computed } from '@angular/core';
import { LineaComanda } from '../models/comanda.model';
import { Producto, CategoriaProducto, MAPA_DESTINO_CATEGORIA, DestinoReceptor, VarianteProducto, OpcionModificador } from '../models/producto.model';
import { areTranslatableEqual } from '../models/common.model';

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
   * Genera una clave única basada en un Translatable para comparaciones estables.
   */
  private getTranslatableKey(t: any): string {
    if (!t) return '';
    return typeof t === 'string' ? t : JSON.stringify(t);
  }

  /**
   * Agrega un producto a la comanda. Si ya existe, incrementa la cantidad.
   */
  public agregarLinea(
    producto: Producto, 
    cantidad: number = 1, 
    notasEspeciales: string = '',
    variante?: VarianteProducto,
    modificadores: OpcionModificador[] = []
  ): void {
    this.lineasComanda.update(lineas => {
      // Cálculo del precio unitario real
      let precioUnitario = variante ? variante.precio : producto.precio;
      const extraModificadores = modificadores.reduce((acc, mod) => acc + (mod.precioAdicional || 0), 0);
      precioUnitario += extraModificadores;

      // Para considerar si es el mismo artículo, deben coincidir: ID, notas, variante y modificadores (nombres)
      const modsKeys = modificadores.map(m => this.getTranslatableKey(m.nombre)).sort().join('|');
      
      const existeIndice = lineas.findIndex(l => {
        const lModsKeys = (l.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');
        return l.idProducto === producto.id && 
               l.notasEspeciales === notasEspeciales && 
               areTranslatableEqual(l.varianteSeleccionada?.nombre, variante?.nombre) &&
               lModsKeys === modsKeys;
      });
      
      if (existeIndice >= 0) {
        const lineasActualizadas = [...lineas];
        const linea = lineasActualizadas[existeIndice];
        linea.cantidad += cantidad;
        linea.subtotal = linea.cantidad * linea.precioUnitario;
        return lineasActualizadas;
      } else {
        const destino: DestinoReceptor = MAPA_DESTINO_CATEGORIA[producto.categoria as CategoriaProducto] ?? 'COCINA';

        const nuevaLinea: LineaComanda = {
          idProducto: producto.id,
          nombreProducto: producto.nombre,
          cantidad: cantidad,
          precioUnitario: precioUnitario,
          subtotal: precioUnitario * cantidad,
          destino: destino,
          notasEspeciales: notasEspeciales,
          varianteSeleccionada: variante,
          modificadoresSeleccionados: modificadores
        };
        return [...lineas, nuevaLinea];
      }
    });
    this.persistir();
  }

  /**
   * Elimina completamente un producto de la comanda.
   */
  public eliminarLinea(linea: LineaComanda): void {
    const modsKeys = (linea.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');
    
    this.lineasComanda.update(lineas => lineas.filter(l => {
      const lModsKeys = (l.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');
      return !(l.idProducto === linea.idProducto && 
               l.notasEspeciales === linea.notasEspeciales && 
               areTranslatableEqual(l.varianteSeleccionada?.nombre, linea.varianteSeleccionada?.nombre) &&
               lModsKeys === modsKeys);
    }));
    this.persistir();
  }

  /**
   * Modifica la cantidad de una línea específica en 1 (incrementar o decrementar).
   */
  public actualizarCantidad(linea: LineaComanda, operacion: 'incrementar' | 'decrementar'): void {
    const modsKeys = (linea.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');

    this.lineasComanda.update(lineas => {
      const lineasActualizadas = [...lineas];
      const indice = lineasActualizadas.findIndex(l => {
        const lModsKeys = (l.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');
        return l.idProducto === linea.idProducto && 
               l.notasEspeciales === linea.notasEspeciales && 
               areTranslatableEqual(l.varianteSeleccionada?.nombre, linea.varianteSeleccionada?.nombre) &&
               lModsKeys === modsKeys;
      });
      
      if (indice >= 0) {
        const l = lineasActualizadas[indice];
        if (operacion === 'incrementar') {
          l.cantidad += 1;
        } else if (operacion === 'decrementar') {
          l.cantidad -= 1;
          if (l.cantidad <= 0) {
            return lineasActualizadas.filter((_, i) => i !== indice);
          }
        }
        l.subtotal = l.cantidad * l.precioUnitario;
      }
      return lineasActualizadas;
    });
    this.persistir();
  }

  /**
   * Modifica las notas a cocina de una línea existente.
   */
  public actualizarNotasLinea(linea: LineaComanda, nuevasNotas: string): void {
    const modsKeys = (linea.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');

    this.lineasComanda.update(lineas => {
      const lineasActualizadas = [...lineas];
      const indice = lineasActualizadas.findIndex(l => {
        const lModsKeys = (l.modificadoresSeleccionados || []).map(m => this.getTranslatableKey(m.nombre)).sort().join('|');
        return l.idProducto === linea.idProducto && 
               l.notasEspeciales === linea.notasEspeciales && 
               areTranslatableEqual(l.varianteSeleccionada?.nombre, linea.varianteSeleccionada?.nombre) &&
               lModsKeys === modsKeys;
      });
      
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
