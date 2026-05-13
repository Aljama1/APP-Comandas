import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminComandaService } from '../../../core/services/admin-comanda.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { Comanda } from '../../../core/models/comanda.model';
import { MetricasService } from '../../../core/services/metricas.service';
import { TicketService } from '../../../core/services/ticket.service';
import { addIcons } from 'ionicons';
import {
  walletOutline, searchOutline, closeOutline, trashOutline, createOutline,
  checkmarkOutline, restaurantOutline, timeOutline, cardOutline, cashOutline,
  qrCodeOutline, trendingUpOutline, gridOutline, shieldCheckmarkOutline, arrowBackOutline,
  addCircleOutline, removeCircleOutline, informationCircleOutline,
  chevronDownOutline, chevronUpOutline, alarmOutline, hourglassOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-gestion-cuentas',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule],
  templateUrl: './gestion-cuentas.component.html',
  styleUrls: ['./gestion-cuentas.component.scss']
})
export class GestionCuentasComponent implements OnInit, OnDestroy {
  adminComandaService = inject(AdminComandaService);
  metricasService = inject(MetricasService);
  private ticketService = inject(TicketService);
  private adminAuth = inject(AdminAuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);
  private translate = inject(TranslateService);

  filtroMesa = signal<string>('');
  mesaSeleccionada = signal<Comanda | null>(null);
  metodoPagoSeleccionado = signal<'EFECTIVO' | 'TARJETA' | 'TPV_VIRTUAL'>('EFECTIVO');

  // Límite de líneas visibles en el modal sin scroll. Si la cuenta supera
  // este umbral, se muestra un botón "+ Ver N más" que expande la lista.
  readonly UMBRAL_PRODUCTOS_VISIBLES = 4;
  mostrarTodosProductos = signal<boolean>(false);
  resumenExpandido = signal<boolean>(false);

