import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminComandaService } from '../../../core/services/admin-comanda.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { Comanda, EstadoComanda } from '../../../core/models/comanda.model';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, timeOutline, restaurantOutline, beerOutline, logOutOutline,
  flameOutline, checkmarkDoneOutline, archiveOutline, alertCircleOutline, syncOutline,
  fastFoodOutline, flashOutline, searchOutline, cafeOutline, closeCircleOutline,
  notificationsOutline, walletOutline, listOutline, createOutline, chevronDownOutline,
  chevronUpOutline, warningOutline, checkmarkCircle, trendingUpOutline, peopleOutline,
  analyticsOutline, checkmarkOutline, documentTextOutline, languageOutline
} from 'ionicons/icons';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateContentPipe } from '../../../core/pipes/translate-content.pipe';
import { Turno } from '../../../core/models/producto.model';
import { LocalizedString, Translatable } from '../../../core/models/common.model';

import { AdminConfigBarComponent } from '../../../shared/components/admin-config-bar/admin-config-bar.component';

@Component({
  selector: 'app-panel-pedidos',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, AdminConfigBarComponent, TranslateModule, TranslateContentPipe],
  providers: [DatePipe],
  templateUrl: './panel-pedidos.component.html',
  styleUrls: ['./panel-pedidos.component.scss']
})
export class PanelPedidosComponent implements OnInit, OnDestroy {
  adminComandaService = inject(AdminComandaService);
  private adminAuth = inject(AdminAuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);

  // Reloj interno para cronómetros en vivo
  ahora = signal<number>(Date.now());
  private intervalId: any;

  // Filtro de búsqueda por mesa
  filtroMesa = signal<string>('');

  // ──────────────────────────────────────────────────
  // PROPUESTA A: Set de IDs de tarjetas expandidas
  // ──────────────────────────────────────────────────
  expandedIds = signal<Set<string>>(new Set());

