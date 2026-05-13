import { Component, inject } from '@angular/core';

import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline, logInOutline, alertCircleOutline, flameOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslateModule],
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss']
})
export class LoginAdminComponent {
  email: string = '';
  password: string = '';

  private adminAuth = inject(AdminAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  // Detectamos de qué panel viene el usuario para personalizar la pantalla de login
  get rolAdmin(): 'cocina' | 'barra' | 'sala' {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    if (returnUrl.includes('cocina')) return 'cocina';
    if (returnUrl.includes('barra')) return 'barra';
    return 'sala';
  }

  constructor() {
    addIcons({ lockClosedOutline, mailOutline, logInOutline, alertCircleOutline, flameOutline });
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

      // Inteligencia de rutas: miramos si el usuario venía de /admin/cocina o similar
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/panel-pedidos';

      // Navegamos a donde quería ir originalmente, o a la barra por defecto
      this.router.navigateByUrl(returnUrl);
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
