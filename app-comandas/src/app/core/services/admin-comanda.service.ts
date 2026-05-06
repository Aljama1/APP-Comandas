import { Injectable, inject, signal, computed, NgZone, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Firestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { Comanda, EstadoComanda } from '../models/comanda.interface';
import { UserSettingsService } from './user-settings.service';

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

  // Señal para la vista de tickets (Por Mesa) - Solo pedidos con destino COCINA en preparación
  pedidosCocina = computed(() => {
    return this._comandasActivas()
      .filter(c => c.estado === 'PREPARANDO')
      .filter(c => c.lineasComanda.some(l => l.destino === 'COCINA' && !l.preparado));
  });

  // Señal análoga para el Barman - Pedidos en preparación con bebidas pendientes
  pedidosBarra = computed(() => {
    return this._comandasActivas()
      .filter(c => c.estado === 'PREPARANDO')
      .filter(c => c.lineasComanda.some(l => l.destino === 'BARRA' && !l.preparado));
  });

  // Nueva señal para la vista agregada (Resumen de Producción)
  // Aquí juntamos todos los platos iguales de diferentes mesas para que el cocinero
  // sepa exactamente cuántas raciones totales tiene que hacer de cada cosa.
  productosAgregadosCocina = computed(() => {
    const mapa = new Map<string, { nombre: string, cantidadTotal: number, mesas: string[], notas: string[] }>();

    this.pedidosCocina().forEach(comanda => {
      comanda.lineasComanda
        .filter(l => l.destino === 'COCINA' && !l.preparado) // Ignoramos los que ya están listos
        .forEach(linea => {
          // Buscamos si ya tenemos este producto en el mapa
          const productoExistente = mapa.get(linea.idProducto);
          
          if (productoExistente) {
            // Si ya existe, sumamos la cantidad y guardamos de qué mesa viene
            productoExistente.cantidadTotal += linea.cantidad;
            if (!productoExistente.mesas.includes(comanda.idMesa)) {
              productoExistente.mesas.push(comanda.idMesa);
            }
            // Guardamos las notas si las hay (ej. "sin sal")
            if (linea.notasEspeciales) {
              productoExistente.notas.push(`Mesa ${comanda.idMesa}: ${linea.notasEspeciales}`);
            }
          } else {
            // Si es la primera vez que lo vemos, lo inicializamos
            mapa.set(linea.idProducto, {
              nombre: linea.nombreProducto,
              cantidadTotal: linea.cantidad,
              mesas: [comanda.idMesa],
              notas: linea.notasEspeciales ? [`Mesa ${comanda.idMesa}: ${linea.notasEspeciales}`] : []
            });
          }
        });
    });

    // Devolvemos los valores del mapa como un array para poder iterarlos en el HTML con @for
    return Array.from(mapa.values());
  });

  // Bebidas agregadas por producto — el barman ve de un vistazo cuántas tiene que servir de cada cosa
  productosBarra = computed(() => {
    const mapa = new Map<string, { nombre: string, cantidadTotal: number, mesas: string[], notas: string[] }>();

    this.pedidosBarra().forEach(comanda => {
      comanda.lineasComanda
        .filter(l => l.destino === 'BARRA' && !l.preparado) // Solo bebidas pendientes
        .forEach(linea => {
          const existente = mapa.get(linea.idProducto);
          if (existente) {
            existente.cantidadTotal += linea.cantidad;
            if (!existente.mesas.includes(comanda.idMesa)) {
              existente.mesas.push(comanda.idMesa);
            }
            if (linea.notasEspeciales) {
              existente.notas.push(`Mesa ${comanda.idMesa}: ${linea.notasEspeciales}`);
            }
          } else {
            mapa.set(linea.idProducto, {
              nombre: linea.nombreProducto,
              cantidadTotal: linea.cantidad,
              mesas: [comanda.idMesa],
              notas: linea.notasEspeciales ? [`Mesa ${comanda.idMesa}: ${linea.notasEspeciales}`] : []
            });
          }
        });
    });

    return Array.from(mapa.values());
  });

  hayPedidosPendientes = computed(() => this.pedidosPendientes().length > 0);
  hayPedidosEnCurso = computed(() => this.pedidosEnCurso().length > 0);
  hayPedidosHistorial = computed(() => this.pedidosHistorial().length > 0);
  hayPedidosCocina = computed(() => this.pedidosCocina().length > 0);
  hayPedidosBarra = computed(() => this.pedidosBarra().length > 0);

  private unsubscribeSnapshot: (() => void) | null = null;
  private activeListeners = 0; // Contador para saber cuántos componentes están usando la escucha

  private userSettings = inject(UserSettingsService);

  constructor() { }

  /**
   * Inicia la escucha en tiempo real de Firestore para comandas ACTIVAS.
   */
  iniciarEscuchaPedidosEntrantes() {
    this.activeListeners++;
    
    // Si ya hay un listener activo, no creamos otro
    if (this.unsubscribeSnapshot) {
      return;
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
          if (!isInitialLoad && this.userSettings.soundEnabled()) {
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
    this.activeListeners--;
    
    // Solo detenemos la escucha real de Firestore si ningún componente lo necesita ya
    if (this.activeListeners <= 0) {
      this.activeListeners = 0;
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = null;
      }
      this._comandasActivas.set([]);
    }
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
   * Marca un plato específico de una comanda como preparado o no.
   * Si al marcarlo se completan todos los platos de cocina de esa comanda,
   * se cambia el estado global de la comanda a LISTO de forma automática.
   */
  async marcarLineaPreparada(idComanda: string, indexLinea: number, preparado: boolean): Promise<void> {
    const comanda = this._comandasActivas().find(c => c.id === idComanda);
    if (!comanda) return;

    // Clonamos el array de líneas para modificarlo de forma inmutable
    const nuevasLineas = [...comanda.lineasComanda];
    nuevasLineas[indexLinea] = { ...nuevasLineas[indexLinea], preparado };

    const docRef = doc(this.firestore, `comandas/${idComanda}`);
    
    // Auto-Marchar inteligente: La comanda solo pasa a LISTO cuando TANTO la cocina
    // COMO la barra han terminado con todos sus ítems.
    const todasLasLineas = nuevasLineas.filter(l => l.destino === 'COCINA' || l.destino === 'BARRA');
    const todosListos = todasLasLineas.length > 0 && todasLasLineas.every(l => l.preparado);

    try {
      if (todosListos) {
        // Auto-Marchar: Si todo lo de cocina está listo, marcamos la comanda como SERVIDO (completada)
        await updateDoc(docRef, {
          lineasComanda: nuevasLineas,
          estado: 'SERVIDO',
          fechaActualizacion: Date.now()
        });
      } else {
        // Solo actualizamos el tick de la línea
        await updateDoc(docRef, {
          lineasComanda: nuevasLineas,
          fechaActualizacion: Date.now()
        });
      }
    } catch (error) {
      console.error('Error al marcar plato preparado:', error);
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