  get idiomaActual(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  // Modal de edición de línea
  lineaEnEdicion = signal<{ index: number; linea: any } | null>(null);
  cantidadEditando = 0;
  precioEditando = 0;
  
  // Estado de procesamiento de factura
  isProcessing = signal<boolean>(false);

  // ── Detección de cuentas antiguas ───────────────────────────────
  // Umbrales (en minutos) a partir de los cuales una cuenta se considera
  // que lleva "mucho tiempo" abierta. Disparan feedback visual progresivo.
  readonly UMBRAL_AVISO_MIN = 45;
  readonly UMBRAL_URGENTE_MIN = 75;

  // Reloj interno: tick cada 30s para refrescar los tiempos sin recargar.
  ahora = signal<number>(Date.now());
  private tickerHandle: any = null;

  // Todas las comandas activas (no pagadas): incluye SERVIDO porque ya preparado ≠ cobrado
  todasLasComandas = computed(() => {
    const pendientes = this.adminComandaService.pedidosPendientes();
    const enCurso = this.adminComandaService.pedidosEnCurso();
    const servidos = this.adminComandaService.pedidosHistorial();
    return [...pendientes, ...enCurso, ...servidos];
  });

  // Agrupar por mesa
  mesasAgrupadas = computed(() => {
    const mapa = new Map<string, { comanda: Comanda; productos: any[]; total: number; clientes: Set<string>; ultimaActualizacion: number; fechaApertura: number }>();

    this.todasLasComandas().forEach(comanda => {
      const existente = mapa.get(comanda.idMesa);
      if (existente) {
        existente.productos.push(...comanda.lineasComanda);
        existente.total += (comanda.precioTotal ?? 0);
        existente.clientes.add(comanda.nombreCliente);
        existente.ultimaActualizacion = Math.max(existente.ultimaActualizacion, comanda.fechaActualizacion);
        if (comanda.fechaCreacion && (!existente.fechaApertura || comanda.fechaCreacion < existente.fechaApertura)) {
          existente.fechaApertura = comanda.fechaCreacion;
        }
      } else {
        mapa.set(comanda.idMesa, {
          comanda,
          productos: [...comanda.lineasComanda],
          total: comanda.precioTotal ?? 0,
          clientes: new Set([comanda.nombreCliente]),
          ultimaActualizacion: comanda.fechaActualizacion,
          fechaApertura: comanda.fechaCreacion || comanda.fechaActualizacion
        });
      }
    });

    const now = this.ahora();
    return Array.from(mapa.entries())
      .map(([idMesa, data]) => {
        const minutosAbierta = data.fechaApertura
          ? Math.max(0, Math.floor((now - data.fechaApertura) / 60000))
          : 0;
        const nivelAntiguedad: 'ok' | 'aviso' | 'urgente' =
          minutosAbierta >= this.UMBRAL_URGENTE_MIN ? 'urgente'
          : minutosAbierta >= this.UMBRAL_AVISO_MIN ? 'aviso'
          : 'ok';
        return {
          idMesa,
          ...data,
          nombresClientes: Array.from(data.clientes).join(', '),
          minutosAbierta,
          nivelAntiguedad
        };
      })
      .sort((a, b) => {
        // Primero las urgentes, luego las de aviso, luego por número de mesa
        const peso = (n: string) => n === 'urgente' ? 0 : n === 'aviso' ? 1 : 2;
        const dif = peso(a.nivelAntiguedad) - peso(b.nivelAntiguedad);
        if (dif !== 0) return dif;
        return a.idMesa.localeCompare(b.idMesa, undefined, { numeric: true });
      });
  });

  formatearTiempoAbierta(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }

  // Filtrado por búsqueda
  mesasFiltradas = computed(() => {
    const filtro = this.filtroMesa().trim().toLowerCase();
    if (!filtro) return this.mesasAgrupadas();
    return this.mesasAgrupadas().filter(m => m.idMesa.toLowerCase().includes(filtro));
  });

  constructor() {
    addIcons({
      walletOutline, searchOutline, closeOutline, trashOutline, createOutline,
      checkmarkOutline, restaurantOutline, timeOutline, cardOutline, cashOutline, qrCodeOutline, trendingUpOutline, gridOutline, shieldCheckmarkOutline, arrowBackOutline,
      addCircleOutline, removeCircleOutline, informationCircleOutline,
      chevronDownOutline, chevronUpOutline, alarmOutline, hourglassOutline
    });
  }

  ngOnInit() {
    this.adminComandaService.iniciarEscuchaPedidosEntrantes();
    this.ahora.set(Date.now());
    this.tickerHandle = setInterval(() => this.ahora.set(Date.now()), 30_000);
  }

  ngOnDestroy() {
    this.adminComandaService.detenerEscucha();
    if (this.tickerHandle) {
      clearInterval(this.tickerHandle);
      this.tickerHandle = null;
    }
  }

  actualizarFiltro(event: any) {
    this.filtroMesa.set(event.detail.value || '');
  }

  abrirDetalle(mesaData: { idMesa: string; productos: any[]; comanda: Comanda }) {
    // Usamos la primera comanda como referencia
    this.mesaSeleccionada.set(mesaData.comanda);
  }

  cerrarDetalle() {
    this.mesaSeleccionada.set(null);
    this.lineaEnEdicion.set(null);
    this.mostrarTodosProductos.set(false);
    this.resumenExpandido.set(false);
  }

  toggleMostrarTodos() {
    this.mostrarTodosProductos.update(v => !v);
  }

  toggleResumen() {
    this.resumenExpandido.update(v => !v);
  }

  productosVisibles(): any[] {
    const todos = this.obtenerTodosLosProductos();
    if (this.mostrarTodosProductos() || todos.length <= this.UMBRAL_PRODUCTOS_VISIBLES) {
      return todos;
    }
    return todos.slice(0, this.UMBRAL_PRODUCTOS_VISIBLES);
  }

  productosOcultos(): number {
    const total = this.obtenerTodosLosProductos().length;
    return Math.max(0, total - this.UMBRAL_PRODUCTOS_VISIBLES);
  }

  obtenerLineasPorComanda(comanda: Comanda): any[] {
    return comanda.lineasComanda.map((linea, index) => ({ ...linea, indexOriginal: index }));
  }

  obtenerTodosLosProductos(): any[] {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return [];

    const pendientes = this.adminComandaService.pedidosPendientes().filter(c => c.idMesa === mesa.idMesa);
    const enCurso = this.adminComandaService.pedidosEnCurso().filter(c => c.idMesa === mesa.idMesa);
    const servidos = this.adminComandaService.pedidosHistorial().filter(c => c.idMesa === mesa.idMesa);

    let productos: any[] = [];
    [...pendientes, ...enCurso, ...servidos].forEach(c => {
      productos = productos.concat(c.lineasComanda.map((l, i) => ({ ...l, idComanda: c.id, indexComanda: i })));
    });

    return productos;
  }

  totalAcumuladoMesa(): number {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return 0;

    const pendientes = this.adminComandaService.pedidosPendientes().filter(c => c.idMesa === mesa.idMesa);
    const enCurso = this.adminComandaService.pedidosEnCurso().filter(c => c.idMesa === mesa.idMesa);
    const servidos = this.adminComandaService.pedidosHistorial().filter(c => c.idMesa === mesa.idMesa);

    return [...pendientes, ...enCurso, ...servidos].reduce((sum, c) => sum + (c.precioTotal || 0), 0);
  }

  iniciarEdicionLinea(linea: any, event: Event) {
    event.stopPropagation();
    this.lineaEnEdicion.set({ index: linea.indexComanda, linea });
    this.cantidadEditando = linea.cantidad;
    this.precioEditando = linea.precioUnitario;
  }

  cancelarEdicionLinea() {
    this.lineaEnEdicion.set(null);
  }

  incrementarCantidad() { this.cantidadEditando++; }
  decrementarCantidad() { if (this.cantidadEditando > 1) this.cantidadEditando--; }

  async confirmarEdicion() {
    const datosEdicion = this.lineaEnEdicion();
    if (!datosEdicion) return;

    const comandaId = datosEdicion.linea.idComanda;
    const indexLinea = datosEdicion.index;

    const loading = await this.loadingCtrl.create({ message: 'Actualizando...' });
    await loading.present();

    try {
      await this.adminComandaService.editarLineaComanda(comandaId, indexLinea, {
        cantidad: this.cantidadEditando,
        precioUnitario: this.precioEditando
      });
      
      this.lineaEnEdicion.set(null);
      const toast = await this.toastCtrl.create({
        message: 'Línea actualizada',
        duration: 2000,
        position: 'top',
        color: 'success',
        icon: 'checkmark-outline'
      });
      await toast.present();
    } catch (error) {
      console.error(error);
      const toast = await this.toastCtrl.create({
        message: 'Error al actualizar',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  async eliminarLinea(linea: any, event: Event) {
    event.stopPropagation();
    
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar producto?',
      message: `¿Estás seguro de que quieres eliminar "${linea.nombreProducto?.[this.idiomaActual] ?? linea.nombreProducto?.['es'] ?? linea.nombreProducto}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
            await loading.present();

            try {
              await this.adminComandaService.eliminarLineaComanda(linea.idComanda, linea.indexComanda);
              
              const toast = await this.toastCtrl.create({
                message: 'Producto eliminado',
                duration: 2000,
                position: 'top',
                color: 'medium',
                icon: 'trash-outline'
              });
              await toast.present();
            } catch (error) {
              console.error(error);
              const toast = await this.toastCtrl.create({
                message: 'Error al eliminar',
                duration: 3000,
                position: 'top',
                color: 'danger'
              });
              await toast.present();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async finalizarCobro() {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return;

    this.isProcessing.set(true);
    const metodoPago = this.metodoPagoSeleccionado();

    try {
      const factura = await this.adminComandaService.generarFactura(mesa.idMesa, metodoPago);
      
      // Generar y abrir el PDF del ticket automáticamente
      await this.ticketService.generarTicketPDF(factura);

      this.cerrarDetalle();
      
      const toast = await this.toastCtrl.create({
        message: `Mesa ${mesa.idMesa} cobrada correctamente`,
        duration: 3000,
        position: 'top',
        color: 'success',
        icon: 'checkmark-outline'
      });
      await toast.present();
    } catch (error) {
      console.error(error);
      const toast = await this.toastCtrl.create({
        message: 'Error al generar la factura',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isProcessing.set(false);
    }
  }

  irAPanel() { this.router.navigate(['/admin/panel-pedidos']); }
  irACocina() { this.router.navigate(['/admin/cocina']); }
  irABarra() { this.router.navigate(['/admin/barra']); }
  cerrarSesion() { this.adminAuth.logout(); }
}