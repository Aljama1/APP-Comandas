import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import {
  Firestore, collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, Unsubscribe, increment
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

  /**
   * UTILIDAD PARA MIGRAR PRODUCTOS ANTIGUOS
   * Convierte nombres y descripciones tipo string a {es: '...', en: ''}
   */
  async migrarProductosAntiguos(): Promise<void> {
    const lista = this.productos();
    for (const prod of lista) {
      let necesitaUpdate = false;
      const updates: Partial<Producto> = {};

      if (typeof prod.nombre === 'string') {
        updates.nombre = { es: prod.nombre, en: '' };
        necesitaUpdate = true;
      }
      if (typeof prod.descripcion === 'string') {
        updates.descripcion = { es: prod.descripcion, en: '' };
        necesitaUpdate = true;
      }

      if (necesitaUpdate && prod.id) {
        console.log(`Migrando producto: ${prod.id}`);
        await this.actualizarProducto(prod.id, updates);
      }
    }
    console.log('Migración completada.');
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

  async descontarStock(idProducto: string, cantidad: number): Promise<void> {
    const producto = this.productos().find(p => p.id === idProducto);
    if (!producto || producto.stock === undefined || producto.stock === null) return;

    const docRef = doc(this.firestore, 'productos', idProducto);
    const nuevoStock = Math.max(0, producto.stock - cantidad);
    
    const updates: any = { stock: nuevoStock };
    if (nuevoStock <= 0) {
      updates.disponible = false;
    }

    await updateDoc(docRef, updates);
  }
}
