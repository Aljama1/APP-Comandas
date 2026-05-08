export interface RangoHorario {
  inicio: string; // Formato "HH:mm" (ej. "13:00")
  fin: string;    // Formato "HH:mm" (ej. "16:30")
}

export interface HorariosTurnos {
  ALMUERZO: RangoHorario;
  CENA: RangoHorario;
}

export interface ConfiguracionRestaurante {
  horariosTurnos: HorariosTurnos;
}
