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
  timeOutline, flameOutline, checkmarkCircleOutline, restaurantOutline,
  arrowBackOutline, refreshOutline, alertCircleOutline, addCircleOutline,
  homeOutline, receiptOutline
} from 'ionicons/icons';

/**
 * Vista "Mis Pedidos" — muestra TODOS los items pedidos en todas las rondas,
 * agrupados por ronda, cada uno con el estado de su ronda.
 *
 * El estado es a nivel de Comanda (ronda), no a nivel de línea individual,
 * ya que todos los items de una ronda se preparan y sirven juntos.
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

  // ── Signals del servicio ─────────────────────────────────────────
  public todasLasComandas = this.firestoreService.todasLasComandas;
  public error = this.firestoreService.errorEscucha;
  public todasServidas = this.firestoreService.todasServidas;

  // ── Computed ─────────────────────────────────────────────────────
  public nombreCliente = computed(() => this.usuarioService.perfil()?.nombre ?? 'Cliente');

  /** Total acumulado de todas las rondas */
  public totalAcumulado = computed(() =>
    this.todasLasComandas().reduce((sum, c) => sum + c.precioTotal, 0)
  );

  /** Número total de items en todas las rondas */
  public totalItems = computed(() =>
    this.todasLasComandas().reduce((sum, c) => sum + c.lineasComanda.reduce((s, l) => s + l.cantidad, 0), 0)
  );

  constructor() {
    addIcons({
      timeOutline, flameOutline, checkmarkCircleOutline, restaurantOutline,
      arrowBackOutline, refreshOutline, alertCircleOutline, addCircleOutline,
      homeOutline, receiptOutline
    });

    if (!this.firestoreService.tieneComandas()) {
      this.router.navigateByUrl('/carta');
    }
  }

  // ── Helpers de estado ────────────────────────────────────────────
  getEstadoConfig(estado: EstadoComanda): { icono: string; etiqueta: string; clase: string } {
    const configs: Record<EstadoComanda, { icono: string; etiqueta: string; clase: string }> = {
      'PENDIENTE':   { icono: 'time-outline',              etiqueta: 'Pendiente',    clase: 'estado--pendiente' },
      'PREPARANDO':  { icono: 'flame-outline',             etiqueta: 'En cocina',    clase: 'estado--preparando' },
      'LISTO':       { icono: 'checkmark-circle-outline',  etiqueta: 'Listo',        clase: 'estado--listo' },
      'SERVIDO':     { icono: 'restaurant-outline',        etiqueta: 'Servido',      clase: 'estado--servido' },
      'PAGADO':      { icono: 'checkmark-circle-outline',  etiqueta: 'Pagado',       clase: 'estado--servido' },
      'CANCELADO':   { icono: 'alert-circle-outline',      etiqueta: 'Cancelado',    clase: 'estado--cancelado' },
    };
    return configs[estado] ?? { icono: 'time-outline', etiqueta: estado, clase: '' };
  }

  esServido(estado: EstadoComanda): boolean {
    return estado === 'SERVIDO' || estado === 'PAGADO';
  }

  // ── Acciones ─────────────────────────────────────────────────────
  volver(): void {
    this.router.navigateByUrl('/carta');
  }

  nuevaRonda(): void {
    this.router.navigateByUrl('/carta');
  }

  cerrarSesion(): void {
    this.firestoreService.limpiarSeguimiento();
    this.comandaService.vaciarComanda();
    this.router.navigateByUrl('/check-in');
  }
}
