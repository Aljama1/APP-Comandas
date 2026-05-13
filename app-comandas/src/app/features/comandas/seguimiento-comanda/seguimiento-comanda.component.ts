import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComandaFirestoreService } from '../../../core/services/comanda-firestore.service';
import { ComandaService } from '../../../core/services/comanda.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateContentPipe } from '../../../core/pipes/translate-content.pipe';
import { UsuarioService } from '../../../core/services/usuario.service';
import { EstadoComanda, Comanda } from '../../../core/models/comanda.model';

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
  imports: [CommonModule, IonicModule, TranslateModule, TranslateContentPipe],
  templateUrl: './seguimiento-comanda.component.html',
  styleUrls: ['./seguimiento-comanda.component.scss']
})
export class SeguimientoComandaComponent {
  private firestoreService = inject(ComandaFirestoreService);
  private comandaService = inject(ComandaService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  // ── Signals del servicio ─────────────────────────────────────────
  public todasLasComandas = this.firestoreService.todasLasComandas;
  public error = this.firestoreService.errorEscucha;
  public todasServidas = this.firestoreService.todasServidas;
  public enviandoPedirCuenta = signal(false);

  // ── Computed ─────────────────────────────────────────────────────
  public nombreCliente = computed(() => this.usuarioService.perfil()?.nombre ?? 'Cliente');

  /** Total acumulado de todas las rondas */
  public totalAcumulado = computed(() =>
    this.todasLasComandas().reduce((sum, c) => sum + c.precioTotal, 0)
  );

  /** True si al menos una comanda activa tiene solicitaCuenta=true */
  public cuentaSolicitada = computed(() =>
    this.todasLasComandas().some(c => c.solicitaCuenta === true)
  );

  /** Número total de items en todas las rondas */
  public totalItems = computed(() =>
    this.todasLasComandas().reduce((sum, c) => sum + c.lineasComanda.reduce((s, l) => s + l.cantidad, 0), 0)
  );

  constructor() {
    if (!this.firestoreService.tieneComandas()) {
      this.router.navigateByUrl('/carta');
    }
  }

  // ── Helpers de estado ────────────────────────────────────────────
  getEstadoConfig(estado: EstadoComanda): { icono: string; etiqueta: string; clase: string } {
    const configs: Record<EstadoComanda, { icono: string; etiqueta: string; clase: string }> = {
      'PENDIENTE':   { icono: 'time-outline',              etiqueta: 'ESTADOS.PENDIENTE',    clase: 'estado--pendiente' },
      'PREPARANDO':  { icono: 'flame-outline',             etiqueta: 'ESTADOS.PREPARANDO',   clase: 'estado--preparando' },
      'SERVIDO':     { icono: 'restaurant-outline',        etiqueta: 'ESTADOS.SERVIDO',      clase: 'estado--servido' },
      'PAGADO':      { icono: 'checkmark-circle-outline',  etiqueta: 'ESTADOS.PAGADO',       clase: 'estado--servido' },
      'CANCELADO':   { icono: 'alert-circle-outline',      etiqueta: 'ESTADOS.CANCELADO',    clase: 'estado--cancelado' },
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

  async pedirCuenta(): Promise<void> {
    if (this.enviandoPedirCuenta() || this.cuentaSolicitada()) return;
    this.enviandoPedirCuenta.set(true);
    try {
      await this.firestoreService.pedirCuenta();
      const toast = await this.toastCtrl.create({
        message: 'Cuenta solicitada. Un camarero pasará en breve.',
        duration: 3500,
        position: 'top',
        color: 'success',
        icon: 'checkmark-circle-outline',
      });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'No se ha podido enviar la solicitud. Inténtalo de nuevo.',
        duration: 3500,
        position: 'top',
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.enviandoPedirCuenta.set(false);
    }
  }

  cerrarSesion(): void {
    this.firestoreService.limpiarSeguimiento();
    this.comandaService.vaciarComanda();
    this.router.navigateByUrl('/check-in');
  }
}


