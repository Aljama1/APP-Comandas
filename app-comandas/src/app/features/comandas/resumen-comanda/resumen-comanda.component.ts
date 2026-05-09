import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComandaService } from '../../../core/services/comanda.service';
import { ComandaFirestoreService } from '../../../core/services/comanda-firestore.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AudioService } from '../../../core/services/audio.service';
import { Comanda, LineaComanda } from '../../../core/models/comanda.model';
import { TranslateService } from '@ngx-translate/core';
import { getTranslation } from '../../../core/models/common.model';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline, removeOutline, chatbubbleEllipsesOutline, checkmarkCircleOutline, arrowBackOutline, readerOutline } from 'ionicons/icons';

import { TranslateModule } from '@ngx-translate/core';
import { TranslateContentPipe } from '../../../core/pipes/translate-content.pipe';

@Component({
  selector: 'app-resumen-comanda',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, TranslateContentPipe],
  templateUrl: './resumen-comanda.component.html',
  styleUrls: ['./resumen-comanda.component.scss']
})
export class ResumenComandaComponent {
  public comandaService = inject(ComandaService);
  public firestoreService = inject(ComandaFirestoreService);
  private usuarioService = inject(UsuarioService);
  private audioService = inject(AudioService);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private router = inject(Router);
  private translate = inject(TranslateService);

  constructor() {
    addIcons({ trashOutline, addOutline, removeOutline, chatbubbleEllipsesOutline, checkmarkCircleOutline, arrowBackOutline, readerOutline });
  }

  volver() {
    this.router.navigateByUrl('/carta');
  }

  actualizarCantidad(linea: LineaComanda, operacion: 'incrementar' | 'decrementar') {
    this.comandaService.actualizarCantidad(linea, operacion);
  }

  eliminarLinea(linea: LineaComanda) {
    this.comandaService.eliminarLinea(linea);
  }

  async abrirNotas(linea: LineaComanda) {
    const alert = await this.alertController.create({
      header: 'Notas a cocina',
      subHeader: getTranslation(linea.nombreProducto, this.translate.currentLang),
      message: 'Indica si tienes alguna preferencia (ej. "poco hecho", "salsa aparte").',
      cssClass: 'premium-alert',
      mode: 'ios',
      inputs: [
        {
          name: 'nota',
          type: 'text',
          placeholder: 'Escribe tu nota aquí...',
          value: linea.notasEspeciales || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevaNota = data.nota?.trim();
            this.comandaService.actualizarNotasLinea(linea, nuevaNota);
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarPedido() {
    const perfil = this.usuarioService.perfil();
    
    if (!perfil || !perfil.uid) {
      const errorAlert = await this.alertController.create({
        header: 'Error de sesión',
        message: 'No hemos podido identificar tu mesa. Por favor, vuelve a hacer check-in.',
        buttons: ['Aceptar']
      });
      await errorAlert.present();
      return;
    }

    const confirmAlert = await this.alertController.create({
      header: 'Confirmar pedido',
      message: '¿Quieres enviar tu comanda a cocina?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: () => this.enviarAFirestore(perfil)
        }
      ]
    });

    await confirmAlert.present();
  }

  private async enviarAFirestore(perfil: any) {
    const loading = await this.loadingController.create({
      message: 'Enviando comanda...',
      mode: 'ios'
    });
    await loading.present();

    try {
      const nuevaComanda: Comanda = {
        idMesa: perfil.mesaId.toString(),
        idCliente: perfil.uid,
        nombreCliente: perfil.nombre,
        lineasComanda: this.comandaService.lineasComanda(),
        estado: 'PENDIENTE',
        precioTotal: this.comandaService.subtotalComanda(),
        fechaCreacion: Date.now(),
        fechaActualizacion: Date.now()
      };

      await this.firestoreService.enviarComanda(nuevaComanda);
      this.audioService.reproducirExito();
      await loading.dismiss();

      const successAlert = await this.alertController.create({
        header: '¡Pedido enviado!',
        message: 'Tu comanda ya está en cocina. Podrás ver su estado en tiempo real.',
        mode: 'ios',
        buttons: [{
          text: 'Ver seguimiento',
          handler: () => {
            this.comandaService.vaciarComanda();
            this.router.navigateByUrl('/seguimiento-comanda');
          }
        }]
      });
      await successAlert.present();

    } catch (error) {
      await loading.dismiss();
      const errorAlert = await this.alertController.create({
        header: 'Error al enviar',
        message: 'No se pudo enviar el pedido. Revisa tu conexión e inténtalo de nuevo.',
        buttons: ['Aceptar']
      });
      await errorAlert.present();
    }
  }
}
// Forzando recompilación
