import { Component, inject, signal, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController, IonPopover } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { ProductoAdminService } from '../../../core/services/producto-admin.service';
import { updatePassword } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { 
  personCircleOutline, settingsOutline, chevronUpOutline, sunnyOutline, 
  moonOutline, volumeHighOutline, volumeMuteOutline, logOutOutline, 
  keyOutline, chevronForwardOutline, notificationsOutline, restaurantOutline, barChartOutline, qrCodeOutline, receiptOutline, languageOutline
} from 'ionicons/icons';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-config-bar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-config-bar.component.html',
  styleUrls: ['./admin-config-bar.component.scss']
})
export class AdminConfigBarComponent implements OnInit {
  authService = inject(AdminAuthService);
  settingsService = inject(UserSettingsService);
  productoAdminService = inject(ProductoAdminService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private translate = inject(TranslateService);
  @ViewChild('configPopover') popover!: IonPopover;

  // Ya no usamos isExpanded, usamos el popover de Ionic
  
  constructor() {
    addIcons({
      personCircleOutline, settingsOutline, chevronUpOutline, sunnyOutline,
      moonOutline, volumeHighOutline, volumeMuteOutline, logOutOutline,
      keyOutline, chevronForwardOutline, notificationsOutline, restaurantOutline, barChartOutline, qrCodeOutline, receiptOutline, languageOutline
    });
  }

  ngOnInit() {
    // Ejecutar migración de productos antiguos (Fase 10)
    this.productoAdminService.migrarProductosAntiguos().then(() => {
      console.log('Script de migración ejecutado correctamente.');
    }).catch(err => {
      console.error('Error en migración:', err);
    });
  }

  get idiomaActual(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  toggleIdioma(): void {
    const nuevoIdioma = this.idiomaActual === 'es' ? 'en' : 'es';
    this.translate.use(nuevoIdioma);
    localStorage.setItem('app_lang', nuevoIdioma);
  }

  async changePassword() {
    this.popover.dismiss();
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
    this.popover.dismiss();
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

  irAGestionProductos() { 
    this.popover.dismiss();
    this.router.navigate(['/admin/productos']); 
  }
  irAMetricas() { 
    this.popover.dismiss();
    this.router.navigate(['/admin/metricas']); 
  }
  irAGeneradorQr() { 
    this.popover.dismiss();
    this.router.navigate(['/admin/qr']); 
  }
  irACuentas() {
    this.popover.dismiss();
    this.router.navigate(['/admin/cuentas']);
  }
}

