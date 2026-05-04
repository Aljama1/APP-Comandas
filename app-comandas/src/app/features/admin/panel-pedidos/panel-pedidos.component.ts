import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AdminComandaService } from '../../../core/services/admin-comanda.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { EstadoComanda } from '../../../core/models/comanda.interface';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, timeOutline, restaurantOutline, beerOutline, logOutOutline, flameOutline, checkmarkDoneOutline, archiveOutline } from 'ionicons/icons';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-panel-pedidos',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './panel-pedidos.component.html',
  styleUrls: ['./panel-pedidos.component.scss']
})
export class PanelPedidosComponent implements OnInit, OnDestroy {
  adminComandaService = inject(AdminComandaService);
  private adminAuth = inject(AdminAuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  // Controla qué pestaña estamos viendo
  tabActual: 'pendientes' | 'enCurso' | 'historial' = 'pendientes';

  // Controla si se resume la comida para no saturar al barman
  vistaBarra: boolean = true;

  // Filtro de búsqueda por mesa
  filtroMesa = signal<string>('');

  // Señales computadas para filtrar la vista actual sin tocar la base de datos
  pedidosPendientesFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosPendientes();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  pedidosEnCursoFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosEnCurso();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  pedidosHistorialFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosHistorial();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  constructor() {
    addIcons({ checkmarkCircleOutline, timeOutline, restaurantOutline, beerOutline, logOutOutline, flameOutline, checkmarkDoneOutline, archiveOutline });
  }

  ngOnInit() {
    this.adminComandaService.iniciarEscuchaPedidosEntrantes();
  }

  ngOnDestroy() {
    this.adminComandaService.detenerEscucha();
  }

  cambiarPestana(event: any) {
    this.tabActual = event.detail.value;
  }

  getLineasBarra(comanda: any) {
    return comanda.lineasComanda.filter((l: any) => l.destino === 'BARRA');
  }

  getLineasCocina(comanda: any) {
    return comanda.lineasComanda.filter((l: any) => l.destino === 'COCINA');
  }

  actualizarFiltro(event: any) {
    this.filtroMesa.set(event.detail.value || '');
  }

  // Comprueba si un pedido lleva más de 10 minutos esperando
  esUrgente(fechaCreacion: number): boolean {
    const diezMinutos = 10 * 60 * 1000;
    return (Date.now() - fechaCreacion) > diezMinutos;
  }


  async cambiarEstadoComanda(idComanda: string | undefined, nuevoEstado: EstadoComanda) {
    if (!idComanda) return;

    let mensajeExito = '';
    switch (nuevoEstado) {
      case 'PREPARANDO': mensajeExito = 'Pedido aceptado. Enviado a cocina.'; break;
      case 'LISTO': mensajeExito = 'Marcado como listo para servir.'; break;
      case 'SERVIDO': mensajeExito = 'Pedido entregado en mesa.'; break;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.adminComandaService.actualizarEstado(idComanda, nuevoEstado);
      await loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: mensajeExito,
        duration: 2000,
        position: 'top',
        color: 'success',
        icon: 'checkmark-circle-outline'
      });
      await toast.present();
    } catch (error) {
      await loading.dismiss();
      console.error(error);
      const toast = await this.toastCtrl.create({
        message: 'Error al actualizar el estado.',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    }
  }

  cerrarSesion() {
    this.adminAuth.logout();
  }
}
