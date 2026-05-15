import { Injectable, inject, signal, computed, OnDestroy, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import {
  Firestore, collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, Unsubscribe, runTransaction
} from '@angular/fire/firestore';
import { UploadTask, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';
import { Producto, CategoriaProducto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoAdminService implements OnDestroy {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private injector = inject(EnvironmentInjector);

  public productos = signal<Producto[]>([]);
  public cargando = signal(false);
  public error = signal<string | null>(null);

  public productosPorCategoria = computed(() => {
    const lista = this.productos();
    const orden: CategoriaProducto[] = ['entrante', 'principal', 'postre', 'bebida', 'especial'];
    return orden
      .map(cat => ({ categoria: cat, items: lista.filter(p => p.categoria === cat) }))
      .filter(g => g.items.length > 0);
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
    const q = query(productosRef, orderBy('nombre', 'asc'));

    this.cancelarEscucha = onSnapshot(
      q,
      (snapshot) => {
        const lista: Producto[] = snapshot.docs.map(doc => ({
          ...(doc.data() as Producto),
          id: doc.id
        }))
        .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));

        this.productos.set(lista);
        this.cargando.set(false);
      },
      (err) => {
        this.error.set('Error al cargar productos.');
        this.cargando.set(false);
      }
    );
  }

  async crearProducto(producto: Omit<Producto, 'id'>): Promise<string> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const productosRef = collection(this.firestore, 'productos');
      const docRef = await addDoc(productosRef, producto);
      this.cargando.set(false);
      return docRef.id;
    } catch (e: any) {
      this.error.set('No se pudo crear el producto.');
      this.cargando.set(false);
      throw e;
    }
  }

  async actualizarProducto(id: string, datos: Partial<Producto>): Promise<void> {
    this.error.set(null);
    try {
      const docRef = doc(this.firestore, 'productos', id);
      await updateDoc(docRef, datos);
    } catch (e: any) {
      this.error.set('No se pudo actualizar el producto.');
      throw e;
    }
  }

  async eliminarProducto(id: string): Promise<void> {
    this.error.set(null);
    try {
      const docRef = doc(this.firestore, 'productos', id);
      await deleteDoc(docRef);
    } catch (e: any) {
      this.error.set('No se pudo eliminar el producto.');
      throw e;
    }
  }

  async subirImagen(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const path = `productos/${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, path);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        'state_changed',
        () => {},
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  /**
   * Descuenta stock de forma atómica usando una transacción Firestore.
   * Lee el stock actual del servidor y escribe el nuevo valor en la misma
   * operación, evitando race conditions cuando dos cocineros marcan platos
   * del mismo producto simultáneamente.
   */
  async descontarStock(idProducto: string, cantidad: number): Promise<void> {
    const docRef = doc(this.firestore, 'productos', idProducto);
    await runInInjectionContext(this.injector, () =>
      runTransaction(this.firestore, async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists()) return;
        const data = snap.data() as Producto;
        if (data.stock === undefined || data.stock === null) return;

        const nuevoStock = Math.max(0, data.stock - cantidad);
        const updates: Partial<Producto> = { stock: nuevoStock };
        if (nuevoStock <= 0) {
          updates.disponible = false;
        }
        tx.update(docRef, updates);
      })
    );
  }
}
