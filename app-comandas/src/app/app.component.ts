import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { UserSettingsService } from './core/services/user-settings.service';
import { LanguageService } from './core/services/language.service';

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
  // Inyectar servicios para que se inicialicen en el arranque
  private settings = inject(UserSettingsService);
  private language = inject(LanguageService);

  constructor() {
    console.log('Trace — Gestión de Comandas inicializada.');
  }
}

