import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Signal reactivo para saber si hay un administrador logueado
  private _adminUser = signal<User | null>(null);
  
  // Exponemos el estado de forma segura (solo lectura)
  adminUser = this._adminUser.asReadonly();
  
  // Computed útil para las vistas (ej. mostrar/ocultar botones)
  estaAutenticado = computed(() => this._adminUser() !== null);

  constructor() {
    // Escuchar reactivamente los cambios de estado de Firebase Auth
    authState(this.auth).subscribe((user) => {
      // Discriminamos: Los clientes usan Auth Anónima (isAnonymous = true).
      // El staff usa Auth con Email/Password (isAnonymous = false).
      if (user && !user.isAnonymous) {
        this._adminUser.set(user);
      } else {
        this._adminUser.set(null);
      }
    });
  }

  /**
   * Autentica a un trabajador del restaurante.
   */
  async login(email: string, pass: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, pass);
    } catch (error) {
      console.error('Error en login de staff:', error);
      throw error; // Lanzamos para que el componente lo capture y muestre un Toast/Alert
    }
  }

  /**
   * Cierra la sesión del trabajador y redirige al panel de login.
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/admin/login']);
  }
}
