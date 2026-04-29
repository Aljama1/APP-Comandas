import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComandaFirestoreService } from '../../../core/services/comanda-firestore.service';
import { ComandaService } from '../../../core/services/comanda.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { EstadoComanda } from '../../../core/models/comanda.interface';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  flameOutline,
  checkmarkCircleOutline,
  restaurantOutline,
  homeOutline,
  refreshOutline,
  alertCircleOutline,
  receiptOutline
} from 'ionicons/icons';

/**
 * Componente de Seguimiento de Comanda en Tiempo Real.
 *
 * Muestra al comensal el progreso de su pedido mediante un rastreador
 * visual (stepper) que refleja los cambios que la cocina realiza en
 * Firestore. No necesita polling: la vista se actualiza sola gracias
 * a la combinación de `onSnapshot` (Firestore) + `signal` (Angular).
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
  // Cada paso tiene un icono, etiqueta y descripción para el usuario.
  // El orden del array define el orden visual del stepper.
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

  // ─── Signals derivados para la vista (solo lectura) ──────────────

  /** Estado actual proveniente de Firestore (reactivo) */
  public estadoActual = this.firestoreService.estadoComandaActiva;

  /** Datos completos de la comanda (para mostrar el resumen) */
  public datosComanda = this.firestoreService.datosComandaActiva;

  /** Mensaje de error de conexión, si existe */
  public error = this.firestoreService.errorEscucha;

  /**
   * Índice numérico del paso actual en el stepper.
   * Se usa en la plantilla para pintar pasos completados vs pendientes.
   * Si el estado no se encuentra (ej. null), devuelve -1.
   */
  public indicePasoActual = computed(() => {
    const estado = this.estadoActual();
    if (!estado) return -1;
    return this.pasosEstado.findIndex(p => p.estado === estado);
  });

  /**
   * Nombre del cliente para personalizar el mensaje de bienvenida.
   */
  public nombreCliente = computed(() => {
    return this.usuarioService.perfil()?.nombre ?? 'Cliente';
  });

  constructor() {
    addIcons({
      timeOutline, flameOutline, checkmarkCircleOutline,
      restaurantOutline, homeOutline, refreshOutline,
      alertCircleOutline, receiptOutline
    });

    // Si no hay comanda activa, redirigir a la carta
    if (!this.firestoreService.idComandaActiva()) {
      this.router.navigateByUrl('/carta');
    }
  }

  /**
   * Cierra el seguimiento, limpia el estado y vuelve al inicio.
   * Solo se ofrece cuando la comanda ya ha sido SERVIDA.
   */
  volverAlInicio(): void {
    this.firestoreService.limpiarSeguimiento();
    this.comandaService.vaciarComanda();
    this.router.navigateByUrl('/check-in');
  }
}