  toggleExpand(id: string | undefined) {
    if (!id) return;
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isExpanded(id: string | undefined): boolean {
    return !!id && this.expandedIds().has(id);
  }

  // ──────────────────────────────────────────────────
  // PROPUESTA B: Progreso de líneas preparadas
  // ──────────────────────────────────────────────────
  getProgreso(comanda: Comanda): { preparados: number; total: number; pct: number } {
    const total = comanda.lineasComanda.length;
    const preparados = comanda.lineasComanda.filter(l => l.preparado).length;
    return { preparados, total, pct: total > 0 ? Math.round((preparados / total) * 100) : 0 };
  }

  // ──────────────────────────────────────────────────
  // PROPUESTA C: KPIs de turno calculados en tiempo real
  // ──────────────────────────────────────────────────
  statsKPI = computed(() => {
    const activas = this.adminComandaService.pedidosEnCurso();
    const pendientes = this.adminComandaService.pedidosPendientes();
    const completadas = this.adminComandaService.pedidosHistorial();

    // Mesas únicas activas (PREPARANDO o PENDIENTE)
    const mesasActivas = new Set([
      ...activas.map(c => c.idMesa),
      ...pendientes.map(c => c.idMesa)
    ]).size;

    // Platos pendientes totales sin preparar
    const platosCocina = this.adminComandaService.productosAgregadosCocina()
      .reduce((acc, p) => acc + p.cantidadTotal, 0);
    const platosBarra = this.adminComandaService.productosBarra()
      .reduce((acc, p) => acc + p.cantidadTotal, 0);

    // Tiempo medio de las comandas activas
    const now = this.ahora();
    let tiempoMedioMin = 0;
    if (activas.length > 0) {
      const sumMs = activas.reduce((acc, c) => acc + Math.max(0, now - c.fechaCreacion), 0);
      tiempoMedioMin = Math.floor(sumMs / activas.length / 60000);
    }

    return { mesasActivas, platosCocina, platosBarra, tiempoMedioMin, completadas: completadas.length };
  });

  // ──────────────────────────────────────────────────
  // PROPUESTA D: Modal Timeline por Mesa
  // ──────────────────────────────────────────────────
  mesaTimeline = signal<string | null>(null);

  comandasMesaTimeline = computed(() => {
    const mesa = this.mesaTimeline();
    if (!mesa) return [];
    // Buscamos en activas + historial
    const todas = [
      ...this.adminComandaService.pedidosPendientes(),
      ...this.adminComandaService.pedidosEnCurso(),
      ...this.adminComandaService.pedidosHistorial()
    ];
    return todas
      .filter(c => c.idMesa === mesa)
      .sort((a, b) => a.fechaCreacion - b.fechaCreacion);
  });

  abrirTimeline(idMesa: string) {
    this.mesaTimeline.set(idMesa);
  }

  cerrarTimeline() {
    this.mesaTimeline.set(null);
  }

  precioTotalMesa = computed(() => {
    return this.comandasMesaTimeline().reduce((acc, c) => acc + (c.precioTotal || 0), 0);
  });

  // ──────────────────────────────────────────────────
  // Modal de detalle rápido (comanda individual)
  // ──────────────────────────────────────────────────
  comandaSeleccionada = signal<Comanda | null>(null);

  abrirDetalle(comanda: Comanda) {
    this.comandaSeleccionada.set(comanda);
  }

  cerrarDetalle() {
    this.comandaSeleccionada.set(null);
  }

  // ──────────────────────────────────────────────────
  // Señales computadas para las 3 columnas Kanban
  // ──────────────────────────────────────────────────
  pedidosPendientesFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosPendientes();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  pedidosPreparandoFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosEnCurso().filter(p => p.estado === 'PREPARANDO');
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  pedidosCompletadosFiltrados = computed(() => {
    const pedidos = this.adminComandaService.pedidosHistorial();
    const filtro = this.filtroMesa().trim();
    return filtro ? pedidos.filter(p => p.idMesa === filtro) : pedidos;
  });

  // Peticiones de cuenta activas (Se poblarán mediante eventos o Firestore)
  mesasPidiendoCuenta = signal<string[]>([]);

  constructor() {
    addIcons({
      checkmarkCircleOutline, timeOutline, restaurantOutline, beerOutline, logOutOutline,
      flameOutline, checkmarkDoneOutline, archiveOutline, alertCircleOutline, syncOutline,
      fastFoodOutline, flashOutline, searchOutline, cafeOutline, closeCircleOutline,
      notificationsOutline, walletOutline, listOutline, createOutline, chevronDownOutline,
      chevronUpOutline, warningOutline, checkmarkCircle, trendingUpOutline, peopleOutline,
      analyticsOutline, checkmarkOutline, documentTextOutline, languageOutline
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

  getLineasBarra(comanda: Comanda) {
    return comanda.lineasComanda.filter(l => l.destino === 'BARRA');
  }

  getLineasCocina(comanda: Comanda) {
    return comanda.lineasComanda.filter(l => l.destino === 'COCINA');
  }

  actualizarFiltro(event: any) {
    this.filtroMesa.set(event.detail.value || '');
  }

  getMinutosTranscurridos(fechaCreacion: number): number {
    if (!fechaCreacion || fechaCreacion < 1000000000000) return 0;
    return Math.max(0, Math.floor((this.ahora() - fechaCreacion) / 60000));
  }

  esUrgente(fechaCreacion: number): boolean {
    return this.getMinutosTranscurridos(fechaCreacion) >= 15;
  }

  getColorProgreso(pct: number): string {
    if (pct >= 100) return '#00ff88';
    if (pct >= 60) return '#00d2ff';
    if (pct >= 30) return '#ff9500';
    return '#ff453a';
  }

  getLabelEstado(estado: EstadoComanda): string {
    const map: Record<EstadoComanda, string> = {
      PENDIENTE: 'ESTADOS.PENDIENTE', 
      PREPARANDO: 'ESTADOS.PREPARANDO',
      LISTO: 'ESTADOS.LISTO', 
      SERVIDO: 'ESTADOS.SERVIDO', 
      PAGADO: 'ESTADOS.PAGADO', 
      CANCELADO: 'ESTADOS.CANCELADO'
    };
    return map[estado] ?? estado;
  }

  async cambiarEstadoComanda(idComanda: string | undefined, nuevoEstado: EstadoComanda) {
    if (!idComanda) return;

    let mensajeExito = '';
    switch (nuevoEstado) {
      case 'PREPARANDO': mensajeExito = this.translate.instant('TOASTS.COMANDA_VALIDADA'); break;
      case 'LISTO':      mensajeExito = this.translate.instant('TOASTS.MARCADO_LISTO'); break;
      case 'SERVIDO':    mensajeExito = this.translate.instant('TOASTS.COMANDA_SERVIDA'); break;
    }

    const loading = await this.loadingCtrl.create({ message: 'Actualizando...', spinner: 'crescent' });
    await loading.present();

    try {
      await this.adminComandaService.actualizarEstado(idComanda, nuevoEstado);
      await loading.dismiss();
      const toast = await this.toastCtrl.create({ message: mensajeExito, duration: 2000, position: 'top', color: 'success', icon: 'checkmark-circle-outline' });
      await toast.present();
    } catch (error) {
      await loading.dismiss();
      console.error(error);
      const toast = await this.toastCtrl.create({ message: this.translate.instant('TOASTS.ERROR_ACTUALIZAR'), duration: 3000, position: 'top', color: 'danger' });
      await toast.present();
    }
  }

  async anularComanda(idComanda: string | undefined) {
    if (!idComanda) return;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ALERTAS.ANULAR_TITULO'),
      message: this.translate.instant('ALERTAS.ANULAR_MENSAJE'),
      buttons: [
        { text: this.translate.instant('ACCIONES.CANCELAR'), role: 'cancel' },
        {
          text: this.translate.instant('ALERTAS.ANULAR'), role: 'destructive',
          handler: () => {
            this.adminComandaService.actualizarEstado(idComanda, 'CANCELADO');
            this.toastCtrl.create({ message: this.translate.instant('TOASTS.COMANDA_ANULADA'), duration: 2000, color: 'medium', icon: 'close-circle-outline' }).then(t => t.present());
          }
        }
      ]
    });
    await alert.present();
  }

  async cobrarMesa(idMesa: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ALERTAS.COBRAR_TITULO', { mesa: idMesa }),
      message: this.translate.instant('ALERTAS.COBRAR_MENSAJE', { mesa: idMesa }),
      buttons: [
        { text: this.translate.instant('ACCIONES.CANCELAR'), role: 'cancel' },
        {
          text: this.translate.instant('ALERTAS.CONFIRMAR_PAGO'),
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: '...' });
            await loading.present();
            try {
              await this.adminComandaService.finalizarCuentaMesa(idMesa);
              this.mesasPidiendoCuenta.update(mesas => mesas.filter(m => m !== idMesa));
              this.cerrarTimeline(); // Si estaba el modal abierto, lo cerramos
              
              const toast = await this.toastCtrl.create({
                message: this.translate.instant('TOASTS.MESA_COBRADA', { mesa: idMesa }),
                duration: 2000,
                color: 'success',
                icon: 'wallet-outline'
              });
              await toast.present();
            } catch (error) {
              console.error(error);
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  irACocina() { this.router.navigate(['/admin/cocina']); }
  irABarra()  { this.router.navigate(['/admin/barra']); }
  irAGestionProductos() { this.router.navigate(['/admin/productos']); }
  irAHistorialFacturas() { this.router.navigate(['/admin/facturas']); }
  cerrarSesion() { this.adminAuth.logout(); }

  get idiomaActual(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  toggleIdioma(): void {
    const nuevoIdioma = this.idiomaActual === 'es' ? 'en' : 'es';
    this.translate.use(nuevoIdioma);
    localStorage.setItem('app_lang', nuevoIdioma);
  }
}
