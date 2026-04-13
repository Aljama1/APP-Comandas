import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  nutritionOutline, 
  waterOutline, 
  leafOutline, 
  eggOutline, 
  fishOutline, 
  restaurantOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './check-in.component.html',
  styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent {
  nombre: string = '';
  mesaId: number | null = null;

  // Lista de alérgenos del TFG (siguiendo normativa europea)
  alergenos = [
    { id: 'gluten', nombre: 'Gluten', icono: 'nutrition-outline', activo: false },
    { id: 'lactosa', nombre: 'Lactosa', icono: 'water-outline', activo: false },
    { id: 'frutos-secos', nombre: 'F. Secos', icono: 'leaf-outline', activo: false },
    { id: 'huevo', nombre: 'Huevo', icono: 'egg-outline', activo: false },
    { id: 'pescado', nombre: 'Pescado', icono: 'fish-outline', activo: false },
    { id: 'marisco', nombre: 'Marisco', icono: 'restaurant-outline', activo: false }
  ];

  constructor(private router: Router) {
    // En las versiones recientes de Ionic (Standalone), debemos registrar 
    // manualmente los iconos para que la app no cargue toda la librería y sea más rápida.
    addIcons({
      'nutrition-outline': nutritionOutline,
      'water-outline': waterOutline,
      'leaf-outline': leafOutline,
      'egg-outline': eggOutline,
      'fish-outline': fishOutline,
      'restaurant-outline': restaurantOutline
    });
  }

  toggleAlergeno(id: string) {
    const alergeno = this.alergenos.find(a => a.id === id);
    if (alergeno) {
      alergeno.activo = !alergeno.activo;
    }
  }

  acceder() {
    if (!this.nombre || !this.mesaId) {
      // Por ahora, solo mostramos una alerta simple si falta algo
      alert('Por favor, indica tu nombre y el número de mesa para continuar.');
      return;
    }

    const alergiasSeleccionadas = this.alergenos.filter(a => a.activo).map(a => a.nombre);
    console.log('Cliente:', this.nombre, 'Mesa:', this.mesaId);
    console.log('Alergias:', alergiasSeleccionadas);
    
    // Próximo hito (Fase 2): Navegaremos a la carta de productos.
    // this.router.navigate(['/carta']);
    alert('¡Check-in completado! Revisa la consola (F12) para ver los datos guardados provisionalmente.');
  }
}
