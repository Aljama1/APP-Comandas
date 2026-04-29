import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Firestore, collection, addDoc, doc, onSnapshot, serverTimestamp, Unsubscribe } from '@angular/fire/firestore';
import { Comanda, EstadoComanda } from '../models/comanda.interface';

/**
 * Servicio responsable de la comunicación bidireccional con Firestore.
 *
 * Funciones principales:
 *  1. Enviar la comanda del cliente a la colección 'comandas'.
 *  2. Escuchar en tiempo real los cambios de estado que realiza la cocina
 *     sobre ese documento (patrón Observer mediante `onSnapshot`).
 *
 * El estado se expone como un Angular Signal para que cualquier componente
 * pueda reaccionar de forma declarativa sin suscripciones manuales.
 */
@Injectable({
  providedIn: 'root'
})
export class ComandaFirestoreService implements OnDestroy {
  private firestore = inject(Firestore);

  // --- Estado reactivo expuesto a la vista ---

  /** ID del documento en Firestore de la comanda activa (null si no hay ninguna) */
  public idComandaActiva = signal<string | null>(this.recuperarIdComanda());

  /** Último estado conocido de la comanda activa, actualizado en tiempo real */
  public estadoComandaActiva = signal<EstadoComanda | null>(null);

  /** Snapshot completo de la comanda para mostrar detalles en el seguimiento */
  public datosComandaActiva = signal<Comanda | null>(null);

  /** Indica si hay un error de conexión con Firestore */
  public errorEscucha = signal<string | null>(null);

  // Referencia interna para poder cancelar la suscripción al documento
  private cancelarEscucha: Unsubscribe | null = null;

  // Clave de localStorage para persistir el ID de la comanda entre recargas
  private readonly STORAGE_KEY_COMANDA_ID = 'trace_comanda_activa_id';

  constructor() {
    // Si hay una comanda activa guardada de una sesión anterior, reconectamos
    const idGuardado = this.recuperarIdComanda();
    if (idGuardado) {
      this.escucharComanda(idGuardado);
    }
  }

  // ─── Escritura: Enviar comanda a Firestore ───────────────────────

  /**
   * Persiste la comanda en la colección 'comandas' de Firestore.
   * Tras guardarla, activa automáticamente la escucha en tiempo real.
   */
  async enviarComanda(comanda: Comanda): Promise<string> {
    try {
      const comandasCollection = collection(this.firestore, 'comandas');

      // serverTimestamp() garantiza que la hora sea la del servidor (UTC),
      // evitando inconsistencias por la hora local del dispositivo del cliente.
      const docRef = await addDoc(comandasCollection, {
        ...comanda,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });

      console.log('Comanda guardada en Firestore con ID:', docRef.id);

      // Persistimos el ID para sobrevivir a recargas del navegador
      this.guardarIdComanda(docRef.id);
      this.idComandaActiva.set(docRef.id);

      // Iniciamos la escucha en tiempo real sobre el documento recién creado
      this.escucharComanda(docRef.id);

      return docRef.id;

    } catch (error) {
      console.error('Error al enviar la comanda a Firestore:', error);
      throw error;
    }
  }

  // ─── Lectura: Escucha en tiempo real (onSnapshot) ────────────────

  /**
   * Se suscribe a los cambios del documento `comandas/{id}` en Firestore.
   *
   * Cada vez que la cocina actualice el campo `estado` del documento,
   * este callback se dispara y actualiza los Signals locales, lo que
   * provoca que la vista del cliente se repinte instantáneamente.
   */
  public escucharComanda(idComanda: string): void {
    // Cancelamos cualquier escucha previa para evitar fugas de memoria
    this.detenerEscucha();

    const refDocumento = doc(this.firestore, 'comandas', idComanda);

    this.cancelarEscucha = onSnapshot(
      refDocumento,
      // Callback de éxito: se ejecuta cada vez que el documento cambia
      (snapshot) => {
        if (snapshot.exists()) {
          const datos = snapshot.data() as Comanda;
          this.datosComandaActiva.set({ ...datos, id: snapshot.id });
          this.estadoComandaActiva.set(datos.estado);
          this.errorEscucha.set(null);
        } else {
          // El documento fue eliminado desde el panel de administración
          this.estadoComandaActiva.set(null);
          this.datosComandaActiva.set(null);
        }
      },
      // Callback de error: problemas de red o permisos de Firestore
      (error) => {
        console.error('Error en la escucha de Firestore:', error);
        this.errorEscucha.set('No se pudo conectar con el servidor. Comprueba tu conexión.');
      }
    );
  }

  /**
   * Cancela la suscripción activa a Firestore y limpia el estado reactivo.
   * Se invoca al destruir el servicio o cuando el cliente cierra sesión.
   */
  public detenerEscucha(): void {
    if (this.cancelarEscucha) {
      this.cancelarEscucha();
      this.cancelarEscucha = null;
    }
  }

  /**
   * Limpia completamente el seguimiento: detiene la escucha,
   * borra el ID persistido y resetea los Signals.
   * Se usa cuando el pedido se completa o el usuario hace logout.
   */
  public limpiarSeguimiento(): void {
    this.detenerEscucha();
    this.idComandaActiva.set(null);
    this.estadoComandaActiva.set(null);
    this.datosComandaActiva.set(null);
    this.errorEscucha.set(null);
    localStorage.removeItem(this.STORAGE_KEY_COMANDA_ID);
  }

  // ─── Persistencia local del ID de comanda ────────────────────────

  private guardarIdComanda(id: string): void {
    localStorage.setItem(this.STORAGE_KEY_COMANDA_ID, id);
  }

  private recuperarIdComanda(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_COMANDA_ID);
  }

  // ─── Limpieza al destruir el servicio ────────────────────────────

  ngOnDestroy(): void {
    this.detenerEscucha();
  }
}
