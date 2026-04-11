import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

/**
 * Componente principal de la aplicación.
 * Este componente actúa como el contenedor base para toda la app.
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true, // Marcamos el componente como independiente
  imports: [IonApp, IonRouterOutlet], // Importamos los componentes de Ionic necesarios
})
export class AppComponent {
  /**
   * Constructor del componente principal.
   * Aquí se pueden inicializar servicios globales como autenticación o idioma.
   */
  constructor() {
    console.log('Aplicación de Gestión de Comandas inicializada correctamente.');
  }
}
