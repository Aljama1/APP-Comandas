import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminComandaService } from '../../../core/services/admin-comanda.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { addIcons } from 'ionicons';
import { beerOutline, timeOutline, warningOutline, cafeOutline, checkmarkDoneOutline, logOutOutline, flameOutline, checkmarkOutline, gridOutline } from 'ionicons/icons';

/**
 * VistaBarra - Panel KDS (Kitchen Display System) adaptado para el Barman.
 * Funciona de forma simétrica a VistaCocina pero filtrando únicamente
 * las líneas de destino BARRA (bebidas y otros productos de barra).
 * 
 * Pantalla dividida:
 *   - Izquierda: Bebidas agregadas por producto (cuántas de cada una hay que tirar)
 *   - Derecha: Tickets por mesa con checklist para tachar cada bebida servida
 * 
 * Cuando el barman tapa la última bebida de un ticket Y cocina ya terminó sus platos,
 * la comanda pasa automáticamente a LISTO y se avisa al camarero.
 */
import { AdminConfigBarComponent } from '../../../shared/components/admin-config-bar/admin-config-bar.component';

@Component({
  selector: 'app-vista-barra',
  standalone: true,
  imports: [CommonModule, IonicModule, AdminConfigBarComponent],
  templateUrl: './vista-barra.component.html',
  styleUrls: ['./vista-barra.component.scss']
})
export class VistaBarraComponent implements OnInit, OnDestroy {
  adminComandaService = inject(AdminComandaService);
  private adminAuth = inject(AdminAuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
 
  private intervalId: any;
  ahora = signal<number>(Date.now());
  filtroMesa = signal<string>('');

  // Filtrado de tickets por mesa
  pedidosBarraFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosBarra();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  // Filtrado de bebidas agrupadas
  productosBarraFiltrados = computed(() => {
    const productos = this.adminComandaService.productosBarra();
    const filtro = this.filtroMesa().trim();
    return filtro ? productos.filter(p => p.mesas.includes(filtro)) : productos;
  });

  // KPIs para el termómetro de la cabecera
  statsKPI = computed(() => {
    const platosCocina = this.adminComandaService.productosAgregadosCocina()
      .reduce((acc, p) => acc + p.cantidadTotal, 0);
    const platosBarra = this.adminComandaService.productosBarra()
      .reduce((acc, p) => acc + p.cantidadTotal, 0);
    return { platosCocina, platosBarra };
  });

  constructor() {
    addIcons({
      beerOutline, timeOutline, warningOutline,
      cafeOutline, checkmarkDoneOutline, logOutOutline, flameOutline, checkmarkOutline, gridOutline
    });
  }

  ngOnInit() {
    this.adminComandaService.iniciarEscuchaPedidosEntrantes();
    this.intervalId = setInterval(() => {
      this.ahora.set(Date.now());
    }, 10000);
  }

  ngOnDestroy() {
    this.adminComandaService.detenerEscucha();
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Devuelve solo las líneas de BARRA de una comanda, preservando el índice
   * original del array para poder actualizar el campo correcto en Firestore.
   */
  getLineasBarraConIndice(comanda: any) {
    return comanda.lineasComanda
      .map((linea: any, index: number) => ({ ...linea, originalIndex: index }))
      .filter((l: any) => l.destino === 'BARRA');
  }

  /** Calcula los minutos transcurridos desde que se creó la comanda. */
  getMinutosTranscurridos(fechaCreacion: number): number {
    if (!fechaCreacion || fechaCreacion < 1000000000000) return 0;
    return Math.max(0, Math.floor((this.ahora() - fechaCreacion) / 60000));
  }

  /** Alterna el estado preparado de una bebida concreta. */
  async alternarBebidaServida(idComanda: string | undefined, indexOriginal: number, estadoActual: boolean) {
    if (!idComanda) return;
    try {
      await this.adminComandaService.marcarLineaPreparada(idComanda, indexOriginal, !estadoActual);
    } catch (error) {
      console.error('Error al alternar bebida:', error);
    }
  }

  /** Fuerza la salida manual de una comanda completa (para casos excepcionales). */
  async marcharComandaManual(idComanda: string | undefined) {
    if (!idComanda) return;
    const loading = await this.loadingCtrl.create({ message: 'Despachando...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.adminComandaService.actualizarEstado(idComanda, 'LISTO');
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: '¡Mesa despachada!',
        duration: 2000, position: 'top', color: 'success', icon: 'checkmark-done-outline'
      });
      await toast.present();
    } catch (error) {
      await loading.dismiss();
    }
  }

  irACocina() { this.router.navigate(['/admin/cocina']); }
  irASala() { this.router.navigate(['/admin/panel-pedidos']); }
  actualizarFiltro(event: any) {
    this.filtroMesa.set(event.detail.value || '');
  }

  cerrarSesion() { this.adminAuth.logout(); }
}
