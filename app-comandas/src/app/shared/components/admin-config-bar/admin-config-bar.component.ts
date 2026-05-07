import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { updatePassword } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { 
  personCircleOutline, settingsOutline, chevronUpOutline, sunnyOutline, 
  moonOutline, volumeHighOutline, volumeMuteOutline, logOutOutline, 
  keyOutline, chevronForwardOutline, notificationsOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-config-bar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-config-bar.component.html',
  styleUrls: ['./admin-config-bar.component.scss']
})
export class AdminConfigBarComponent {
  authService = inject(AdminAuthService);
  settingsService = inject(UserSettingsService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  // Ya no usamos isExpanded, usamos el popover de Ionic
  
  constructor() {
    addIcons({
      personCircleOutline, settingsOutline, chevronUpOutline, sunnyOutline,
      moonOutline, volumeHighOutline, volumeMuteOutline, logOutOutline,
      keyOutline, chevronForwardOutline, notificationsOutline
    });
  }

  async changePassword() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar Contraseña',
      inputs: [
        { name: 'newPassword', type: 'password', placeholder: 'Nueva contraseña' },
        { name: 'confirmPassword', type: 'password', placeholder: 'Confirmar contraseña' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: async (data) => {
            if (!data.newPassword || data.newPassword.length < 6) {
              this.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
              return false;
            }
            if (data.newPassword !== data.confirmPassword) {
              this.showToast('Las contraseñas no coinciden', 'danger');
              return false;
            }

            try {
              const user = this.authService.adminUser();
              if (user) {
                await updatePassword(user, data.newPassword);
                this.showToast('Contraseña actualizada correctamente', 'success');
                return true;
              }
            } catch (error: any) {
              this.showToast('Error: ' + (error.message || 'No se pudo actualizar'), 'danger');
            }
            return false;
          }
        }
      ]
    });
    await alert.present();
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          cssClass: 'alert-button-confirm',
          handler: () => { this.authService.logout(); }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  irAGestionProductos() { this.router.navigate(['/admin/productos']); }
}

