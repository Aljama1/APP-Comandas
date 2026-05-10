import { Injectable, inject, signal, computed, OnDestroy, NgZone, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Firestore,
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Unsubscribe
} from '@angular/fire/firestore';
import { Comanda, EstadoComanda } from '../models/comanda.model';
import { MesaAccessValidatorService } from './mesa-access-validator.service';

/**
 * Servicio responsable de la comunicación bidireccional con Firestore.
 *
 * Funciones principales:
 *  1. Enviar comandas del cliente a la colección 'comandas'.
 *  2. Escuchar en tiempo real TODAS las comandas del cliente mediante
 *     una única query filtrada por `idCliente` + `idMesa`.
 *
 * Estrategia de escucha (patrón Observer sobre colección filtrada):
 *   En lugar de abrir un `onSnapshot` por cada documento individual
 *   (lo que consumiría N listeners), se usa una sola query con filtros
 *   `where`. Firestore mantiene una única conexión WebSocket y empuja
 *   todos los cambios de cualquier ronda del cliente. Esto resuelve
 *   el caso de múltiples rondas activas simultáneas (ej. Ronda 1 en
 *   PREPARANDO y Ronda 2 en PENDIENTE al mismo tiempo).
 *
 * El estado se expone como Angular Signals para que la vista reaccione
 * de forma declarativa sin suscripciones manuales.
 */
@Injectable({
  providedIn: 'root'
})
export class ComandaFirestoreService implements OnDestroy {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  private injector = inject(EnvironmentInjector);
  private mesaValidator = inject(MesaAccessValidatorService);

  // ─── Estado reactivo expuesto a la vista ─────────────────────────

  /**
   * Array con TODAS las comandas del cliente en esta sesión,
   * ordenadas por fecha de creación (ascendente).
   * Se actualiza en tiempo real mediante la query de Firestore.
   */
  public todasLasComandas = signal<Comanda[]>([]);

  /** Indica si hay un error de conexión con Firestore */
  public errorEscucha = signal<string | null>(null);

  // ─── Señales computadas derivadas ────────────────────────────────

  /** Número total de rondas enviadas en esta sesión */
  public totalRondas = computed(() => this.todasLasComandas().length);

  /** Indica si el cliente tiene al menos una comanda enviada */
  public tieneComandas = computed(() => this.todasLasComandas().length > 0);

  /** La comanda más reciente (la que se muestra con el stepper principal) */
  public comandaMasReciente = computed(() => {
    const todas = this.todasLasComandas();
    return todas.length > 0 ? todas[todas.length - 1] : null;
  });

  /** Estado de la comanda más reciente */
  public estadoComandaActiva = computed(() => {
    return this.comandaMasReciente()?.estado ?? null;
  });

  /** Verdadero si TODAS las rondas han sido servidas */
  public todasServidas = computed(() => {
    const todas = this.todasLasComandas();
    return todas.length > 0 && todas.every(c => c.estado === 'SERVIDO');
  });

  // ─── Estado interno ──────────────────────────────────────────────

  // Referencia para cancelar la suscripción a la query
  private cancelarEscucha: Unsubscribe | null = null;

  // Datos de sesión necesarios para reconstruir la query tras un F5
  private readonly STORAGE_KEY_SESION = 'trace_sesion_seguimiento';

  constructor() {
    // Si hay datos de sesión guardados, reconectamos la escucha
    const sesion = this.recuperarSesion();
    if (sesion) {
      this.escucharComandasDelCliente(sesion.idCliente, sesion.idMesa);
    }
  }

  // ─── Escritura: Enviar comanda a Firestore ───────────────────────

  /**
   * Persiste una nueva comanda en la colección 'comandas' de Firestore.
   * Cada invocación crea un documento independiente, permitiendo que
   * una mesa envíe tantas rondas de pedidos como necesite.
   *
   * VALIDACIÓN DE SEGURIDAD: Verifica que el idCliente (uid) y el idMesa
   * coincidan con el perfil autenticado del usuario. Esto previene:
   *  - Que un usuario envíe comandas a otra mesa modificando localStorage
   *  - Que se intente enviar con un uid falso
   *
   * Si es la primera comanda de la sesión, activa la escucha por query.
   * Si ya hay una escucha activa, la nueva comanda aparece automáticamente
   * en el array `todasLasComandas` gracias al listener de la query.
   *
   * @throws Error si la validación de seguridad falla
   */
  async enviarComanda(comanda: Comanda): Promise<string> {
    // Validación de seguridad: verificar que uid y mesaId sean válidos
    const mesaIdNumero = Number(comanda.idMesa);
    if (!this.mesaValidator.isValidMesaAccess(comanda.idCliente, mesaIdNumero)) {
      throw new Error(
        'Acceso denegado: El usuario no tiene permiso para enviar comandas a esta mesa. ' +
        'Verifique que no ha cambiado el mesaId en localStorage.'
      );
    }
    try {
      const comandasCollection = collection(this.firestore, 'comandas');

      // serverTimestamp() garantiza que la hora sea la del servidor (UTC),
      // evitando inconsistencias por la hora local del dispositivo del cliente.
      const docRef = await addDoc(comandasCollection, {
        ...comanda,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });



      // Persistimos los datos de sesión para sobrevivir a recargas (F5)
      this.guardarSesion(comanda.idCliente, comanda.idMesa);

      // Si aún no hay escucha activa, la activamos.
      // Si ya existe, la nueva comanda aparecerá sola en el array
      // porque la query filtra por idCliente + idMesa.
      if (!this.cancelarEscucha) {
        this.escucharComandasDelCliente(comanda.idCliente, comanda.idMesa);
      }

      return docRef.id;

    } catch (error) {
      console.error('Error al enviar la comanda a Firestore:', error);
      throw error;
    }
  }

