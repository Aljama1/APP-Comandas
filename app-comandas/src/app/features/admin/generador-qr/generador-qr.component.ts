import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-generador-qr',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule],
  templateUrl: './generador-qr.component.html',
  styleUrls: ['./generador-qr.component.scss']
})
export class GeneradorQrComponent {
  numeroMesa = signal<number>(1);
  manualUrl = signal<string>(''); // Para sobreescribir la URL en producción
  
  // URL base: usa la manual si existe, si no, la del navegador
  baseUrl = computed(() => this.manualUrl() || window.location.origin);

  // URL completa que escaneará el cliente
  urlDestino = computed(() => `${this.baseUrl()}?mesa=${this.numeroMesa()}`);

  // URL de la API que genera la imagen QR
  qrImageUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(this.urlDestino())}&margin=10`);

  copiado = signal<boolean>(false);

  private location = inject(Location);

  volver() {
    this.location.back();
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
    const printContent = document.querySelector('.print-area');
    if (!printContent) return;

    const originalParent = printContent.parentNode;
    const originalNextSibling = printContent.nextSibling;

    const restaurar = () => {
      document.body.classList.remove('is-printing-qr');
      if (originalNextSibling) {
        originalParent?.insertBefore(printContent, originalNextSibling);
      } else {
        originalParent?.appendChild(printContent);
      }
    };

    document.body.classList.add('is-printing-qr');
    document.body.appendChild(printContent);

    setTimeout(() => {
      try {
        window.print();
      } finally {
        restaurar();
      }
    }, 100);
  }
}



