import { Injectable, signal } from '@angular/core';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class CartaService {
  // Signal que contiene la lista completa de productos (Mock Data)
  private _productos = signal<Producto[]>([
    {
      id: '1',
      nombre: 'Ensalada César Premium',
      descripcion: 'Lechuga romana, pollo a la brasa, picatostes crujientes y nuestra salsa secreta.',
      precio: 12.50,
      imagenUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format',
      categoria: 'entrante',
      alergenos: ['gluten', 'lactosa', 'huevo']
    },
    {
      id: '2',
      nombre: 'Tacos de Cochinita Pibil',
      descripcion: 'Tortillas de maíz artesanas con cerdo marinado y cebolla encurtida.',
      precio: 14.00,
      imagenUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format',
      categoria: 'principal',
      alergenos: []
    },
    {
      id: '3',
      nombre: 'Hamburguesa Trace',
      descripcion: 'Carne dry-aged, queso cheddar fundido y pan brioche horneado al día.',
      precio: 16.50,
      imagenUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format',
      categoria: 'principal',
      alergenos: ['gluten', 'lactosa']
    },
    {
      id: '4',
      nombre: 'Sorbete de Mango y Fruta de la Pasión',
      descripcion: 'Refrescante y natural, sin lácteos ni azúcares añadidos.',
      precio: 6.00,
      imagenUrl: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500&auto=format',
      categoria: 'postre',
      alergenos: []
    },
    {
      id: '5',
      nombre: 'Tataki de Atún Rojo',
      descripcion: 'Sellado al fuego con sésamo negro y emulsión de soja.',
      precio: 18.00,
      imagenUrl: 'https://images.unsplash.com/photo-1501595091296-3a970afb3ffb?w=500&auto=format',
      categoria: 'principal',
      alergenos: ['pescado']
    }
  ]);

  // Exponemos la lista de productos
  productos = this._productos.asReadonly();

  constructor() { }

  /**
   * En el futuro (Día 9), este método se conectará con Firestore.
   */
  obtenerProductosPorCategoria(categoria: string) {
    return this._productos().filter(p => p.categoria === categoria);
  }
}
