import { Component } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent 
} from '@ionic/angular/standalone';

/**
 * Página de Inicio de la aplicación.
 * Punto de entrada después de que el usuario se identifique.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true, // Indica que este componente maneja sus propias dependencias
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent
  ],
})
export class HomePage {
  /**
   * Título principal de la vista
   */
  tituloPagina: string = 'Gestión de Comandas';

  constructor() {
    // Aquí se cargarían inicialmente las comandas o el estado del restaurante
  }
}
