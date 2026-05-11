import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

/**
 * Guard funcional que protege las rutas de administración (/admin/*).
 * Verifica si existe una sesión de Firebase Auth activa y NO anónima.
 *
 * Usa auth.authStateReady() para esperar a que Firebase haya resuelto
 * completamente el estado de auth antes de leer auth.currentUser de
 * forma síncrona, evitando la race condition de firstValueFrom(authState()).
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    await auth.authStateReady();
    const user = auth.currentUser;

    if (user && !user.isAnonymous) {
      return true;
    }

    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  } catch (error) {
    console.error('Error en adminGuard:', error);
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  }
};
