import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { qrCodeOutline, printOutline, downloadOutline, copyOutline, checkmarkOutline, linkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-generador-qr',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './generador-qr.component.html',
  styleUrls: ['./generador-qr.component.scss']
})
export class GeneradorQrComponent {
  numeroMesa = signal<number>(1);
  baseUrl = window.location.origin;

  // URL completa que escaneará el cliente
  urlDestino = computed(() => `${this.baseUrl}?mesa=${this.numeroMesa()}`);

  // URL de la API que genera la imagen QR
  qrImageUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(this.urlDestino())}&margin=10`);

  copiado = signal<boolean>(false);

  constructor() {
    addIcons({ qrCodeOutline, printOutline, downloadOutline, copyOutline, checkmarkOutline, linkOutline });
  }

  async copiarEnlace() {
    try {
      await navigator.clipboard.writeText(this.urlDestino());
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    } catch (err) {
      console.error('Error al copiar', err);
    }
  }

  imprimirQr() {
    // Para imprimir correctamente en Ionic, extraemos temporalmente el QR al body
    const printContent = document.querySelector('.print-area');
    if (!printContent) return;

    const originalParent = printContent.parentNode;
    const originalNextSibling = printContent.nextSibling;

    document.body.classList.add('is-printing-qr');
    document.body.appendChild(printContent);

    setTimeout(() => {
      window.print();
      
      // Restauramos el DOM después de imprimir
      document.body.classList.remove('is-printing-qr');
      if (originalNextSibling) {
        originalParent?.insertBefore(printContent, originalNextSibling);
      } else {
        originalParent?.appendChild(printContent);
      }
    }, 100);
  }
}

