import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import {
  Firestore, collection, query, orderBy, onSnapshot, Unsubscribe
} from '@angular/fire/firestore';
import { Producto } from '../models/producto.model';
import { HorarioRestauranteService } from './horario-restaurante.service';

@Injectable({
  providedIn: 'root'
})
export class CartaService implements OnDestroy {
  private firestore = inject(Firestore);
  private horarioService = inject(HorarioRestauranteService);

  private productosRaw = signal<Producto[]>([]);
  public cargando = signal(true);
  public error = signal<string | null>(null);

  // Carta filtrada reactivamente por turno y orden
  public productos = computed(() => {
    const raw = this.productosRaw();
    const turno = this.horarioService.turnoActual();

    return raw
      .filter(p => p.disponible)
      .filter(p => {
        // Si el producto no tiene turnos asignados, es "todo el día"
        if (!p.turnos || p.turnos.length === 0) return true;
        // Si tiene turnos, solo mostrar si coincide con el actual
        return turno ? p.turnos.includes(turno) : false;
      })
      .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
  });

  private cancelarEscucha: Unsubscribe | null = null;

  constructor() {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.detenerEscucha();
  }

  private detenerEscucha(): void {
    if (this.cancelarEscucha) {
      this.cancelarEscucha();
      this.cancelarEscucha = null;
    }
  }

  private cargarProductos(): void {
    this.detenerEscucha();
    this.cargando.set(true);
    this.error.set(null);

    const productosRef = collection(this.firestore, 'productos');
    const q = query(productosRef, orderBy('nombre'));

    this.cancelarEscucha = onSnapshot(
      q,
      (snapshot) => {
        const lista: Producto[] = snapshot.docs
          .map(doc => ({ ...(doc.data() as Producto), id: doc.id }));

        this.productosRaw.set(lista);
        this.cargando.set(false);
      },
      () => {
        this.error.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      }
    );
  }

  obtenerProductosPorCategoria(categoria: string): Producto[] {
    return this.productos().filter(p => p.categoria === categoria && p.disponible);
  }
}