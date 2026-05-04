import { Component, inject } from '@angular/core';

import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline, logInOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss']
})
export class LoginAdminComponent {
  email: string = '';
  password: string = '';

  private adminAuth = inject(AdminAuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ lockClosedOutline, mailOutline, logInOutline, alertCircleOutline });
  }

  async acceder() {
    if (!this.email || !this.password) {
      this.mostrarError('Por favor, rellena todos los campos.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Verificando credenciales...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.adminAuth.login(this.email, this.password);
      await loading.dismiss();
      // Tras el login exitoso, navegamos al panel
      this.router.navigate(['/admin/panel-pedidos']);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error login admin:', error);
      
      let mensaje = 'Error de conexión. Inténtalo de nuevo.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        mensaje = 'Correo o contraseña incorrectos.';
      }
      this.mostrarError(mensaje);
    }
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }
}
