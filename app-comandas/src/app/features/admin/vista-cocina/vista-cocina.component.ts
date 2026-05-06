import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminComandaService } from '../../../core/services/admin-comanda.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { addIcons } from 'ionicons';
import { flameOutline, timeOutline, warningOutline, restaurantOutline, checkmarkDoneOutline, logOutOutline, cafeOutline, beerOutline, gridOutline } from 'ionicons/icons';

import { AdminConfigBarComponent } from '../../../shared/components/admin-config-bar/admin-config-bar.component';

@Component({
  selector: 'app-vista-cocina',
  standalone: true,
  imports: [CommonModule, IonicModule, AdminConfigBarComponent],
  templateUrl: './vista-cocina.component.html',
  styleUrls: ['./vista-cocina.component.scss']
})
export class VistaCocinaComponent implements OnInit, OnDestroy {
  adminComandaService = inject(AdminComandaService);
  private adminAuth = inject(AdminAuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  // Intervalo para refrescar los contadores de tiempo en pantalla
  private intervalId: any;
  ahora = signal<number>(Date.now());
  filtroMesa = signal<string>('');

  // KPIs para el termómetro de la cabecera
  statsKPI = computed(() => {
    const platosCocina = this.adminComandaService.productosAgregadosCocina()
      .reduce((acc, p) => acc + p.cantidadTotal, 0);
    const platosBarra = this.adminComandaService.productosBarra()
      .reduce((acc, p) => acc + p.cantidadTotal, 0);
    return { platosCocina, platosBarra };
  });

  // Controla qué vista estamos usando en la cocina
  // Por defecto usamos la vista agrupada, ya que es la forma real de trabajar en hostelería
  modoVista = signal<'mesas' | 'agrupada'>('agrupada');

  // Filtrado de tickets por mesa
  pedidosCocinaFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosCocina();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  // Filtrado de productos agrupados (opcional, pero ayuda a la claridad)
  productosAgregadosCocinaFiltrados = computed(() => {
    const productos = this.adminComandaService.productosAgregadosCocina();
    const filtro = this.filtroMesa().trim();
    return filtro ? productos.filter(p => p.mesas.includes(filtro)) : productos;
  });

  // Método para cambiar de pestaña, separado para que la plantilla HTML no de error de parseo
  cambiarVista(event: any) {
    const valor = event.detail.value;
    if (valor === 'mesas' || valor === 'agrupada') {
      this.modoVista.set(valor);
    }
  }

  constructor() {
    addIcons({ 
      flameOutline, timeOutline, warningOutline, 
      restaurantOutline, checkmarkDoneOutline, logOutOutline, cafeOutline, beerOutline, gridOutline
    });
  }

  ngOnInit() {
    this.adminComandaService.iniciarEscuchaPedidosEntrantes();
    
    // Actualizamos el reloj interno cada 10 segundos para los contadores
    this.intervalId = setInterval(() => {
      this.ahora.set(Date.now());
    }, 10000);
  }

  ngOnDestroy() {
    this.adminComandaService.detenerEscucha();
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Devuelve las líneas de cocina preservando su índice original 
   * para poder actualizar la posición exacta en Firestore.
   */
  getLineasCocinaConIndice(comanda: any) {
    return comanda.lineasComanda
      .map((linea: any, index: number) => ({ ...linea, originalIndex: index }))
      .filter((l: any) => l.destino === 'COCINA');
  }

  getMinutosTranscurridos(fechaCreacion: number): number {
    if (!fechaCreacion) return 0;
    if (fechaCreacion < 1000000000000) return 0; 
    const diff = this.ahora() - fechaCreacion;
    return Math.max(0, Math.floor(diff / 60000));
  }

  async alternarPlatoPreparado(idComanda: string | undefined, indexOriginal: number, estadoActual: boolean) {
    if (!idComanda) return;
    try {
      await this.adminComandaService.marcarLineaPreparada(idComanda, indexOriginal, !estadoActual);
    } catch (error) {
      console.error('Error al alternar plato:', error);
    }
  }

  async marcharComandaManual(idComanda: string | undefined) {
    if (!idComanda) return;
    const loading = await this.loadingCtrl.create({
      message: 'Marchando comanda...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.adminComandaService.actualizarEstado(idComanda, 'SERVIDO');
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: '¡Comanda marchada!',
        duration: 2000,
        position: 'top',
        color: 'success',
        icon: 'checkmark-done-outline'
      });
      await toast.present();
    } catch (error) {
      await loading.dismiss();
    }
  }

  irABarra() {
    this.router.navigate(['/admin/barra']);
  }

  irASala() {
    this.router.navigate(['/admin/panel-pedidos']);
  }

  actualizarFiltro(event: any) {
    this.filtroMesa.set(event.detail.value || '');
  }

  cerrarSesion() {
    this.adminAuth.logout();
  }
}
