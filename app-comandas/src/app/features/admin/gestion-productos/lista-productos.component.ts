import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProductoAdminService } from '../../../core/services/producto-admin.service';
import { Producto, CategoriaProducto } from '../../../core/models/producto.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateContentPipe } from '../../../core/pipes/translate-content.pipe';
import { getTranslation } from '../../../core/models/common.model';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { addIcons } from 'ionicons';
import {
  addOutline, createOutline, trashOutline, restaurantOutline,
  checkmarkCircleOutline, closeCircleOutline, chevronBackOutline,
  warningOutline, eyeOutline, eyeOffOutline, imageOutline,
  logOutOutline, gridOutline, pricetagOutline, listOutline,
  flameOutline, beerOutline, leafOutline, starOutline, cafeOutline,
  swapVerticalOutline, cubeOutline, removeOutline, eggOutline, iceCreamOutline
} from 'ionicons/icons';

type VistaFiltro = 'todas' | CategoriaProducto;

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, TranslateContentPipe],
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.scss']
})
export class ListaProductosComponent {
  productoService = inject(ProductoAdminService);
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);

  filtroActivo = signal<VistaFiltro>('todas');

  categorias: { clave: VistaFiltro; etiqueta: string; icono: string }[] = [
    { clave: 'todas',     etiqueta: 'ADMIN.TODAS',      icono: 'list-outline' },
    { clave: 'entrante',  etiqueta: 'CATEGORIAS.entrante',   icono: 'egg-outline' },
    { clave: 'principal', etiqueta: 'CATEGORIAS.principal', icono: 'restaurant-outline' },
    { clave: 'postre',    etiqueta: 'CATEGORIAS.postre',     icono: 'ice-cream-outline' },
    { clave: 'bebida',    etiqueta: 'CATEGORIAS.bebida',     icono: 'beer-outline' },
    { clave: 'especial',  etiqueta: 'CATEGORIAS.especial',  icono: 'star-outline' }
  ];

  productosFiltrados = computed(() => {
    const filtro = this.filtroActivo();
    const lista = this.productoService.productos();
    if (filtro === 'todas') return lista;
    return lista.filter(p => p.categoria === filtro);
  });

  totalProductos     = computed(() => this.productoService.productos().length);
  productosActivos   = computed(() => this.productoService.productos().filter(p => p.disponible).length);
  productosInactivos = computed(() => this.productoService.productos().filter(p => !p.disponible).length);
  stockBajo          = computed(() => this.productoService.productos().filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 5).length);
  categoriaActual    = computed(() => this.productosFiltrados().length);

  constructor() {
    addIcons({
      addOutline, createOutline, trashOutline, restaurantOutline,
      checkmarkCircleOutline, closeCircleOutline, chevronBackOutline,
      warningOutline, eyeOutline, eyeOffOutline, imageOutline,
      logOutOutline, gridOutline, pricetagOutline, listOutline,
      flameOutline, beerOutline, leafOutline, starOutline, cafeOutline,
      swapVerticalOutline, cubeOutline, removeOutline, eggOutline, iceCreamOutline
    });
  }

  getLabelCategoria(cat: string): string {
    return 'CATEGORIAS.' + cat;
  }

  irANuevo() { this.router.navigate(['/admin/productos/nuevo']); }
  irAEditar(id: string) { this.router.navigate(['/admin/productos', id, 'editar']); }
  irAPanel() { this.router.navigate(['/admin/panel-pedidos']); }

  async cambiarDisponibilidad(producto: Producto) {
    const nuevoValor = !producto.disponible;
    try {
      await this.productoService.actualizarProducto(producto.id, { disponible: nuevoValor });
      const msg = nuevoValor ? this.translate.instant('TOASTS.PRODUCTO_ACTIVADO') : this.translate.instant('TOASTS.PRODUCTO_DESACTIVADO');
      const toast = await this.toastCtrl.create({
        message: msg, duration: 1500, position: 'top', color: 'success',
        icon: nuevoValor ? 'eye-outline' : 'eye-off-outline'
      });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.ERROR_ACTUALIZAR'), duration: 2000, color: 'danger' });
      await toast.present();
    }
  }

  async actualizarOrden(producto: Producto, nuevoOrden: any) {
    const val = parseInt(nuevoOrden, 10);
    if (isNaN(val) || val === producto.orden) return;
    
    try {
      await this.productoService.actualizarProducto(producto.id, { orden: val });
    } catch {
      const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.ERROR_ACTUALIZAR'), duration: 2000, color: 'danger' });
      await toast.present();
    }
  }

  async actualizarStockRapido(producto: Producto, nuevoStock: any) {
    const val = parseInt(nuevoStock, 10);
    if (isNaN(val) || val === producto.stock) return;
    
    try {
      const updates: any = { stock: Math.max(0, val) };
      if (updates.stock <= 0) {
        updates.disponible = false;
      }
      await this.productoService.actualizarProducto(producto.id, updates);
      const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.STOCK_ACTUALIZADO'), duration: 1500, color: 'success' });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.ERROR_ACTUALIZAR'), duration: 2000, color: 'danger' });
      await toast.present();
    }
  }

  ajustarStock(producto: Producto, delta: number) {
    const actual = producto.stock ?? 0;
    this.actualizarStockRapido(producto, actual + delta);
  }

  async eliminarProducto(producto: Producto) {
    const alert = await this.alertCtrl.create({
      cssClass: 'admin-app-alert admin-app-alert--danger',
      header: this.translate.instant('ADMIN.ELIMINAR_PREGUNTA'),
      message: `"${getTranslation(producto.nombre, this.translate.currentLang)}" ${this.translate.instant('ADMIN.ELIMINAR_AVISO')}`,
      buttons: [
        { text: this.translate.instant('ACCIONES.CANCELAR'), role: 'cancel', cssClass: 'admin-alert-btn-cancel' },
        {
          text: this.translate.instant('ADMIN.ELIMINAR'), role: 'destructive', cssClass: 'admin-alert-btn-danger',
          handler: async () => {
            try {
              await this.productoService.eliminarProducto(producto.id);
              const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.PRODUCTO_ELIMINADO'), duration: 1500, color: 'medium' });
              await toast.present();
            } catch {
              const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.ERROR_ELIMINAR'), duration: 2000, color: 'danger' });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async logout() { this.authService.logout(); }
}