  // ─── Lectura: Escucha en tiempo real (Query + onSnapshot) ────────

  /**
   * Se suscribe a TODAS las comandas del cliente para esta mesa.
   *
   * Usa una query filtrada: `idCliente == X AND idMesa == Y`,
   * ordenada por `fechaCreacion` ascendente. Así, con UNA sola
   * suscripción, recibimos actualizaciones de todas las rondas.
   *
   * VALIDACIÓN DE SEGURIDAD: Verifica que el idCliente y idMesa
   * correspondan al usuario autenticado antes de abrir el listener.
   *
   * NOTA: Firestore pedirá crear un índice compuesto la primera vez
   * que se ejecute esta query. Firebase genera un enlace directo
   * en la consola del navegador para crearlo con un clic.
   *
   * @throws Error si la validación de seguridad falla
   */
  public escucharComandasDelCliente(idCliente: string, idMesa: string): void {
    // Validación de seguridad: verificar que uid y mesaId sean válidos
    const mesaIdNumero = Number(idMesa);
    if (!this.mesaValidator.isValidMesaAccess(idCliente, mesaIdNumero)) {
      console.warn(
        'Acceso denegado a escucha de comandas: El usuario no tiene permiso para esta mesa.'
      );
      this.errorEscucha.set('Acceso denegado: No puede acceder a esta mesa.');
      return;
    }
    // Cancelamos cualquier escucha previa para evitar fugas de memoria
    this.detenerEscucha();

    const comandasRef = collection(this.firestore, 'comandas');

    // Construimos la query filtrada por cliente y mesa
    const consultaFiltrada = query(
      comandasRef,
      where('idCliente', '==', idCliente),
      where('idMesa', '==', idMesa),
      orderBy('fechaCreacion', 'asc')
    );

    runInInjectionContext(this.injector, () => {
      this.cancelarEscucha = onSnapshot(
        consultaFiltrada,
        (snapshot) => {
          // Usamos zone.run para asegurar que Angular detecte el cambio en dispositivos móviles
          this.zone.run(() => {
            const comandas: Comanda[] = snapshot.docs.map(doc => ({
              ...(doc.data() as Comanda),
              id: doc.id
            }));
            this.todasLasComandas.set(comandas);
            this.errorEscucha.set(null);
          });
        },
        (error) => {
          this.zone.run(() => {
            console.error('Error en la escucha de Firestore:', error);
            this.errorEscucha.set('No se pudo conectar con el servidor.');
          });
        }
      );
    });
  }

  /**
   * Cancela la suscripción activa a Firestore.
   */
  public detenerEscucha(): void {
    if (this.cancelarEscucha) {
      this.cancelarEscucha();
      this.cancelarEscucha = null;
    }
  }

  /**
   * Limpia completamente el seguimiento: detiene la escucha,
   * borra los datos de sesión y resetea todos los Signals.
   * Se usa cuando el usuario hace logout o cierra la mesa.
   */
  public limpiarSeguimiento(): void {
    this.detenerEscucha();
    this.todasLasComandas.set([]);
    this.errorEscucha.set(null);
    localStorage.removeItem(this.STORAGE_KEY_SESION);
  }

  // ─── Persistencia de datos de sesión ─────────────────────────────

  private guardarSesion(idCliente: string, idMesa: string): void {
    localStorage.setItem(this.STORAGE_KEY_SESION, JSON.stringify({ idCliente, idMesa }));
  }

  private recuperarSesion(): { idCliente: string; idMesa: string } | null {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY_SESION);
      return datos ? JSON.parse(datos) : null;
    } catch {
      return null;
    }
  }

  // ─── Limpieza al destruir el servicio ────────────────────────────

  ngOnDestroy(): void {
    this.detenerEscucha();
  }
}
