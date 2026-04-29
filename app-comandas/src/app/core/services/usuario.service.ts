import { Injectable, signal, computed } from '@angular/core';
import { PerfilUsuario } from '../models/perfil-usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly STORAGE_KEY = 'trace_perfil_usuario';

  // El Signal que mantiene el estado global del usuario
  private _perfil = signal<PerfilUsuario | null>(this.recuperarDeStorage());

  // Exponemos el perfil como solo lectura para que otros componentes no lo muten directamente
  perfil = this._perfil.asReadonly();

  // Selector computado para saber si el usuario ya hizo check-in
  estaAutenticado = computed(() => this._perfil() !== null);

  constructor() { }

  /**
   * Actualiza el perfil global del usuario.
   * Se usará desde el componente de Check-In.
   */
  establecerPerfil(nuevoPerfil: PerfilUsuario) {
    this._perfil.set(nuevoPerfil);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nuevoPerfil));
  }

  /**
   * Limpia la sesión del usuario (Logout/Reset)
   */
  limpiarPerfil() {
    this._perfil.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Intenta recuperar el perfil guardado en localStorage.
   */
  private recuperarDeStorage(): PerfilUsuario | null {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      return datos ? JSON.parse(datos) : null;
    } catch {
      return null;
    }
  }
}
