import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { UserSettingsService } from './core/services/user-settings.service';

/**
 * Componente principal de la aplicación.
 * El dark mode se gestiona globalmente a través de UserSettingsService.
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  // Inyectar el servicio para que se inicialice en el arranque y aplique el tema
  private settings = inject(UserSettingsService);

  constructor() {
    console.log('Trace — Gestión de Comandas inicializada.');
  }
}

