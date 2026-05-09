import { Component, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { UsuarioService } from '../../core/services/usuario.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { PerfilUsuario } from '../../core/models/perfil-usuario.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  nutritionOutline, waterOutline, leafOutline, eggOutline, fishOutline,
  restaurantOutline, personOutline, scanOutline, arrowForwardOutline,
  lockClosedOutline, qrCodeOutline, moonOutline, sunnyOutline,
  checkmarkOutline, closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslateModule],
  templateUrl: './check-in.component.html',
  styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent {
  nombre: string = '';
  mesaId: number | null = null;
  mesaDesdeQR: boolean = false;

  // Errores de validación inline (sin alert() nativo)
  errorNombre = signal<string>('');
  errorMesa = signal<string>('');

  // Lista de alérgenos del TFG (siguiendo normativa europea)
  alergenos = [
    { id: 'gluten',       nombre: 'ALERGENOS.gluten',    icono: '/assets/icon/gluten.svg',        activo: false, esSvg: true  },
    { id: 'lactosa',      nombre: 'ALERGENOS.lactosa',   icono: '/assets/icon/lactosa.svg',       activo: false, esSvg: true  },
    { id: 'frutos-secos', nombre: 'ALERGENOS.frutos-secos',  icono: '/assets/icon/frutos-secos.svg',  activo: false, esSvg: true  },
    { id: 'huevo',        nombre: 'ALERGENOS.huevo',     icono: 'egg-outline',                    activo: false, esSvg: false },
    { id: 'pescado',      nombre: 'ALERGENOS.pescado',   icono: 'fish-outline',                   activo: false, esSvg: false },
    { id: 'marisco',      nombre: 'ALERGENOS.marisco',   icono: 'restaurant-outline',             activo: false, esSvg: false }
  ];

  private usuarioService = inject(UsuarioService);
  public settings = inject(UserSettingsService);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  constructor(private router: Router) {
    addIcons({
      'egg-outline': eggOutline,
      'fish-outline': fishOutline,
      'restaurant-outline': restaurantOutline,
      'person-outline': personOutline,
      'scan-outline': scanOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'lock-closed-outline': lockClosedOutline,
      'qr-code-outline': qrCodeOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
      'checkmark-outline': checkmarkOutline,
      'close-outline': closeOutline,
    });

    const mesa = this.route.snapshot.queryParamMap.get('mesa');
    if (mesa) {
      this.mesaId = Number(mesa);
      this.mesaDesdeQR = true;
    }

    if (this.usuarioService.estaAutenticado()) {
      this.router.navigate(['/carta']);
    }
  }

  toggleAlergeno(id: string) {
    const alergeno = this.alergenos.find(a => a.id === id);
    if (alergeno) alergeno.activo = !alergeno.activo;
  }

  /** Limpia el error del campo nombre al escribir */
  onNombreChange() {
    if (this.nombre.trim()) this.errorNombre.set('');
  }

  /** Limpia el error del campo mesa al escribir */
  onMesaChange() {
    if (this.mesaId) this.errorMesa.set('');
  }

  async acceder() {
    // Validación inline
    let valid = true;
    if (!this.nombre.trim()) {
      this.errorNombre.set(this.translate.instant('CHECKIN.ERROR_NOMBRE'));
      valid = false;
    } else {
      this.errorNombre.set('');
    }
    if (!this.mesaId) {
      this.errorMesa.set(this.translate.instant('CHECKIN.ERROR_MESA'));
      valid = false;
    } else {
      this.errorMesa.set('');
    }
    if (!valid) return;

    try {
      const credential = await signInAnonymously(this.auth);
      const uid = credential.user.uid;

      const nuevoPerfil: PerfilUsuario = {
        uid,
        nombre: this.nombre,
        mesaId: this.mesaId!,
        alergenos: this.alergenos.filter(a => a.activo).map(a => a.id)
      };

      this.usuarioService.establecerPerfil(nuevoPerfil);
      this.router.navigate(['/carta']);

    } catch (error) {
      console.error('Error en el check-in:', error);
      this.errorNombre.set(this.translate.instant('CHECKIN.ERROR_CONEXION'));
    }
  }
}
