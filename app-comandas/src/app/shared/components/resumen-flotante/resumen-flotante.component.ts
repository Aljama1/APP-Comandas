import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComandaService } from '../../../core/services/comanda.service';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-resumen-flotante',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './resumen-flotante.component.html',
  styleUrls: ['./resumen-flotante.component.scss']
})
export class ResumenFlotanteComponent {
  public comandaService = inject(ComandaService);
  private router = inject(Router);

  constructor() {
    addIcons({ chevronForwardOutline });
  }

  irALaComanda() {
    this.router.navigateByUrl('/resumen-comanda');
  }
}
