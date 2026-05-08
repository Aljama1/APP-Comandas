import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  /**
   * Reproduce un sonido (ping) de "Campana de Servicio de Restaurante" 
   * utilizando la Web Audio API sintetizando frecuencias inarmónicas.
   * Ideal para notificaciones de nuevos pedidos o platos listos.
   */
  public reproducirPing() {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();

      const playTone = (freq: number, type: OscillatorType, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Ataque percusivo y metálico (golpe a la campana)
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
        
        // Desvanecimiento lento (resonancia en el aire)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      };

      // Simulamos una campanilla de mostrador pequeña y muy aguda (¡Ding!)
      // Usamos múltiples tonos para darle ese timbre metálico inarmónico
      playTone(3500, 'sine', 1.2, 0.4);      // Tono principal agudo y directo
      playTone(4800, 'sine', 0.8, 0.15);     // Brillo metálico
      playTone(6200, 'sine', 0.4, 0.08);     // Resonancia fina inicial
      
    } catch (e) {
      console.warn('API de Audio no soportada o bloqueada por el navegador', e);
    }
  }

  /**
   * Sonido sutil de "clic" o "notificación suave" para interacciones de UI.
   */
  public reproducirNotificacionSuave() {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // La
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  /**
   * Sonido de éxito (ej. pedido enviado correctamente)
   */
  public reproducirExito() {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playNote(523.25, 0, 0.2);     // Do5
      playNote(659.25, 0.1, 0.3);  // Mi5
    } catch (e) {}
  }
}
