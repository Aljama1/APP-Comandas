import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UsuarioService } from './usuario.service';
import { ComandaService } from './comanda.service';
import { ComandaFirestoreService } from './comanda-firestore.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private comandaService = inject(ComandaService);
  private comandaFirestoreService = inject(ComandaFirestoreService);

  private _adminUser = signal<User | null>(null);
  adminUser = this._adminUser.asReadonly();
  estaAutenticado = computed(() => this._adminUser() !== null);

  private authSub: Subscription;

  constructor() {
    this.authSub = authState(this.auth).subscribe((user) => {
      if (user && !user.isAnonymous) {
        this._adminUser.set(user);
      } else {
        this._adminUser.set(null);
      }
    });
  }

  ngOnDestroy() {
    this.authSub.unsubscribe();
  }

  /**
   * Autentica a un trabajador del restaurante.
   *
   * Antes de iniciar sesión, limpia cualquier sesión de cliente (anónima) y
   * los datos persistidos en localStorage para evitar contaminación cruzada
   * cuando un cliente y un admin usan el mismo dispositivo.
   */
  async login(email: string, pass: string): Promise<void> {
    try {
      this.limpiarEstadoCliente();
      if (this.auth.currentUser) {
        await signOut(this.auth);
      }
      await signInWithEmailAndPassword(this.auth, email, pass);
    } catch (error) {
      console.error('Error en login de staff:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión del trabajador y redirige al landing.
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigateByUrl('/');
  }

  private limpiarEstadoCliente(): void {
    this.comandaFirestoreService.limpiarSeguimiento();
    this.comandaService.vaciarComanda();
    this.usuarioService.limpiarPerfil();
  }
}
