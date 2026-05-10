import { Injectable, inject } from '@angular/core';
import { UsuarioService } from './usuario.service';

/**
 * Servicio de validación de acceso a mesas.
 *
 * Propósito: Garantizar que un usuario autenticado solo pueda acceder
 * a la mesa asignada en su perfil, evitando que cambios maliciosos en
 * localStorage o parámetros de URL permitan acceso a otras mesas.
 *
 * Seguridad:
 *  - Valida que uid y mesaId coincidan con el perfil autenticado
 *  - Impide que un usuario cambie manualmente su mesaId en localStorage
 *  - Complemento a las reglas de seguridad de Firestore (validación client-side)
 *
 * Nota: Esta es validación client-side. Para seguridad completa,
 * se recomienda agregar reglas Firestore que verifiquen que el usuario
 * propietario sea quien realiza la operación.
 */
@Injectable({
  providedIn: 'root'
})
export class MesaAccessValidatorService {
  private usuarioService = inject(UsuarioService);

  /**
   * Valida que el usuario autenticado tenga acceso a la mesa especificada.
   *
   * @param uid - ID único del usuario (Firebase Auth UID)
   * @param mesaId - ID de la mesa a validar
   * @returns true si el usuario puede acceder a la mesa, false en caso contrario
   *
   * Casos de validación:
   *  1. El usuario NO está autenticado → false
   *  2. El perfil no tiene mesaId asignado → false
   *  3. El mesaId del perfil NO coincide con el mesaId solicitado → false (intento de acceso cruzado)
   *  4. El uid NO coincide con el uid del perfil → false (usuario suplantado)
   *  5. Todas las validaciones pasan → true
   */
  isValidMesaAccess(uid: string, mesaId: number | null): boolean {
    const perfil = this.usuarioService.perfil();

    // Usuario no autenticado
    if (!perfil || !uid) {
      return false;
    }

    // No hay mesaId asignado en el perfil
    if (perfil.mesaId === null || perfil.mesaId === undefined) {
      return false;
    }

    // El mesaId solicitado no coincide con el asignado
    if (mesaId !== perfil.mesaId) {
      return false;
    }

    // El uid no coincide con el del perfil (seguridad adicional)
    if (uid !== perfil.uid) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene la mesaId asignada al usuario autenticado.
   *
   * @param uid - ID único del usuario
   * @returns mesaId si existe, null en caso contrario
   *
   * Uso: Verificar cuál es la mesa correcta del usuario antes de
   * enviar una comanda, evitando confusiones de localStorage corrompido.
   */
  getMesaIdFromProfile(uid: string): number | null {
    const perfil = this.usuarioService.perfil();

    // Usuario no autenticado o uid no coincide
    if (!perfil || uid !== perfil.uid) {
      return null;
    }

    return perfil.mesaId ?? null;
  }

  /**
   * Valida que el usuario NO intente cambiar de mesa después del check-in.
   *
   * @param nuevoMesaId - El nuevo mesaId intentado
   * @returns true si se intenta un cambio (ataque o error), false si es legítimo
   *
   * Uso: Detectar intentos de cambio post-login (mitigación de ataques).
   * Ejemplo:
   *   if (this.validator.detectaMesaIdChange(inputMesaId)) {
   *     throw new Error('Cambio de mesa detectado. Reasigne el usuario.');
   *   }
   */
  detectaMesaIdChange(nuevoMesaId: number | null): boolean {
    const perfil = this.usuarioService.perfil();

    // Si no hay perfil o no hay mesaId original, no hay cambio
    if (!perfil || perfil.mesaId === null) {
      return false;
    }

    // Compara el nuevo mesaId con el original
    return nuevoMesaId !== perfil.mesaId;
  }
}
