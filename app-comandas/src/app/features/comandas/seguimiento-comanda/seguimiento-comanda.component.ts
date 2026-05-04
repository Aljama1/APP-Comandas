import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComandaFirestoreService } from '../../../core/services/comanda-firestore.service';
import { ComandaService } from '../../../core/services/comanda.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { EstadoComanda, Comanda } from '../../../core/models/comanda.interface';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  flameOutline,
  checkmarkCircleOutline,
  restaurantOutline,
  homeOutline,
  refreshOutline,
  alertCircleOutline,
  receiptOutline,
  addCircleOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';

/**
 * Componente de Seguimiento de Comanda en Tiempo Real.
 *
 * Muestra al comensal el progreso de TODAS sus rondas de pedidos,
 * cada una con su propio indicador de estado. La ronda más reciente
 * se muestra con el stepper completo; las anteriores se muestran
 * como tarjetas compactas con indicador de estado.
 *
 * Todas las rondas se actualizan en tiempo real gracias a una única
 * query de Firestore (patrón Observer sobre colección filtrada).
 *
 * Acciones disponibles:
 *   - Pedir otra ronda (vuelve a la carta sin cerrar sesión).
 *   - Cerrar sesión (solo cuando todas las rondas están servidas).
 */
@Component({
  selector: 'app-seguimiento-comanda',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './seguimiento-comanda.component.html',
  styleUrls: ['./seguimiento-comanda.component.scss']
})
export class SeguimientoComandaComponent {
  private firestoreService = inject(ComandaFirestoreService);
  private comandaService = inject(ComandaService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // ─── Definición ordenada de los pasos del flujo de cocina ────────
  readonly pasosEstado: { estado: EstadoComanda; icono: string; etiqueta: string; descripcion: string }[] = [
    {
      estado: 'PENDIENTE',
      icono: 'time-outline',
      etiqueta: 'Recibida',
      descripcion: 'Tu comanda ha sido registrada y está en cola.'
    },
    {
      estado: 'PREPARANDO',
      icono: 'flame-outline',
      etiqueta: 'En preparación',
      descripcion: 'El equipo de cocina está trabajando en tu pedido.'
    },
    {
      estado: 'LISTO',
      icono: 'checkmark-circle-outline',
      etiqueta: 'Lista para servir',
      descripcion: '¡Tu comanda está lista! Un camarero la llevará a tu mesa.'
    },
    {
      estado: 'SERVIDO',
      icono: 'restaurant-outline',
      etiqueta: 'Servida',
      descripcion: '¡Buen provecho! Tu pedido ya ha sido entregado en la mesa.'
    }
  ];

  // ─── Signals del servicio expuestos a la vista ───────────────────

  /** Todas las comandas en tiempo real */
  public todasLasComandas = this.firestoreService.todasLasComandas;

  /** La comanda más reciente (la del stepper principal) */
  public comandaMasReciente = this.firestoreService.comandaMasReciente;

  /** Estado de la comanda más reciente */
  public estadoActual = this.firestoreService.estadoComandaActiva;

  /** Número total de rondas */
  public totalRondas = this.firestoreService.totalRondas;

  /** Error de conexión */
  public error = this.firestoreService.errorEscucha;

  /** Verdadero si TODAS las rondas están servidas */
  public todasServidas = this.firestoreService.todasServidas;

  // ─── Signals computados para la vista ────────────────────────────

  /**
   * Rondas anteriores (todas excepto la más reciente).
   * Se muestran como tarjetas compactas debajo del stepper principal.
   */
  public rondasAnteriores = computed(() => {
    const todas = this.todasLasComandas();
    return todas.length > 1 ? todas.slice(0, -1) : [];
  });

  /**
   * Índice del paso actual en el stepper (para la comanda más reciente).
   */
  public indicePasoActual = computed(() => {
    const estado = this.estadoActual();
    if (!estado) return -1;
    return this.pasosEstado.findIndex(p => p.estado === estado);
  });

  /** Nombre del cliente */
  public nombreCliente = computed(() => {
    return this.usuarioService.perfil()?.nombre ?? 'Cliente';
  });

  constructor() {
    addIcons({
      timeOutline, flameOutline, checkmarkCircleOutline,
      restaurantOutline, homeOutline, refreshOutline,
      alertCircleOutline, receiptOutline, addCircleOutline,
      chevronDownOutline, chevronUpOutline
    });

    // Si no hay comanda activa ni sesión guardada, redirigir a la carta
    if (!this.firestoreService.tieneComandas() && !this.firestoreService.comandaMasReciente()) {
      this.router.navigateByUrl('/carta');
    }
  }

  /**
   * Devuelve el índice del paso para un estado dado.
   * Se usa en la plantilla para pintar el estado de las rondas anteriores.
   */
  obtenerIndicePaso(estado: EstadoComanda): number {
    return this.pasosEstado.findIndex(p => p.estado === estado);
  }

  /**
   * Devuelve una etiqueta legible para un estado.
   */
  obtenerEtiquetaEstado(estado: EstadoComanda): string {
    return this.pasosEstado.find(p => p.estado === estado)?.etiqueta ?? estado;
  }

  /**
   * Permite al cliente pedir otra ronda sin cerrar sesión.
   */
  nuevaRonda(): void {
    this.router.navigateByUrl('/carta');
  }

  /**
   * Cierra completamente la sesión.
   */
  volverAlInicio(): void {
    this.firestoreService.limpiarSeguimiento();
    this.comandaService.vaciarComanda();
    this.router.navigateByUrl('/check-in');
  }
}
