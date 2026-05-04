import { Injectable, inject, signal, computed, NgZone, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { Comanda, EstadoComanda } from '../models/comanda.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminComandaService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  private injector = inject(EnvironmentInjector);

  // Señal maestra con TODAS las comandas activas (Pendientes, Preparando, Listas)
  private _comandasActivas = signal<Comanda[]>([]);

  // Computed: Clasificamos automáticamente en dos "cubos" para las pestañas
  pedidosPendientes = computed(() => this._comandasActivas().filter(c => c.estado === 'PENDIENTE'));
  pedidosEnCurso = computed(() => this._comandasActivas().filter(c => c.estado === 'PREPARANDO' || c.estado === 'LISTO'));
  pedidosHistorial = computed(() => this._comandasActivas().filter(c => c.estado === 'SERVIDO').reverse());

  hayPedidosPendientes = computed(() => this.pedidosPendientes().length > 0);
  hayPedidosEnCurso = computed(() => this.pedidosEnCurso().length > 0);
  hayPedidosHistorial = computed(() => this.pedidosHistorial().length > 0);

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() { }

  /**
   * Inicia la escucha en tiempo real de Firestore para comandas ACTIVAS.
   */
  iniciarEscuchaPedidosEntrantes() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }

    const comandasRef = collection(this.firestore, 'comandas');
    
    // Consulta: Traemos 4 estados a la vez. 
    // Al usar 'in', aprovechamos el mismo índice compuesto (estado + fechaCreacion) que ya creaste.
    const q = query(
      comandasRef,
      where('estado', 'in', ['PENDIENTE', 'PREPARANDO', 'LISTO', 'SERVIDO']),
      orderBy('fechaCreacion', 'asc')
    );

    let isInitialLoad = true;

    runInInjectionContext(this.injector, () => {
      this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        this.zone.run(() => {
          // Lógica de notificaciones sonoras para pedidos nuevos
          if (!isInitialLoad) {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                const data = change.doc.data() as Comanda;
                if (data.estado === 'PENDIENTE') {
                  this.reproducirPing();
                }
              }
            });
          }
          isInitialLoad = false;

          const pedidos: Comanda[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Comanda;
            data.id = docSnap.id;
            pedidos.push(data);
          });
          // Actualiza la señal maestra, Angular recalcula automáticamente pendientes y enCurso
          this._comandasActivas.set(pedidos);
        });
      }, (error) => {
        this.zone.run(() => {
          console.error('Error escuchando pedidos activos:', error);
        });
      });
    });
  }

  detenerEscucha() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
    this._comandasActivas.set([]);
  }

  /**
   * Cambia dinámicamente el estado de una comanda.
   */
  async actualizarEstado(idComanda: string, nuevoEstado: EstadoComanda): Promise<void> {
    const docRef = doc(this.firestore, `comandas/${idComanda}`);
    try {
      await updateDoc(docRef, {
        estado: nuevoEstado,
        fechaActualizacion: Date.now()
      });
    } catch (error) {
      console.error(`Error al actualizar a ${nuevoEstado}:`, error);
      throw error;
    }
  }

  /**
   * Reproduce un sonido (ping) de "Campana de Servicio de Restaurante" 
   * utilizando la Web Audio API sintetizando frecuencias inarmónicas.
   */
  private reproducirPing() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

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
      playTone(3500, 'sine', 1.2, 0.5);      // Tono principal agudo y directo
      playTone(4800, 'sine', 0.8, 0.2);      // Brillo metálico
      playTone(6200, 'sine', 0.4, 0.1);      // Resonancia fina inicial
      
    } catch (e) {
      console.error('API de Audio no soportada en este navegador', e);
    }
  }
}
