import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProductoAdminService } from '../../../core/services/producto-admin.service';
import { Producto, CategoriaProducto } from '../../../core/models/producto.model';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { addIcons } from 'ionicons';
import {
  addOutline, createOutline, trashOutline, restaurantOutline,
  checkmarkCircleOutline, closeCircleOutline, chevronBackOutline,
  warningOutline, eyeOutline, eyeOffOutline, imageOutline,
  logOutOutline, gridOutline, pricetagOutline, listOutline,
  flameOutline, beerOutline, leafOutline, starOutline, cafeOutline
} from 'ionicons/icons';

type VistaFiltro = 'todas' | CategoriaProducto;

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.scss']
})
export class ListaProductosComponent {
  productoService = inject(ProductoAdminService);
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  filtroActivo = signal<VistaFiltro>('todas');

  categorias: { clave: VistaFiltro; etiqueta: string; icono: string }[] = [
    { clave: 'todas',     etiqueta: 'Todas',      icono: 'list-outline' },
    { clave: 'entrante',  etiqueta: 'Entrantes',   icono: 'leaf-outline' },
    { clave: 'principal', etiqueta: 'Principales', icono: 'flame-outline' },
    { clave: 'postre',    etiqueta: 'Postres',     icono: 'cafe-outline' },
    { clave: 'bebida',    etiqueta: 'Bebidas',     icono: 'beer-outline' },
    { clave: 'especial',  etiqueta: 'Especiales',  icono: 'star-outline' }
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
  categoriaActual    = computed(() => this.productosFiltrados().length);

  constructor() {
    addIcons({
      addOutline, createOutline, trashOutline, restaurantOutline,
      checkmarkCircleOutline, closeCircleOutline, chevronBackOutline,
      warningOutline, eyeOutline, eyeOffOutline, imageOutline,
      logOutOutline, gridOutline, pricetagOutline, listOutline,
      flameOutline, beerOutline, leafOutline, starOutline, cafeOutline
    });
  }

  getLabelCategoria(cat: string): string {
    const map: Record<string, string> = {
      entrante: 'Entrante', principal: 'Principal',
      postre: 'Postre', bebida: 'Bebida', especial: 'Especial'
    };
    return map[cat] || cat;
  }

  irANuevo() { this.router.navigate(['/admin/productos/nuevo']); }
  irAEditar(id: string) { this.router.navigate(['/admin/productos', id, 'editar']); }
  irAPanel() { this.router.navigate(['/admin/panel-pedidos']); }

  async cambiarDisponibilidad(producto: Producto) {
    const nuevoValor = !producto.disponible;
    try {
      await this.productoService.actualizarProducto(producto.id, { disponible: nuevoValor });
      const msg = nuevoValor ? 'Producto activado.' : 'Producto desactivado.';
      const toast = await this.toastCtrl.create({
        message: msg, duration: 1500, position: 'top', color: 'success',
        icon: nuevoValor ? 'eye-outline' : 'eye-off-outline'
      });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({ message: 'Error al actualizar.', duration: 2000, color: 'danger' });
      await toast.present();
    }
  }

  async eliminarProducto(producto: Producto) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar producto?',
      message: `"${producto.nombre}" se eliminará permanentemente.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            try {
              await this.productoService.eliminarProducto(producto.id);
              const toast = await this.toastCtrl.create({ message: 'Producto eliminado.', duration: 1500, color: 'medium' });
              await toast.present();
            } catch {
              const toast = await this.toastCtrl.create({ message: 'Error al eliminar.', duration: 2000, color: 'danger' });
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