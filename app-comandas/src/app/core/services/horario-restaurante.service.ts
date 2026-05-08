import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { ConfiguracionRestaurante, RangoHorario } from '../models/horario-restaurante.model';
import { Turno } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class HorarioRestauranteService {
  private firestore = inject(Firestore);
  
  public configuracion = signal<ConfiguracionRestaurante | null>(null);
  public cargando = signal<boolean>(true);

  // Calcula el turno actual basándose en la configuración cargada y la hora local
  public turnoActual = computed<Turno | null>(() => {
    const config = this.configuracion();
    if (!config) return null;

    const ahora = new Date();
    const horas = ahora.getHours();
    const minutos = ahora.getMinutes();
    const tiempoActualMinutos = horas * 60 + minutos;

    if (this.estaEnRango(config.horariosTurnos.ALMUERZO, tiempoActualMinutos)) {
      return 'ALMUERZO';
    }
    
    if (this.estaEnRango(config.horariosTurnos.CENA, tiempoActualMinutos)) {
      return 'CENA';
    }

    return null; // Fuera de servicio
  });

  constructor() {
    this.escucharConfiguracion();
  }

  private escucharConfiguracion() {
    const configDocRef = doc(this.firestore, 'configuracion/general');
    
    onSnapshot(configDocRef, (snapshot) => {
      if (snapshot.exists()) {
        this.configuracion.set(snapshot.data() as ConfiguracionRestaurante);
      } else {
        // Fallback por defecto si no existe el documento aún en Firestore
        this.configuracion.set({
          horariosTurnos: {
            ALMUERZO: { inicio: "13:00", fin: "16:30" },
            CENA: { inicio: "20:00", fin: "23:30" }
          }
        });
      }
      this.cargando.set(false);
    }, (error) => {
      console.error('Error escuchando configuración:', error);
      this.cargando.set(false);
    });
  }

  private estaEnRango(rango: RangoHorario, tiempoActualMinutos: number): boolean {
    const parseHora = (horaStr: string) => {
      const [h, m] = horaStr.split(':').map(Number);
      return h * 60 + m;
    };

    const inicioMin = parseHora(rango.inicio);
    const finMin = parseHora(rango.fin);

    // Maneja cruce de medianoche (ej. 20:00 a 02:00)
    if (inicioMin <= finMin) {
      return tiempoActualMinutos >= inicioMin && tiempoActualMinutos <= finMin;
    } else {
      return tiempoActualMinutos >= inicioMin || tiempoActualMinutos <= finMin;
    }
  }
}
