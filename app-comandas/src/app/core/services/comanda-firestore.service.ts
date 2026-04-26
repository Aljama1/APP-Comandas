import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Comanda } from '../models/comanda.interface';

@Injectable({
  providedIn: 'root'
})
export class ComandaFirestoreService {
  private firestore = inject(Firestore);

  /**
   * Envía una comanda completa a la colección 'comandas' de Firestore.
   */
  async enviarComanda(comanda: Comanda): Promise<string> {
    try {
      const comandasCollection = collection(this.firestore, 'comandas');
      
      // Creamos el documento en Firestore
      // Usamos serverTimestamp() para asegurar que la hora sea la del servidor y no la del móvil
      const docRef = await addDoc(comandasCollection, {
        ...comanda,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });

      console.log('Comanda guardada en Firestore con ID:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('Error al enviar la comanda a Firestore:', error);
      throw error;
    }
  }
}
