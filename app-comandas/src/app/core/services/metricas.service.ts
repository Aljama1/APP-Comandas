import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { Comanda } from '../models/comanda.model';
import { getTranslation } from '../models/common.model';

export interface KpiGeneral {
  totalVentas: number;
  totalComandas: number;
  tiempoMedioServicio: number; // en minutos
  ticketMedio: number;
}

export interface ProductoVendido {
  nombre: string;
  cantidad: number;
  totalRecaudado: number;
}

@Injectable({
  providedIn: 'root'
})
export class MetricasService {
  private firestore = inject(Firestore);

  // Señal cruda con las comandas históricas cargadas
  private comandasHistoricas = signal<Comanda[]>([]);
  public cargando = signal(true);
  public error = signal<string | null>(null);

  private unsubscribe: Unsubscribe | null = null;

  // 1. KPI Generales
  public kpis = computed<KpiGeneral>(() => {
    const lista = this.comandasHistoricas();
    if (lista.length === 0) return { totalVentas: 0, totalComandas: 0, tiempoMedioServicio: 0, ticketMedio: 0 };

    const totalVentas = lista.reduce((acc, c) => acc + (c.precioTotal || 0), 0);
    const totalComandas = lista.length;
    
    // Calcular tiempo medio (solo de las que tienen fecha de actualización)
    const comandasConTiempo = lista.filter(c => c.fechaActualizacion && c.fechaCreacion);
    const sumaTiempos = comandasConTiempo.reduce((acc, c) => {
      const diffMinutos = (c.fechaActualizacion - c.fechaCreacion) / (1000 * 60);
      return acc + diffMinutos;
    }, 0);
    
    const tiempoMedio = comandasConTiempo.length > 0 ? sumaTiempos / comandasConTiempo.length : 0;
    const ticketMedio = totalVentas / totalComandas;

    return { totalVentas, totalComandas, tiempoMedioServicio: tiempoMedio, ticketMedio };
  });

  // 2. Ranking de Productos
  public rankingProductos = computed<ProductoVendido[]>(() => {
    const mapa = new Map<string, ProductoVendido>();
    
    this.comandasHistoricas().forEach(c => {
      c.lineasComanda.forEach(l => {
        const existente = mapa.get(l.idProducto);
        if (existente) {
          existente.cantidad += l.cantidad;
          existente.totalRecaudado += l.subtotal;
        } else {
          mapa.set(l.idProducto, {
            nombre: getTranslation(l.nombreProducto, 'es'),
            cantidad: l.cantidad,
            totalRecaudado: l.subtotal
          });
        }
      });
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10); // Top 10
  });

  constructor() {
    this.iniciarEscuchaMetricas();
  }

  /**
   * Carga las comandas pagadas de los últimos 7 días.
   */
  private iniciarEscuchaMetricas() {
    const comandasRef = collection(this.firestore, 'comandas');
    
    // Calculamos el timestamp de hace 7 días
    const haceSieteDias = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const q = query(
      comandasRef,
      where('estado', '==', 'PAGADO'),
      where('fechaCreacion', '>=', haceSieteDias),
      orderBy('fechaCreacion', 'desc'),
      limit(200) // Límite de seguridad para no saturar
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() as Comanda, id: doc.id }));
      this.comandasHistoricas.set(data);
      this.cargando.set(false);
    }, (err) => {
      console.error('Error cargando métricas:', err);
      this.error.set('No se pudieron cargar las métricas históricas.');
      this.cargando.set(false);
    });
  }

  public detenerEscucha() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
