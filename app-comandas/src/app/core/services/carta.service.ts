import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import {
  Firestore, collection, query, orderBy, onSnapshot, Unsubscribe
} from '@angular/fire/firestore';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class CartaService implements OnDestroy {
  private firestore = inject(Firestore);

  public productos = signal<Producto[]>([]);
  public cargando = signal(true);
  public error = signal<string | null>(null);

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
          .map(doc => ({ ...(doc.data() as Producto), id: doc.id }))
          .filter(p => p.disponible); // Solo mostramos los disponibles a los clientes

        this.productos.set(lista);
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