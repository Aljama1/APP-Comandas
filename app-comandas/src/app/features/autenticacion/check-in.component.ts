import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { FormsModule } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { UsuarioService } from '../../core/services/usuario.service';
import { PerfilUsuario } from '../../core/models/perfil-usuario.model';
import { addIcons } from 'ionicons';
import {
  nutritionOutline,
  waterOutline,
  leafOutline,
  eggOutline,
  fishOutline,
  restaurantOutline,
  personOutline,
  scanOutline,
  arrowForwardOutline,
  lockClosedOutline,
  qrCodeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './check-in.component.html',
  styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent {
  nombre: string = '';
  mesaId: number | null = null;
  mesaDesdeQR: boolean = false;

  // Lista de alérgenos del TFG (siguiendo normativa europea)
  alergenos = [
    { id: 'gluten', nombre: 'Gluten', icono: '/assets/icon/gluten.svg', activo: false, esSvg: true },
    { id: 'lactosa', nombre: 'Lactosa', icono: '/assets/icon/lactosa.svg', activo: false, esSvg: true },
    { id: 'frutos-secos', nombre: 'F. Secos', icono: '/assets/icon/frutos-secos.svg', activo: false, esSvg: true },
    { id: 'huevo', nombre: 'Huevo', icono: 'egg-outline', activo: false, esSvg: false },
    { id: 'pescado', nombre: 'Pescado', icono: 'fish-outline', activo: false, esSvg: false },
    { id: 'marisco', nombre: 'Marisco', icono: 'restaurant-outline', activo: false, esSvg: false }
  ];

  // Inyección de servicios
  private usuarioService = inject(UsuarioService);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);

  constructor(private router: Router) {
    // Registro de iconos
    addIcons({
      'egg-outline': eggOutline,
      'fish-outline': fishOutline,
      'restaurant-outline': restaurantOutline,
      'person-outline': personOutline,
      'scan-outline': scanOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'lock-closed-outline': lockClosedOutline,
      'qr-code-outline': qrCodeOutline
    });

    // Leer parámetro de mesa desde la URL (QR)
    const mesa = this.route.snapshot.queryParamMap.get('mesa');
    if (mesa) {
      this.mesaId = Number(mesa);
      this.mesaDesdeQR = true;
    }

    // Si ya existe una sesión guardada, saltar directamente a la carta
    if (this.usuarioService.estaAutenticado()) {
      this.router.navigate(['/carta']);
    }
  }

  toggleAlergeno(id: string) {
    const alergeno = this.alergenos.find(a => a.id === id);
    if (alergeno) {
      alergeno.activo = !alergeno.activo;
    }
  }

  async acceder() {
    if (!this.nombre || !this.mesaId) {
      alert('Por favor, indica tu nombre y el número de mesa para continuar.');
      return;
    }

    try {
      // 1. Autenticación Anónima en Firebase
      const credential = await signInAnonymously(this.auth);
      const uid = credential.user.uid;

      // 2. Creamos el objeto de perfil con el UID incluido
      const nuevoPerfil: PerfilUsuario = {
        uid: uid,
        nombre: this.nombre,
        mesaId: this.mesaId,
        alergenos: this.alergenos.filter(a => a.activo).map(a => a.id)
      };

      // 3. Guardamos en el estado global (Signal)
      this.usuarioService.establecerPerfil(nuevoPerfil);

      console.log('Check-in exitoso. UID:', uid);

      // 4. Navegamos a la carta
      this.router.navigate(['/carta']);

    } catch (error) {
      console.error('Error en el check-in:', error);
      alert('Hubo un problema al conectar con el servidor. Por favor, inténtalo de nuevo.');
    }
  }
}
